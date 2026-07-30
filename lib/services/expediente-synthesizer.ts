import type { ChecklistBloque, EstadoExpediente, Expediente, ExpedienteTemplate } from "@/lib/types";
import { applyUploadedEvidence, type ProcessedUpload } from "@/lib/services/expediente-mutations";

export interface SynthesisInput {
  template: ExpedienteTemplate;
  nombreProyecto: string;
  broker: string;
  ejecutivo: string;
  uploads: ProcessedUpload[];
}

function emptyChecklist(template: ExpedienteTemplate): ChecklistBloque[] {
  return template.bloques.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    items: b.items.map((i) => ({
      id: i.id,
      label: i.label,
      estado: "pendiente" as const,
      tipoDetectado: i.tipoDetectado,
    })),
  }));
}

function shellExpediente(input: SynthesisInput): Expediente {
  const now = new Date().toISOString();
  const id = `exp-${input.nombreProyecto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)}-${Date.now().toString(36)}`;

  return {
    id,
    nombreProyecto: input.nombreProyecto,
    broker: input.broker,
    ejecutivo: input.ejecutivo,
    creadoEn: now,
    actualizadoEn: now,
    estado: "en_analisis",
    readyScore: {
      valor: 0,
      etiqueta: "Recién creado",
      factores: [
        { id: "documentacion", label: "Documentación", valor: 0, peso: 0.3 },
        { id: "validaciones", label: "Validaciones externas", valor: 0, peso: 0.25 },
        { id: "experiencia", label: "Experiencia (SEACE)", valor: 0, peso: 0.2 },
        { id: "equifax", label: "Equifax", valor: 0, peso: 0.15 },
        { id: "consistencia", label: "Consistencia de datos", valor: 90, peso: 0.1 },
      ],
    },
    confianzaIA: { valor: 0, mensaje: "Expediente recién creado — procesando documentos." },
    riesgos: [
      { id: "documental", titulo: "Riesgo Documental", nivel: "medio", descripcion: "Checklist recién generado.", detalle: [] },
      { id: "financiero", titulo: "Riesgo Financiero", nivel: "medio", descripcion: "Pendiente de EEFF/patrimonio del cliente.", detalle: ["Aún no se ha extraído información financiera suficiente."] },
      { id: "legal", titulo: "Riesgo Legal", nivel: "medio", descripcion: "Pendiente de validaciones externas (OSCE, deuda coactiva).", detalle: ["Sube las evidencias de validación externa para completar este análisis."] },
      { id: "operativo", titulo: "Riesgo Operativo", nivel: "medio", descripcion: "Pendiente de experiencia SEACE.", detalle: ["Sube el Excel de experiencia SEACE para calcular el Project Fit Score."] },
    ],
    executiveBrief: {
      generadoEn: now,
      parrafos: [],
      estadoDocumentalPct: 0,
      pendientes: [],
      recomendacion: "Expediente en triage inicial.",
    },
    insights: [],
    checklist: emptyChecklist(input.template),
    documentos: [],
    evidencias: [],
    informacionExtraida: {
      razonSocial: "",
      ruc: "",
      representanteLegal: "",
      direccion: "",
      correo: "",
      actividadEconomica: "",
      patrimonio: 0,
    },
    sustentosPago: [],
    chat: [
      {
        id: "m1",
        role: "assistant",
        content: `Hola, soy tu Copiloto AVLA Lens. Acabo de procesar los documentos de "${input.nombreProyecto}". Pregúntame qué falta, qué riesgos detecté o cualquier dato extraído.`,
        createdAt: now,
      },
    ],
    tiempoAhorradoMin: Math.max(12, input.uploads.length * 4),
  };
}

function buildExecutiveBrief(expediente: Expediente): Expediente {
  const parrafos: string[] = [];
  const info = expediente.informacionExtraida;
  const req = expediente.requerimiento;

  const intro = [
    `El expediente corresponde a ${expediente.nombreProyecto}`,
    req?.beneficiario ? `, convocado por ${req.beneficiario}` : "",
    req?.montoAdjudicado !== undefined ? ` por un monto de S/ ${req.montoAdjudicado.toLocaleString("es-PE")}` : "",
    ".",
  ].join("");
  parrafos.push(intro);

  if (info.razonSocial) {
    parrafos.push(
      `El cliente es ${info.razonSocial}${info.ruc ? ` (RUC ${info.ruc})` : ""}${
        info.representanteLegal ? `, representado por ${info.representanteLegal}` : ""
      }.`
    );
  }

  if (expediente.experienceMatch) {
    parrafos.push(
      `La experiencia técnica declarada muestra un Project Fit Score de ${expediente.experienceMatch.projectFitScore}%: ${expediente.experienceMatch.explicacion}`
    );
  }

  if (expediente.equifax) {
    parrafos.push(`El reporte Equifax indica un score de ${expediente.equifax.score}/900 (${expediente.equifax.clasificacion.toLowerCase()}).`);
  }

  parrafos.push(
    `El estado documental se encuentra en ${expediente.executiveBrief.estadoDocumentalPct}%${
      expediente.executiveBrief.pendientes.length > 0
        ? `, con ${expediente.executiveBrief.pendientes.length} documento(s) pendiente(s) que deben regularizarse antes de la emisión.`
        : ", sin documentos pendientes."
    }`
  );

  const recomendacion =
    expediente.readyScore.valor >= 85
      ? "El expediente está en condiciones de iniciar evaluación."
      : expediente.executiveBrief.pendientes.length > 0
        ? "Se recomienda solicitar al broker los documentos faltantes antes de continuar con la evaluación."
        : "Se recomienda subir las evidencias de validación externa (RUC, OSCE, Equifax, SEACE) para completar el análisis.";

  return {
    ...expediente,
    executiveBrief: {
      ...expediente.executiveBrief,
      parrafos,
      entidad: req?.beneficiario,
      montoReferencial: req?.montoAdjudicado,
      recomendacion,
    },
  };
}

/**
 * Builds a brand-new Expediente from a checklist template plus the batch of
 * classified/interpreted uploads from the "Nuevo expediente" flow — by
 * folding each upload through the same applyUploadedEvidence used for
 * adding evidence to an existing expediente, so the two flows can never
 * drift apart in behavior.
 */
export function synthesizeExpediente(input: SynthesisInput): Expediente {
  let expediente = shellExpediente(input);
  for (const upload of input.uploads) {
    expediente = applyUploadedEvidence(expediente, upload);
  }
  expediente = buildExecutiveBrief(expediente);

  // A brand-new expediente is "en_analisis"; flag it "observado" upfront if
  // there are already a lot of gaps, mirroring how the rest of the product
  // reads risk state.
  const estado: EstadoExpediente = expediente.readyScore.valor < 40 ? "observado" : "en_analisis";
  return { ...expediente, estado };
}
