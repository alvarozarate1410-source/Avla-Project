import path from "node:path";
import * as XLSX from "xlsx";

const MAX_CHARS = 6000;
let pdfWorkerConfigured = false;

export async function extractText(fileName: string, buffer: Buffer): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  try {
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
      return result.text.slice(0, MAX_CHARS);
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
