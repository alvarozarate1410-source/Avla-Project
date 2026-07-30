import type { Expediente } from "@/lib/types";

function pendientes(expediente: Expediente) {
  return expediente.checklist.flatMap((b) => b.items).filter((i) => i.estado !== "completo");
}

export function mockChatResponse(expediente: Expediente, message: string): string {
  const q = message.toLowerCase();

  if (/(falta|pendiente|complet)/.test(q)) {
    const pend = pendientes(expediente);
    if (pend.length === 0) return "El checklist está completo al 100%. No hay documentos pendientes.";
    return `Faltan ${pend.length} documento(s):\n\n${pend.map((p) => `• ${p.label}${p.notas ? ` (${p.notas})` : ""}`).join("\n")}`;
  }

  if (/(riesgo)/.test(q)) {
    return expediente.riesgos
      .map((r) => `• ${r.titulo} (${r.nivel.toUpperCase()}): ${r.descripcion}`)
      .join("\n");
  }

  if (/(deuda|coactiv)/.test(q)) {
    const ev = expediente.evidencias.find((e) => e.tipoDetectado === "CONSULTA_DEUDA_COACTIVA");
    return ev ? ev.resumenIA : "No se ha subido evidencia de consulta de deuda coactiva para este expediente.";
  }

  if (/(representante|legal)/.test(q)) {
    return `El representante legal es ${expediente.informacionExtraida.representanteLegal}, de ${expediente.informacionExtraida.razonSocial} (RUC ${expediente.informacionExtraida.ruc}).`;
  }

  if (/(observ)/.test(q)) {
    const obs = expediente.riesgos.flatMap((r) => r.detalle);
    return obs.length ? obs.map((o) => `• ${o}`).join("\n") : "No se registran observaciones relevantes.";
  }

  if (/(equifax|score|credit)/.test(q)) {
    if (!expediente.equifax) return "Aún no se ha subido el reporte Equifax para este expediente.";
    return `Equifax: score ${expediente.equifax.score}/900 (${expediente.equifax.clasificacion}). ${expediente.equifax.conclusiones.join(" ")}`;
  }

  if (/(experiencia|seace|fit)/.test(q)) {
    if (!expediente.experienceMatch) return "Aún no se ha subido el Excel de experiencia SEACE para este expediente.";
    return `Project Fit Score: ${expediente.experienceMatch.projectFitScore}%. ${expediente.experienceMatch.explicacion}`;
  }

  if (/(inici|listo|evalua)/.test(q)) {
    return expediente.readyScore.valor >= 85
      ? `Sí, el expediente tiene un Ready Score de ${expediente.readyScore.valor}% y está en condiciones de iniciar evaluación. ${expediente.executiveBrief.recomendacion}`
      : `Aún no, el Ready Score es de ${expediente.readyScore.valor}%. Se recomienda resolver los pendientes antes de iniciar la evaluación.`;
  }

  if (/(monto|referencial)/.test(q)) {
    return expediente.executiveBrief.montoReferencial
      ? `El monto referencial es de S/ ${expediente.executiveBrief.montoReferencial.toLocaleString("es-PE")}, convocado por ${expediente.executiveBrief.entidad}.`
      : "No se identificó un monto referencial en este expediente.";
  }

  return "Puedo ayudarte con documentos faltantes, riesgos, experiencia, Equifax o datos del cliente. ¿Sobre qué te gustaría saber más?";
}
