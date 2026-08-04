import os from "node:os";
import path from "node:path";
import type { PDFiumDocument } from "@hyzyla/pdfium";

const LANG_PATH = path.join(process.cwd(), "node_modules/@tesseract.js-data/spa/4.0.0_best_int");
// A page-count cap alone can silently pick the *wrong* 8 pages of a large
// scanned document — e.g. a 90-100 page Bases Integradas where the pages
// that actually matter (the Requerimiento section) sit well past page 8.
// OCR_BUDGET_MS below is what actually bounds total time now, so this only
// needs to guard against a pathologically large or corrupted page count
// report, not do the real bounding — raised accordingly.
const MAX_OCR_PAGES = 25;
const OCR_TIMEOUT_MS = 20_000;
// Per-page timeouts alone don't bound total request time: render + recognize
// are two separate budgets, so 8 pages could legitimately take minutes —
// long past any serverless function's execution limit, and with no clean
// error sent back before the platform kills the function outright, that
// reads to the user as an upload that hangs in "Procesando" forever. This
// caps the *whole* multi-page OCR pass regardless of page count, so a
// request always finishes (with a clear "ran out of time" result for
// whatever pages didn't get processed) inside the route's own budget.
//
// Raised from an initial 45s after real single-page documents (a 108KB PNG,
// an 831KB DNI PDF) still hit the request-level timeout in production —
// nothing in a single small page should take anywhere near that long to
// *recognize*, which points at cold-start cost (Tesseract's WASM worker
// init + its gzip'd language model load, and PDFium's own WASM init) as the
// dominant cost, not per-page work. That cost is invisible in this sandbox
// because its dev/prod server processes stay warm across every test run —
// a real serverless cold start pays it on every fresh container. The timing
// logs below exist specifically to confirm that split from real Vercel
// function logs instead of guessing further.
const OCR_BUDGET_MS = 80_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workerPromise: Promise<any> | null = null;

/**
 * The OCR worker loads a ~3 MB language model on first use, so it's kept
 * as a singleton and reused across requests in this server process instead
 * of being recreated (and re-loaded) per document.
 */
function getWorker() {
  if (!workerPromise) {
    const t0 = Date.now();
    workerPromise = (async () => {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("spa", 1, {
        langPath: LANG_PATH,
        gzip: true,
        cachePath: path.join(os.tmpdir(), "avla-nexus-tesseract-cache"),
      });
      console.log(`[avla-nexus] OCR: tesseract worker cold start took ${Date.now() - t0}ms`);
      return worker;
    })();
  }
  return workerPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}: tiempo de espera agotado (${Math.round(ms / 1000)}s)`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export interface OcrResult {
  text: string;
  error?: string;
}

export async function ocrImageBuffer(buffer: Buffer, timeoutMs: number = OCR_TIMEOUT_MS): Promise<OcrResult> {
  try {
    const worker = await getWorker();
    const t0 = Date.now();
    const { data } = await withTimeout<{ data: { text: string } }>(worker.recognize(buffer), timeoutMs, "OCR de imagen");
    console.log(`[avla-nexus] OCR: recognize() took ${Date.now() - t0}ms`);
    return { text: data.text ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[avla-nexus] OCR failed for image:", err);
    return { text: "", error: message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfiumLibraryPromise: Promise<any> | null = null;

/**
 * PDFium compiled to WebAssembly, bundled with the package — no system
 * binary and no native canvas addon involved. This matters because both of
 * the alternatives were tried and rejected: shelling out to poppler's
 * `pdftoppm` only works where that binary happens to be installed (it isn't
 * on Vercel's serverless runtime, so scanned PDFs there would silently get
 * no OCR text at all), and rendering via pdfjs-dist + a native canvas
 * package (@napi-rs/canvas) reproducibly segfaulted the whole Node process
 * in testing — unacceptable since a single malformed PDF could take down
 * the server for every other in-flight request.
 */
function getPdfium() {
  if (!pdfiumLibraryPromise) {
    const t0 = Date.now();
    pdfiumLibraryPromise = (async () => {
      const { PDFiumLibrary } = await import("@hyzyla/pdfium");
      const library = await PDFiumLibrary.init();
      console.log(`[avla-nexus] OCR: pdfium cold start took ${Date.now() - t0}ms`);
      return library;
    })();
  }
  return pdfiumLibraryPromise;
}

export interface PageOcrResult {
  pageIndex: number;
  text: string;
  error?: string;
  /** True if this page was never attempted because the overall OCR time budget ran out first. */
  skippedByBudget?: boolean;
}

/**
 * OCRs only the given (0-based) page indices of a PDF — used so a document
 * that mixes real text pages with scanned/image pages only pays the OCR
 * cost for the pages that actually need it, instead of the whole file.
 * Bounded to MAX_OCR_PAGES *and* to OCR_BUDGET_MS of total wall-clock time —
 * a page count cap alone doesn't stop a handful of slow-to-render or
 * slow-to-recognize pages from still blowing well past a serverless
 * function's execution limit.
 *
 * `shouldStop`, if given, is checked after every completed page against the
 * text OCR'd so far — for a large scanned document, once whatever the
 * caller actually needs has already been found, grinding through the
 * remaining pages just burns time budget on content nobody's going to read.
 * (e.g. extract-text.ts uses this so a 90+ page Bases Integradas file stops
 * once its Requerimiento section — lugar/monto/plazo/beneficiario — has
 * been captured, rather than OCR'ing the rest of the tender document.)
 */
export async function ocrPdfPages(
  buffer: Buffer,
  pageIndices: number[],
  options?: { shouldStop?: (ocredTextSoFar: string) => boolean }
): Promise<PageOcrResult[]> {
  const targets = pageIndices.slice(0, MAX_OCR_PAGES);
  const t0 = Date.now();
  const deadline = t0 + OCR_BUDGET_MS;
  // PDFium's WASM init and Tesseract's worker+language-model init are two
  // independent cold starts — kicking the worker off here, concurrently
  // with PDFium below, lets them overlap instead of stacking sequentially
  // (which is what happened before: PDFium loaded first, and the worker
  // only started its own cold start lazily once the *first* page's render
  // had already finished, paying both costs back to back).
  void getWorker();

  let document: PDFiumDocument | undefined;
  try {
    const library = await getPdfium();
    const doc = await library.loadDocument(buffer);
    document = doc;
    const sharpModule = (await import("sharp")).default;

    const results: PageOcrResult[] = [];
    for (const pageIndex of targets) {
      const remaining = deadline - Date.now();
      // Bail out before even starting a page once there's too little budget
      // left to plausibly finish it, rather than starting it and getting cut
      // off mid-render/mid-recognize by the function's own hard timeout.
      if (remaining < 3_000) {
        console.log(`[avla-nexus] OCR: page ${pageIndex + 1} skipped, budget exhausted at +${Date.now() - t0}ms`);
        results.push({
          pageIndex,
          text: "",
          error: "No se alcanzó a procesar por límite de tiempo.",
          skippedByBudget: true,
        });
        continue;
      }

      try {
        const page = doc.getPage(pageIndex);
        const renderBudget = Math.min(OCR_TIMEOUT_MS, remaining);
        const renderStart = Date.now();
        const image = await withTimeout<{ data: Uint8Array }>(
          page.render({
            // Scale 2 (~144dpi) reliably garbles small embedded content —
            // e.g. a DNI card photographed and dropped onto an otherwise
            // blank A4 page renders at a tiny effective pixel size, and
            // Tesseract corrupts individual digits in dense text like the
            // MRZ line. Scale 4 costs well under a second more per page
            // (measured ~0.4s render + comparable OCR time) and reliably
            // gets those digits right.
            scale: 4,
            render: async (options: { data: Uint8Array; width: number; height: number }) =>
              sharpModule(options.data, { raw: { width: options.width, height: options.height, channels: 4 } })
                .png()
                .toBuffer(),
          }),
          renderBudget,
          `Renderizado de página ${pageIndex + 1}`
        );
        console.log(`[avla-nexus] OCR: page ${pageIndex + 1} render took ${Date.now() - renderStart}ms (elapsed +${Date.now() - t0}ms)`);
        const recognizeBudget = Math.min(OCR_TIMEOUT_MS, Math.max(1_000, deadline - Date.now()));
        const ocr = await ocrImageBuffer(Buffer.from(image.data), recognizeBudget);
        console.log(`[avla-nexus] OCR: page ${pageIndex + 1} done, elapsed +${Date.now() - t0}ms`);
        results.push({ pageIndex, text: ocr.text, error: ocr.error });

        if (options?.shouldStop?.(results.map((r) => r.text).join("\n"))) {
          console.log(`[avla-nexus] OCR: stopping early after page ${pageIndex + 1} — target content already found, elapsed +${Date.now() - t0}ms`);
          break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[avla-nexus] OCR failed for PDF page ${pageIndex + 1}:`, err);
        results.push({ pageIndex, text: "", error: message });
      }
    }
    return results;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[avla-nexus] Could not open PDF for page-level OCR:", err);
    return targets.map((pageIndex) => ({ pageIndex, text: "", error: message }));
  } finally {
    document?.destroy();
  }
}

/** Whole-document OCR fallback for PDFs with no text layer at all on any page. */
export async function ocrPdfBuffer(buffer: Buffer): Promise<OcrResult> {
  let document: PDFiumDocument | undefined;
  try {
    const library = await getPdfium();
    const doc = await library.loadDocument(buffer);
    document = doc;
    const pageCount = Math.min(doc.getPageCount(), MAX_OCR_PAGES);
    const results = await ocrPdfPages(buffer, Array.from({ length: pageCount }, (_, i) => i));
    const firstError = results.find((r) => r.error && !r.text)?.error;
    const text = results.map((r) => r.text).join("\n\n");
    return { text, error: text.trim().length === 0 ? firstError : undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[avla-nexus] OCR fallback failed for scanned PDF:", err);
    return { text: "", error: message };
  } finally {
    document?.destroy();
  }
}
