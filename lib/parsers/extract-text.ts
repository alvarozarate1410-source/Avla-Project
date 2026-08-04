import * as XLSX from "xlsx";
import { ocrImageBuffer, ocrPdfPages } from "@/lib/parsers/ocr";
import { extractPdfFormFieldText } from "@/lib/parsers/pdf-form-fields";
import { getPdfjs } from "@/lib/parsers/pdfjs";
import { interpretBasesIntegradas } from "@/lib/services/proyecto-interpreter";

const MAX_CHARS = 6000;
// Below this many non-whitespace characters, a page is treated as having no
// real text layer (scanned/image page) and gets OCR'd individually — this
// runs per page so a PDF that mixes native-text pages with scanned pages
// (e.g. a cover letter followed by a scanned attachment) OCRs only the
// pages that actually need it instead of the whole file or none of it.
const MIN_REAL_TEXT_CHARS_PER_PAGE = 20;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "bmp", "gif", "tif", "tiff"]);

interface TextItemLike {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
}

/**
 * pdfjs's getTextContent() doesn't hand back ready-to-read lines — it's a
 * flat list of positioned text runs, and it splits a single word into
 * adjacent runs whenever the run's style changes mid-word (seen on real
 * documents: a stray font/kerning break turned "Avla" into two runs, "A"
 * and "vla"). Always inserting a space between runs glues a phantom space
 * into words like that; never inserting one glues genuinely separate words
 * together. Comparing each run's start x to the previous run's *measured*
 * end x (its own transform + width, not just accumulated guesswork) is
 * what actually distinguishes "next run starts where this one ended" (same
 * word, no space) from "next run starts further right" (real gap, space).
 */
function joinPageTextItems(items: TextItemLike[]): string {
  let text = "";
  let prevEndX: number | null = null;
  let prevY: number | null = null;

  for (const item of items) {
    if (typeof item.str !== "string" || !item.str) continue;
    const [, , , , x, y] = item.transform ?? [];

    if (typeof x === "number" && typeof y === "number" && prevY !== null && prevEndX !== null && Math.abs(y - prevY) < 2) {
      if (x - prevEndX > 1) text += " ";
    } else if (text && !/[\s\n]$/.test(text)) {
      text += " ";
    }

    text += item.str;
    prevEndX = typeof x === "number" ? x + (item.width ?? 0) : null;
    prevY = typeof y === "number" ? y : null;

    if (item.hasEOL) {
      text += "\n";
      prevEndX = null;
      prevY = null;
    }
  }

  return text;
}

// A Bases Integradas tender document can legitimately run 90-100+ pages,
// and often mixes native-text pages with scanned ones (signature pages,
// stamped annexes) — OCR'ing all of them page-by-page in order would burn
// through the OCR time budget long before ever reaching whichever page
// happens to hold the Requerimiento section (lugar/monto/plazo/beneficiario)
// this document type is actually needed for. Once that section has already
// been found — whether from native text alone or after OCR'ing a handful of
// scanned pages — there's nothing left worth spending more OCR time on, so
// ocrPdfPages() is told to stop as soon as this is true rather than
// continuing through the rest of a long document.
function hasFoundRequerimiento(text: string): boolean {
  const norm = text.toLowerCase();
  const looksLikeBasesIntegradas = /bases integradas|requerimientos t[eé]cnicos m[ií]nimos|secci[oó]n espec[ií]fica|sistema de contrataci[oó]n/.test(
    norm
  );
  if (!looksLikeBasesIntegradas) return false;

  const req = interpretBasesIntegradas(text);
  let fieldsFound = 0;
  if (req.lugarEjecucion) fieldsFound++;
  if (req.montoAdjudicado !== undefined) fieldsFound++;
  if (req.beneficiario) fieldsFound++;
  if (req.plazoValor !== undefined) fieldsFound++;
  return fieldsFound >= 2;
}

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
      // Extracted directly via pdfjs-dist's getTextContent() — not the
      // `pdf-parse` package, whose bundled pdfjs copy additionally builds a
      // full render operator list (for its image-extraction feature) that
      // pulls in DOMMatrix/Path2D/ImageData through an optional
      // @napi-rs/canvas polyfill it self-detects with a dynamic require().
      // That require is invisible to Vercel's file tracer, so its native
      // binary silently doesn't ship in production even though it resolves
      // fine locally — confirmed by two rounds of "DOMMatrix is not
      // defined" crashes that only ever reproduced on Vercel.
      // getTextContent() walks the text-showing operators directly and
      // never touches canvas/rendering machinery at all.
      const pdfjsLib = await getPdfjs();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pages.push({ num: i, text: joinPageTextItems(content.items as TextItemLike[]) });
      }
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
      const needsOcrSet = new Set(pagesNeedingOcr);
      const nativeText = pageTexts.filter((_, i) => !needsOcrSet.has(i)).join("\n");
      const ocrResults = await ocrPdfPages(buffer, pagesNeedingOcr, {
        shouldStop: (ocredSoFar) => hasFoundRequerimiento(`${nativeText}\n${ocredSoFar}`),
      });
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
