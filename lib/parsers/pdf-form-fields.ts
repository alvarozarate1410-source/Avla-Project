import { getPdfjs } from "@/lib/parsers/pdfjs";

interface TextItemLike {
  str: string;
  transform: number[];
}

interface FieldEntry {
  value?: unknown;
  rect?: number[];
  page?: number;
  type?: string;
}

/**
 * Fillable PDF forms (F1/F3/DDJJ and similar templates filled digitally)
 * keep the typed-in values as AcroForm field data, not as regular text in
 * the page's content stream — plain text extraction (getTextContent())
 * only sees the printed labels, never what was actually typed into the
 * fields. That silently produced empty extraction on real F1 documents
 * even though classification worked fine (the labels alone are enough to
 * classify, just not enough to extract from).
 *
 * This reads the form field values directly and, for each one, finds the
 * nearest text sitting immediately to its left on the same visual line to
 * use as a synthesized label, so the output reads like normal
 * "Label: value" text that the existing regex-based interpreters already
 * know how to parse.
 */
export async function extractPdfFormFieldText(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await getPdfjs();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const fieldsByName = (await doc.getFieldObjects()) as Record<string, FieldEntry[]> | null;
    if (!fieldsByName) return "";

    const fieldsByPage = new Map<number, { value: string; rect: number[] }[]>();
    for (const entries of Object.values(fieldsByName)) {
      for (const entry of entries) {
        if (entry.type !== "text" || entry.page === undefined || entry.page < 0 || !entry.rect) continue;
        const value = typeof entry.value === "string" ? entry.value.trim() : "";
        if (!value) continue;
        const list = fieldsByPage.get(entry.page) ?? [];
        list.push({ value, rect: entry.rect });
        fieldsByPage.set(entry.page, list);
      }
    }
    if (fieldsByPage.size === 0) return "";

    const lines: string[] = [];
    for (const [pageIndex, fields] of fieldsByPage) {
      const page = await doc.getPage(pageIndex + 1);
      const content = await page.getTextContent();
      const items = (content.items as TextItemLike[]).filter((it) => typeof it.str === "string" && it.str.trim().length > 0);

      for (const field of fields) {
        const [x0, y0, , y1] = field.rect;
        const fieldMidY = (y0 + y1) / 2;
        const tolerance = Math.max(y1 - y0, 8);

        const sameRow = items
          .filter((it) => {
            const itemY = it.transform[5];
            return Math.abs(itemY - fieldMidY) <= tolerance && it.transform[4] < x0;
          })
          .sort((a, b) => a.transform[4] - b.transform[4]);

        const label = sameRow
          .map((it) => it.str)
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim()
          .slice(-80);

        lines.push(label ? `${label} ${field.value}` : field.value);
      }
    }

    return lines.join("\n");
  } catch (err) {
    console.error("[avla-nexus] PDF form field extraction failed:", err);
    return "";
  }
}
