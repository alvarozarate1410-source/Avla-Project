import path from "node:path";
import * as XLSX from "xlsx";
import { ocrImageBuffer, ocrPdfPages } from "@/lib/parsers/ocr";
import { extractPdfFormFieldText } from "@/lib/parsers/pdf-form-fields";

const MAX_CHARS = 6000;
// Below this many non-whitespace characters, a page is treated as having no
// real text layer (scanned/image page) and gets OCR'd individually — this
// runs per page so a PDF that mixes native-text pages with scanned pages
// (e.g. a cover letter followed by a scanned attachment) OCRs only the
// pages that actually need it instead of the whole file or none of it.
const MIN_REAL_TEXT_CHARS_PER_PAGE = 20;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "bmp", "gif", "tif", "tiff"]);
let pdfWorkerConfigured = false;

export type ExtractionMethod = "pdf-text" | "pdf-ocr" | "pdf-mixed" | "image-ocr" | "docx" | "xlsx" | "empty" | "unsupported";

export interface ExtractionResult {
  text: string;
  method: ExtractionMethod;
  /** Pages that needed OCR (PDFs only). */
  pagesOcred?: number;
  totalPages?: number;
  /** Extraction produced *some* text but something notable happened along the way. */
  warning?: string;
  /** Extraction produced no usable text at all, with a specific reason why. */
  error?: string;
}

export async function extractText(fileName: string, buffer: Buffer): Promise<ExtractionResult> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext && IMAGE_EXTENSIONS.has(ext)) {
    const ocr = await ocrImageBuffer(buffer);
    if (ocr.error && !ocr.text.trim()) {
      return { text: "", method: "image-ocr", error: `El reconocimiento óptico no pudo procesar la imagen: ${ocr.error}` };
    }
    if (!ocr.text.trim()) {
      return { text: "", method: "image-ocr", error: "El reconocimiento óptico no encontró texto legible en la imagen." };
    }
    return { text: ocr.text.slice(0, MAX_CHARS), method: "image-ocr" };
  }

  if (ext === "pdf") {
    let pages: { num: number; text: string }[];
    try {
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
      pages = result.pages;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[avla-nexus] PDF parsing failed for ${fileName}:`, err);
      return { text: "", method: "unsupported", error: `El PDF no se pudo abrir (¿está dañado o protegido?): ${message}` };
    }

    if (pages.length === 0) {
      return { text: "", method: "empty", error: "El PDF no tiene páginas." };
    }

    const pageTexts: string[] = pages.map((p) => p.text);
    const pagesNeedingOcr = pages
      .map((p, i) => (p.text.replace(/\s/g, "").length < MIN_REAL_TEXT_CHARS_PER_PAGE ? i : -1))
      .filter((i) => i >= 0);

    const ocrFailures: string[] = [];
    if (pagesNeedingOcr.length > 0) {
      const ocrResults = await ocrPdfPages(buffer, pagesNeedingOcr);
      for (const r of ocrResults) {
        pageTexts[r.pageIndex] = r.text;
        if (r.error && !r.text.trim()) ocrFailures.push(`página ${r.pageIndex + 1} (${r.error})`);
      }
    }

    let formFieldText = "";
    try {
      formFieldText = await extractPdfFormFieldText(buffer);
    } catch (err) {
      console.error(`[avla-nexus] Form field extraction failed for ${fileName}:`, err);
    }

    // Synthesized field lines go first: they're unambiguous "label value"
    // pairs, while the raw content-stream text may have the same labels
    // sitting right above their (blank, un-filled-in) form field with no
    // value at all — first-match regexes should prefer the real data.
    const combined = [formFieldText, ...pageTexts].filter(Boolean).join("\n");

    const method: ExtractionMethod =
      pagesNeedingOcr.length === 0 ? "pdf-text" : pagesNeedingOcr.length === pages.length ? "pdf-ocr" : "pdf-mixed";

    if (combined.replace(/\s/g, "").length === 0) {
      return {
        text: "",
        method,
        pagesOcred: pagesNeedingOcr.length,
        totalPages: pages.length,
        error:
          ocrFailures.length > 0
            ? `No se pudo extraer texto de ninguna página (OCR falló en ${ocrFailures.join(", ")}).`
            : "El PDF no contiene texto reconocible en ninguna página, ni siquiera vía OCR.",
      };
    }

    return {
      text: combined.slice(0, MAX_CHARS),
      method,
      pagesOcred: pagesNeedingOcr.length,
      totalPages: pages.length,
      warning: ocrFailures.length > 0 ? `El OCR no reconoció texto en: ${ocrFailures.join(", ")}.` : undefined,
    };
  }

  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value.trim()) {
        return { text: "", method: "docx", error: "El documento Word no contiene texto (¿está vacío o solo tiene imágenes?)." };
      }
      return { text: result.value.slice(0, MAX_CHARS), method: "docx" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[avla-nexus] DOCX parsing failed for ${fileName}:`, err);
      return { text: "", method: "docx", error: `El Word no se pudo abrir (¿está dañado?): ${message}` };
    }
  }

  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const chunks: string[] = [];
      for (const sheetName of workbook.SheetNames.slice(0, 3)) {
        const sheet = workbook.Sheets[sheetName];
        chunks.push(`--- ${sheetName} ---`);
        chunks.push(XLSX.utils.sheet_to_csv(sheet).slice(0, 2000));
      }
      const text = chunks.join("\n").slice(0, MAX_CHARS);
      if (!text.trim()) {
        return { text: "", method: "xlsx", error: "El Excel no tiene datos en ninguna hoja." };
      }
      return { text, method: "xlsx" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[avla-nexus] Spreadsheet parsing failed for ${fileName}:`, err);
      return { text: "", method: "xlsx", error: `El Excel no se pudo abrir (¿está dañado?): ${message}` };
    }
  }

  return { text: "", method: "unsupported", error: `Formato de archivo no soportado (.${ext ?? "desconocido"}).` };
}
