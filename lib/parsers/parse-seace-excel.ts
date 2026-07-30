import * as XLSX from "xlsx";
import type { ExperienceMatch, ExperienceMatchContrato } from "@/lib/types";

const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "del", "para", "con", "por", "en", "y", "a", "un", "una",
  "al", "que", "se", "su", "sus", "es", "the", "and", "for", "obra", "obras", "proyecto",
]);

function tokenizeKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
    )
  );
}

function findColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => h.toLowerCase());
  for (const c of candidates) {
    const idx = norm.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseMonto(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const num = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/**
 * Heuristic analyzer for SEACE experience exports: real SEACE downloads vary in
 * column naming/order, so we detect columns by header keywords rather than
 * assuming a fixed schema, then compare each contract's "objeto" text against
 * keywords derived from the target project to estimate compatibility.
 */
export function analyzeSeaceWorkbook(buffer: Buffer, projectContext: string): ExperienceMatch | null {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return null;
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return null;
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  if (rows.length < 2) return null;

  const headers = rows[0].map((h) => String(h ?? ""));
  const objetoIdx = findColumn(headers, ["objeto", "descripcion", "detalle"]);
  const montoIdx = findColumn(headers, ["monto", "valor referencial", "importe"]);
  const entidadIdx = findColumn(headers, ["entidad", "convocante", "cliente"]);
  const anioIdx = findColumn(headers, ["año", "anio", "fecha", "year"]);

  const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== ""));
  if (dataRows.length === 0) return null;

  const keywords = tokenizeKeywords(projectContext);

  const allContratos: ExperienceMatchContrato[] = dataRows.slice(0, 300).map((r, i) => {
    const objeto = objetoIdx !== -1 ? String(r[objetoIdx] ?? "") : "";
    const objetoNorm = objeto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const compatible = keywords.length > 0 && keywords.some((k) => objetoNorm.includes(k));
    const anioRaw = anioIdx !== -1 ? r[anioIdx] : undefined;
    const anioMatch = String(anioRaw ?? "").match(/(20\d{2})/);

    return {
      id: `seace-${i}`,
      entidad: entidadIdx !== -1 && r[entidadIdx] ? String(r[entidadIdx]) : "Sin especificar",
      objeto: objeto || "Sin descripción",
      monto: montoIdx !== -1 ? parseMonto(r[montoIdx]) : 0,
      anio: anioMatch ? Number(anioMatch[1]) : new Date().getFullYear(),
      categoria: compatible ? "Compatible con el objeto" : "Sin relación directa",
      compatible,
    };
  });

  const total = allContratos.length;
  const compatibles = allContratos.filter((c) => c.compatible).length;
  const projectFitScore = total > 0 ? Math.round((compatibles / total) * 100) : 0;

  const categorias = [
    {
      nombre: "Compatible con el objeto",
      cantidad: compatibles,
      pct: total ? Math.round((compatibles / total) * 100) : 0,
    },
    {
      nombre: "Sin relación directa",
      cantidad: total - compatibles,
      pct: total ? Math.round(((total - compatibles) / total) * 100) : 0,
    },
  ];

  const explicacion =
    keywords.length > 0
      ? `Se analizaron ${total} contrato(s) declarados en SEACE. ${compatibles} corresponden a proyectos cuyo objeto coincide con palabras clave del proyecto actual (${keywords
          .slice(0, 4)
          .join(", ")}), lo que ${
          projectFitScore >= 60 ? "demuestra alta alineación" : "sugiere alineación limitada"
        } con el objeto del expediente.`
      : `Se analizaron ${total} contrato(s) declarados en SEACE. No fue posible determinar palabras clave del proyecto para comparar automáticamente; se recomienda revisión manual de compatibilidad.`;

  const riesgos: string[] = [];
  if (keywords.length > 0 && projectFitScore < 50) {
    riesgos.push("Menos de la mitad de la experiencia declarada se relaciona directamente con el objeto del proyecto.");
  }
  const sinEntidad = allContratos.filter((c) => c.entidad === "Sin especificar").length;
  if (sinEntidad > 0) {
    riesgos.push(`${sinEntidad} contrato(s) no especifican la entidad convocante; se recomienda validación manual.`);
  }

  return {
    projectFitScore,
    contratosAnalizados: total,
    contratosCompatibles: compatibles,
    explicacion,
    riesgos,
    categorias,
    contratos: allContratos.slice(0, 10),
  };
}
