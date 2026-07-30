import path from "node:path";
import * as XLSX from "xlsx";
import { ocrImageBuffer, ocrPdfBuffer } from "@/lib/parsers/ocr";

const MAX_CHARS = 6000;
// Below this many non-whitespace characters, a "text" PDF extraction is
// treated as a scanned/image-only page (no real text layer) and OCR'd.
const MIN_REAL_TEXT_CHARS = 30;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "bmp", "gif", "tif", "tiff"]);
let pdfWorkerConfigured = false;

export async function extractText(fileName: string, buffer: Buffer): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  try {
    if (ext && IMAGE_EXTENSIONS.has(ext)) {
      const text = await ocrImageBuffer(buffer);
      return text.slice(0, MAX_CHARS);
    }

    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      if (!pdfWorkerConfigured) {
        // pdfjs-dist's default worker auto-discovery resolves to a bundler chunk
        // path that doesn't exist under Turbopack/webpack server builds. Pointing
        // it at the on-disk worker file avoids "fake worker" resolution failures.
        PDFParse.setWorker(path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"));
        pdfWorkerConfigured = true;
      }
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text;

      if (text.replace(/\s/g, "").length < MIN_REAL_TEXT_CHARS) {
        // No real text layer — this PDF is a scan/photo saved as PDF.
        const ocrText = await ocrPdfBuffer(buffer);
        if (ocrText.trim().length > 0) return ocrText.slice(0, MAX_CHARS);
      }

      return text.slice(0, MAX_CHARS);
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_CHARS);
    }

    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const chunks: string[] = [];
      for (const sheetName of workbook.SheetNames.slice(0, 3)) {
        const sheet = workbook.Sheets[sheetName];
        chunks.push(`--- ${sheetName} ---`);
        chunks.push(XLSX.utils.sheet_to_csv(sheet).slice(0, 2000));
      }
      return chunks.join("\n").slice(0, MAX_CHARS);
    }
  } catch (err) {
    console.error(`[avla-nexus] extractText failed for ${fileName}:`, err);
    return "";
  }

  return "";
}
