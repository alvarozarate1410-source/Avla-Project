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

  const ruc = text.match(/ruc[:\s]*n?°?\s*([0-9]{11})/i)?.[1] ?? text.match(/\b(10|15|17|20)\d{9}\b/)?.[0];
  if (ruc) result.ruc = ruc;

  const razonSocial = captureLine(text, /raz[oó]n\s+social[:\s]*([^\n]{3,120})/i);
  if (razonSocial) result.razonSocial = razonSocial;

  const repMatch = text.match(/representantes?\s+legales?[:\s]*([^\n]{3,200})/i);
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

  const direccion = captureLine(text, /direcci[oó]n(?:\s+fiscal)?[:\s]*([^\n]{5,150})/i);
  if (direccion) result.direccion = direccion;

  const correo = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  if (correo) result.correo = correo;

  const ciiuMatch = text.match(/ciiu[:\s]*([0-9]{4})/i);
  if (ciiuMatch) result.ciiu = ciiuMatch[1];

  const actividad = captureLine(text, /actividad\s+econ[oó]mica(?:\s+principal)?[:\s]*([^\n]{3,120})/i);
  if (actividad) {
    result.actividadEconomica = actividad;
    if (!ciiuMatch) {
      const actividadNorm = normalize(actividad);
      const found = CIIU_BY_KEYWORD.find((entry) => entry.keywords.some((k) => actividadNorm.includes(k)));
      if (found) result.ciiu = found.code;
    }
  }

  const patrimonio = findMoneyNear(text, /patrimonio(?:\s+neto)?[:\s]*/i, 60);
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
    captureLine(text, /lugar\s+de\s+(?:ejecuci[oó]n|prestaci[oó]n)(?:\s+de\s+la\s+obra| del servicio)?[:\s]*([^\n]{3,150})/i) ??
    captureLine(text, /lugar\s+de\s+la\s+obra[:\s]*([^\n]{3,150})/i);
  if (lugar) result.lugarEjecucion = lugar;

  const monto = findMoneyNear(text, /(?:monto\s+adjudicado|valor\s+referencial|valor\s+estimado)[:\s]*/i, 80);
  if (monto !== null) {
    result.montoAdjudicado = monto;
    result.montoAdjudicadoFuente = "Bases Integradas";
  }

  const beneficiario = captureLine(text, /beneficiario[:\s]*([^\n]{3,150})/i) ?? captureLine(text, /entidad\s+contratante[:\s]*([^\n]{3,150})/i);
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
    captureLine(text, /objeto\s+de\s+la\s+contrataci[oó]n[:\s]*([^\n]{5,150})/i) ??
    captureLine(text, /denominaci[oó]n\s+de\s+la\s+convocatoria[:\s]*([^\n]{5,150})/i) ??
    captureLine(text, /descripci[oó]n\s+del\s+objeto[:\s]*([^\n]{5,150})/i)
  );
}

/** Cross-checks/complements the "monto adjudicado" using the Reporte de Buena Pro. */
export function interpretReporteBuenaPro(text: string): { montoAdjudicado?: number; beneficiario?: string } {
  const result: { montoAdjudicado?: number; beneficiario?: string } = {};

  const monto = findMoneyNear(text, /(?:monto\s+adjudicado|monto\s+de\s+la\s+buena\s+pro|monto\s+total\s+adjudicado)[:\s]*/i, 80);
  if (monto !== null) result.montoAdjudicado = monto;

  const beneficiario = captureLine(text, /(?:postor\s+ganador|adjudicatario|ganador\s+de\s+la\s+buena\s+pro)[:\s]*([^\n]{3,150})/i);
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
