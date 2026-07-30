import type { InformacionExtraida, RequerimientoInfo } from "@/lib/types";
import { findMoneyNear } from "@/lib/parsers/money";

// Common CIIU (Revisión 4) codes for activities frequently seen in AVLA's
// portfolio — used as a fallback when the source document states the
// activity in words but doesn't print the code itself.
const CIIU_BY_KEYWORD: { keywords: string[]; code: string }[] = [
  { keywords: ["construccion de edificios"], code: "4100" },
  { keywords: ["construccion de carreteras", "construccion de vias"], code: "4210" },
  { keywords: ["construccion de obras de ingenieria civil", "obras de ingenieria civil"], code: "4290" },
  { keywords: ["instalaciones electricas"], code: "4321" },
  { keywords: ["actividades de arquitectura e ingenieria"], code: "7110" },
  { keywords: ["venta al por mayor"], code: "4649" },
  { keywords: ["transporte de carga"], code: "4923" },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function captureLine(text: string, labelPattern: RegExp, maxLen = 150): string | undefined {
  const match = text.match(labelPattern);
  if (!match || match[1] === undefined) return undefined;
  const captured = match[1].trim().replace(/\s{2,}/g, " ").slice(0, maxLen);
  return captured.length >= 3 ? captured : undefined;
}

/**
 * Extracts client identity fields from an F1 (Ficha Básica de Cliente) or an
 * F3 (DJ Patrimonial) document. Regex-based against common SUNAT/AVLA form
 * phrasing — real-world F1 layouts vary, so every field is optional and the
 * caller should merge results across all "cliente" documents in the upload
 * batch rather than expect one file to have everything.
 */
export function interpretF1(text: string): Partial<InformacionExtraida> {
  const result: Partial<InformacionExtraida> = {};

  const ruc = text.match(/ruc[ \t:]*n?°?\s*([0-9]{11})/i)?.[1] ?? text.match(/\b(10|15|17|20)\d{9}\b/)?.[0];
  if (ruc) result.ruc = ruc;

  const razonSocial = captureLine(text, /raz[oó]n\s+social[ \t:]*([^\n]{3,120})/i);
  if (razonSocial) result.razonSocial = razonSocial;

  const repMatch = text.match(/representantes?\s+legal(?:es)?[ \t:]*([^\n]{3,200})/i);
  if (repMatch?.[1]) {
    const names = repMatch[1]
      .split(/[,/]|(?:\s+y\s+)/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4 && s.length <= 80);
    if (names.length > 0) {
      result.representantesLegales = names;
      result.representanteLegal = names[0];
    }
  }

  const direccion = captureLine(text, /direcci[oó]n(?:\s+fiscal)?[ \t:]*([^\n]{5,150})/i);
  if (direccion) result.direccion = direccion;

  const correo = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  if (correo) result.correo = correo;

  const ciiuMatch = text.match(/ciiu[ \t:]*([0-9]{4})/i);
  if (ciiuMatch) result.ciiu = ciiuMatch[1];

  const actividad = captureLine(text, /actividad\s+econ[oó]mica(?:\s+principal)?[ \t:]*([^\n]{3,120})/i);
  if (actividad) {
    result.actividadEconomica = actividad;
    if (!ciiuMatch) {
      const actividadNorm = normalize(actividad);
      const found = CIIU_BY_KEYWORD.find((entry) => entry.keywords.some((k) => actividadNorm.includes(k)));
      if (found) result.ciiu = found.code;
    }
  }

  const patrimonio = findMoneyNear(text, /patrimonio(?:\s+neto)?[ \t:]*/i, 60);
  if (patrimonio !== null) result.patrimonio = patrimonio;

  // Only return something if we actually found signal — an empty object lets
  // the caller know this document didn't look like an F1 after all.
  return Object.keys(result).length > 0 ? result : {};
}

/**
 * Extracts the "Requerimiento" section from Bases Integradas: lugar de
 * ejecución, monto adjudicado (also cross-checked against Reporte de Buena
 * Pro when available), beneficiario and plazo.
 */
export function interpretBasesIntegradas(text: string): RequerimientoInfo {
  const result: RequerimientoInfo = {};

  const lugar =
    captureLine(text, /lugar\s+de\s+(?:ejecuci[oó]n|prestaci[oó]n)(?:\s+de\s+la\s+obra| del servicio)?[ \t:]*([^\n]{3,150})/i) ??
    captureLine(text, /lugar\s+de\s+la\s+obra[ \t:]*([^\n]{3,150})/i);
  if (lugar) result.lugarEjecucion = lugar;

  const monto = findMoneyNear(text, /(?:monto\s+adjudicado|valor\s+referencial|valor\s+estimado)[ \t:]*/i, 80);
  if (monto !== null) {
    result.montoAdjudicado = monto;
    result.montoAdjudicadoFuente = "Bases Integradas";
  }

  // The bare "entidad[ \t:]*" fallback used to let its char class eat the
  // space before a following qualifier word ("Entidad convocante :" with no
  // value on the line), then capture that qualifier itself ("convocante :")
  // as if it were the beneficiario — same bug as interpretReporteBuenaPro.
  // Requiring an actual colon right after "entidad" keeps this to real
  // "Entidad: X" lines.
  const beneficiario =
    captureLine(text, /beneficiario[ \t:]*([^\n]{3,150})/i) ??
    captureLine(text, /entidad\s+(?:contratante|convocante)[ \t]*:[ \t]*([^\n]{3,150})/i) ??
    captureLine(text, /(?:^|\n)[ \t]*entidad[ \t]*:[ \t]*([^\n]{3,150})/i) ??
    captureLine(text, /convocad[oa]\s+por[ \t:]*([^\n]{3,150})/i);
  if (beneficiario) result.beneficiario = beneficiario;

  const plazoMatch = text.match(/plazo(?:\s+de\s+ejecuci[oó]n)?[^\d]{0,30}(\d{1,4})\s*(d[ií]as?|meses)/i);
  if (plazoMatch) {
    result.plazoValor = Number(plazoMatch[1]);
    result.plazoUnidad = /mes/i.test(plazoMatch[2]) ? "meses" : "días";
  }

  return result;
}

/**
 * Best-effort guess at the project's display name from Bases Integradas or
 * Solicitud de Emisión text ("objeto de la contratación" / "denominación de
 * la convocatoria"). Returned as a suggestion — the Ejecutivo/practicante
 * confirms or edits it before the expediente is created.
 */
export function extractNombreProyecto(text: string): string | undefined {
  return (
    captureLine(text, /objeto\s+de\s+la\s+contrataci[oó]n[ \t:]*([^\n]{5,150})/i) ??
    captureLine(text, /denominaci[oó]n\s+de\s+la\s+convocatoria[ \t:]*([^\n]{5,150})/i) ??
    captureLine(text, /descripci[oó]n\s+del\s+objeto[ \t:]*([^\n]{5,150})/i)
  );
}

/** Cross-checks/complements the "monto adjudicado" using the Reporte de Buena Pro. */
export function interpretReporteBuenaPro(text: string): { montoAdjudicado?: number; beneficiario?: string } {
  const result: { montoAdjudicado?: number; beneficiario?: string } = {};

  const monto = findMoneyNear(
    text,
    /(?:monto\s+adjudicado|monto\s+de\s+la\s+buena\s+pro|monto\s+total\s+adjudicado|monto\s+ofertado)[ \t:]*/i,
    80
  );
  if (monto !== null) result.montoAdjudicado = monto;

  // "beneficiario" here means the convening entity (the buyer/client that
  // called the process), matching how it's used everywhere else — e.g. the
  // executive brief renders it as "convocado por {beneficiario}" — not the
  // winning bidder/contractor, which is AVLA's own client in this workflow.
  // The bare "entidad[ \t:]*" fallback used to allow zero separator chars
  // before capturing, so a label-only line like "Entidad convocante :" (real
  // SEACE buena-pro exports serialize the table's labels and values in
  // separate blocks, so the label is often followed by nothing at all) had
  // its own trailing "convocante :" swallowed as if it were the value.
  // Requiring an actual colon keeps this fallback to real "Entidad: X" lines.
  const beneficiario =
    captureLine(text, /entidad\s+(?:contratante|convocante)[ \t]*:[ \t]*([^\n]{3,150})/i) ??
    captureLine(text, /(?:^|\n)[ \t]*entidad[ \t]*:[ \t]*([^\n]{3,150})/i) ??
    captureLine(text, /convocad[oa]\s+por[ \t:]*([^\n]{3,150})/i);
  if (beneficiario) result.beneficiario = beneficiario;

  return result;
}

/**
 * Merges Requerimiento data extracted from Bases Integradas with a
 * Reporte de Buena Pro cross-check, preferring the Buena Pro figure when
 * both are present (it reflects the actual awarded amount) but recording
 * that the number was cross-referenced across both sources.
 */
export function mergeRequerimiento(
  base: RequerimientoInfo | undefined,
  fromBasesIntegradas: RequerimientoInfo | undefined,
  fromBuenaPro: { montoAdjudicado?: number; beneficiario?: string } | undefined
): RequerimientoInfo {
  const merged: RequerimientoInfo = { ...base, ...fromBasesIntegradas };

  if (fromBuenaPro?.montoAdjudicado !== undefined) {
    const hadBasesIntegradasMonto = base?.montoAdjudicado !== undefined || fromBasesIntegradas?.montoAdjudicado !== undefined;
    merged.montoAdjudicado = fromBuenaPro.montoAdjudicado;
    merged.montoAdjudicadoFuente = hadBasesIntegradasMonto
      ? "Bases Integradas y Reporte de Buena Pro (cruzado)"
      : "Reporte de Buena Pro";
  }
  if (fromBuenaPro?.beneficiario && !merged.beneficiario) {
    merged.beneficiario = fromBuenaPro.beneficiario;
  }

  return merged;
}
