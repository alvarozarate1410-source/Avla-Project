import os from "node:os";
import path from "node:path";
import type { PDFiumDocument } from "@hyzyla/pdfium";

const LANG_PATH = path.join(process.cwd(), "node_modules/@tesseract.js-data/spa/4.0.0_best_int");
const MAX_PDF_PAGES = 4;

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

export async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(buffer);
    return data.text ?? "";
  } catch (err) {
    console.error("[avla-nexus] OCR failed for image:", err);
    return "";
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

/**
 * Scanned PDFs (a photo/scan saved as PDF) have no selectable text layer, so
 * pdf-parse comes back empty. This rasterizes the first pages to PNG via
 * PDFium and runs each page image through OCR.
 */
export async function ocrPdfBuffer(buffer: Buffer): Promise<string> {
  let document: PDFiumDocument | undefined;
  try {
    const library = await getPdfium();
    const doc = await library.loadDocument(buffer);
    document = doc;
    const sharpModule = (await import("sharp")).default;

    const pageCount = Math.min(doc.getPageCount(), MAX_PDF_PAGES);
    const pageTexts: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = doc.getPage(i);
      const image = await page.render({
        scale: 2,
        render: async (options: { data: Uint8Array; width: number; height: number }) =>
          sharpModule(options.data, { raw: { width: options.width, height: options.height, channels: 4 } })
            .png()
            .toBuffer(),
      });
      pageTexts.push(await ocrImageBuffer(Buffer.from(image.data)));
    }
    return pageTexts.join("\n\n");
  } catch (err) {
    console.error("[avla-nexus] OCR fallback failed for scanned PDF:", err);
    return "";
  } finally {
    document?.destroy();
  }
}
