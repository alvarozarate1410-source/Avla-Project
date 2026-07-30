import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

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

let pdftoppmAvailable: boolean | null = null;

async function isPdftoppmAvailable(): Promise<boolean> {
  if (pdftoppmAvailable !== null) return pdftoppmAvailable;
  try {
    await execFileAsync("pdftoppm", ["-v"]);
    pdftoppmAvailable = true;
  } catch {
    pdftoppmAvailable = false;
  }
  return pdftoppmAvailable;
}

/**
 * Scanned PDFs (a photo/scan saved as PDF) have no selectable text layer,
 * so pdf-parse comes back empty. This rasterizes the first pages to PNG via
 * poppler's `pdftoppm` — a separate OS process, so a malformed PDF can't
 * crash the Next.js server the way an in-process native PDF renderer could
 * — and runs each page image through OCR. If `pdftoppm` isn't installed on
 * the host, this quietly returns an empty string instead of failing the
 * upload.
 */
export async function ocrPdfBuffer(buffer: Buffer): Promise<string> {
  if (!(await isPdftoppmAvailable())) return "";

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "avla-ocr-"));
  const pdfPath = path.join(workDir, "input.pdf");
  const prefix = path.join(workDir, "page");

  try {
    await fs.writeFile(pdfPath, buffer);
    await execFileAsync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", String(MAX_PDF_PAGES), pdfPath, prefix]);

    const files = (await fs.readdir(workDir)).filter((f) => f.startsWith("page") && f.endsWith(".png")).sort();
    const pageTexts: string[] = [];
    for (const file of files) {
      const pageBuffer = await fs.readFile(path.join(workDir, file));
      pageTexts.push(await ocrImageBuffer(pageBuffer));
    }
    return pageTexts.join("\n\n");
  } catch (err) {
    console.error("[avla-nexus] OCR fallback failed for scanned PDF:", err);
    return "";
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
