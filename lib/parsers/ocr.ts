import os from "node:os";
import path from "node:path";
import type { PDFiumDocument } from "@hyzyla/pdfium";

const LANG_PATH = path.join(process.cwd(), "node_modules/@tesseract.js-data/spa/4.0.0_best_int");
const MAX_OCR_PAGES = 8;
const OCR_TIMEOUT_MS = 25_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workerPromise: Promise<any> | null = null;

/**
 * The OCR worker loads a ~3 MB language model on first use, so it's kept
 * as a singleton and reused across requests in this server process instead
 * of being recreated (and re-loaded) per document.
 */
function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const Tesseract = await import("tesseract.js");
      return Tesseract.createWorker("spa", 1, {
        langPath: LANG_PATH,
        gzip: true,
        cachePath: path.join(os.tmpdir(), "avla-nexus-tesseract-cache"),
      });
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

export async function ocrImageBuffer(buffer: Buffer): Promise<OcrResult> {
  try {
    const worker = await getWorker();
    const { data } = await withTimeout<{ data: { text: string } }>(worker.recognize(buffer), OCR_TIMEOUT_MS, "OCR de imagen");
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
    pdfiumLibraryPromise = (async () => {
      const { PDFiumLibrary } = await import("@hyzyla/pdfium");
      return PDFiumLibrary.init();
    })();
  }
  return pdfiumLibraryPromise;
}

export interface PageOcrResult {
  pageIndex: number;
  text: string;
  error?: string;
}

/**
 * OCRs only the given (0-based) page indices of a PDF — used so a document
 * that mixes real text pages with scanned/image pages only pays the OCR
 * cost for the pages that actually need it, instead of the whole file.
 * Bounded to MAX_OCR_PAGES so one huge scanned bundle can't stall a request
 * indefinitely.
 */
export async function ocrPdfPages(buffer: Buffer, pageIndices: number[]): Promise<PageOcrResult[]> {
  const targets = pageIndices.slice(0, MAX_OCR_PAGES);
  let document: PDFiumDocument | undefined;
  try {
    const library = await getPdfium();
    const doc = await library.loadDocument(buffer);
    document = doc;
    const sharpModule = (await import("sharp")).default;

    const results: PageOcrResult[] = [];
    for (const pageIndex of targets) {
      try {
        const page = doc.getPage(pageIndex);
        const image = await withTimeout<{ data: Uint8Array }>(
          page.render({
            scale: 2,
            render: async (options: { data: Uint8Array; width: number; height: number }) =>
              sharpModule(options.data, { raw: { width: options.width, height: options.height, channels: 4 } })
                .png()
                .toBuffer(),
          }),
          OCR_TIMEOUT_MS,
          `Renderizado de página ${pageIndex + 1}`
        );
        const ocr = await ocrImageBuffer(Buffer.from(image.data));
        results.push({ pageIndex, text: ocr.text, error: ocr.error });
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
