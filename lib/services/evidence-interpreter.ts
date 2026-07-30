import type { EquifaxSummary, EvidenciaResultado, SustentoPago, TipoDocumentoDetectado } from "@/lib/types";

export interface InterpretationResult {
  resultados: EvidenciaResultado[];
  resumenIA: string;
  equifaxUpdate?: EquifaxSummary;
  sustentoPagoUpdate?: Omit<SustentoPago, "id">;
}

const BANCOS = ["BCP", "BBVA", "Interbank", "Scotiabank", "Banco de la Nación", "Banco Pichincha", "Banbif", "Mibanco"];

function findMoney(text: string): number | null {
  const match = text.match(/S\/\.?\s?([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  const raw = match[1].replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function findDate(text: string): string | null {
  const match = text.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/**
 * Regex/keyword-based interpretation of manually-uploaded evidence (RUC,
 * deuda coactiva, OSCE, Equifax, sustento de pago). These portals have
 * CAPTCHA and can't be queried automatically, so the product's job is to
 * read the human-uploaded screenshot/PDF/Excel and extract the result —
 * never to store the raw document unread.
 */
export function interpretEvidence(tipo: TipoDocumentoDetectado, text: string): InterpretationResult {
  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  switch (tipo) {
    case "CONSULTA_RUC": {
      const rucMatch = text.match(/\b\d{11}\b/);
      const noHabido = /no\s+habido/.test(norm);
      const habido = !noHabido && /\bhabido\b/.test(norm);
      const activo = /\bactivo\b/.test(norm);
      const baja = /\bbaja\b/.test(norm);
      const estado = activo ? "Activo" : baja ? "De baja" : "No determinado";
      const condicion = noHabido ? "No Habido" : habido ? "Habido" : "No determinado";
      return {
        resultados: [
          { etiqueta: "Estado", valor: estado, tono: activo ? "success" : baja ? "danger" : "neutral" },
          { etiqueta: "Condición", valor: condicion, tono: noHabido ? "danger" : habido ? "success" : "neutral" },
        ],
        resumenIA: `RUC ${rucMatch ? rucMatch[0] : "no identificado"}: ${estado.toLowerCase()}${
          condicion !== "No determinado" ? ` y ${condicion.toLowerCase()}` : ""
        } ante SUNAT.`,
      };
    }

    case "CONSULTA_DEUDA_COACTIVA": {
      const sinDeuda = /sin\s+deuda|no\s+(se\s+)?registra\s+deuda/.test(norm);
      const monto = findMoney(text);
      if (sinDeuda) {
        return {
          resultados: [{ etiqueta: "Resultado", valor: "Sin deuda", tono: "success" }],
          resumenIA: "No se registra deuda coactiva exigible a la fecha de consulta.",
        };
      }
      if (monto) {
        return {
          resultados: [{ etiqueta: "Resultado", valor: `S/ ${monto.toLocaleString("es-PE")}`, tono: "danger" }],
          resumenIA: `Se identificó un monto de deuda coactiva de S/ ${monto.toLocaleString(
            "es-PE"
          )}. Requiere revisión del Ejecutivo.`,
        };
      }
      return {
        resultados: [{ etiqueta: "Resultado", valor: "Revisión manual", tono: "warning" }],
        resumenIA: "No se pudo determinar automáticamente el resultado de la consulta de deuda coactiva. Revisa el documento manualmente.",
      };
    }

    case "CONSULTA_PROVEEDORES_ESTADO": {
      const inhabilitado = /inhabilitad/.test(norm);
      const habil = !inhabilitado && /\bh[a]?bil\b/.test(norm);
      const sinSanciones = /sin\s+sancion|ninguna\s+sancion/.test(norm);
      const conSancion = !sinSanciones && /sancion/.test(norm);
      return {
        resultados: [
          {
            etiqueta: "Estado registral",
            valor: habil ? "Hábil" : inhabilitado ? "Inhabilitado" : "No determinado",
            tono: habil ? "success" : inhabilitado ? "danger" : "neutral",
          },
          {
            etiqueta: "Sanciones",
            valor: conSancion ? "Registrada" : sinSanciones ? "Ninguna" : "No determinado",
            tono: conSancion ? "danger" : sinSanciones ? "success" : "neutral",
          },
        ],
        resumenIA: conSancion
          ? "Se identificó una sanción registrada ante OSCE. Requiere revisión del Ejecutivo."
          : "Proveedor hábil ante OSCE, sin sanciones identificadas en el documento.",
      };
    }

    case "REPORTE_EQUIFAX": {
      const scoreMatch = text.match(/(\d{2,3})\s*\/\s*900/) || text.match(/score[^\d]{0,20}(\d{2,3})\b/i);
      const score = scoreMatch ? Number(scoreMatch[1]) : null;
      const sinAlertas = /sin\s+alertas/.test(norm);
      const clasificacion = score === null ? "No determinado" : score >= 700 ? "Bajo riesgo" : score >= 500 ? "Riesgo moderado" : "Riesgo alto";
      const equifaxUpdate: EquifaxSummary | undefined =
        score !== null
          ? {
              score,
              clasificacion,
              riesgos: clasificacion === "Riesgo alto" ? ["Score por debajo del umbral recomendado."] : [],
              alertas: sinAlertas ? [] : /alerta/.test(norm) ? ["Se detectaron menciones de alertas en el reporte; revisar manualmente."] : [],
              conclusiones: [`Score de ${score}/900 ubica a la empresa en el rango de ${clasificacion.toLowerCase()}.`],
            }
          : undefined;
      return {
        resultados: [
          {
            etiqueta: "Score",
            valor: score !== null ? `${score} / 900` : "No identificado",
            tono: score === null ? "neutral" : score >= 700 ? "success" : score >= 500 ? "warning" : "danger",
          },
          {
            etiqueta: "Alertas",
            valor: sinAlertas ? "Sin alertas críticas" : "Revisar reporte",
            tono: sinAlertas ? "success" : "warning",
          },
        ],
        resumenIA:
          score !== null
            ? `Score Equifax de ${score}/900 (${clasificacion.toLowerCase()}).`
            : "No se pudo identificar automáticamente el score en el documento. Revisa el reporte manualmente.",
        equifaxUpdate,
      };
    }

    case "SUSTENTO_PAGO": {
      const monto = findMoney(text);
      const fecha = findDate(text);
      const banco = BANCOS.find((b) => norm.includes(b.toLowerCase()));
      return {
        resultados: [
          { etiqueta: "Monto", valor: monto ? `S/ ${monto.toLocaleString("es-PE")}` : "No identificado", tono: monto ? "neutral" : "warning" },
          { etiqueta: "Entidad bancaria", valor: banco ?? "No identificada", tono: banco ? "neutral" : "warning" },
        ],
        resumenIA: monto
          ? `Sustento de pago por S/ ${monto.toLocaleString("es-PE")}${banco ? ` vía ${banco}` : ""}${fecha ? ` con fecha ${fecha}` : ""}.`
          : "No se pudieron extraer automáticamente los datos del sustento de pago. Revisa el documento manualmente.",
        sustentoPagoUpdate: {
          monto: monto ?? 0,
          entidadBancaria: banco ?? "No identificada",
          fecha: fecha ?? new Date().toISOString().slice(0, 10),
          beneficiario: "AVLA Seguros",
          observaciones: "Extraído automáticamente por AVLA Lens AI.",
        },
      };
    }

    default:
      return {
        resultados: [],
        resumenIA: "Documento clasificado y agregado al expediente.",
      };
  }
}
