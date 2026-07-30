import type {
  CategoriaChecklist,
  ChecklistBloque,
  Documento,
  EquifaxSummary,
  Evidencia,
  EvidenciaResultado,
  ExperienceMatch,
  Expediente,
  NivelRiesgo,
  SustentoPago,
  TipoDocumentoDetectado,
} from "@/lib/types";
import { TIPO_LABELS } from "@/lib/document-labels";

const VALIDACIONES_TIPOS: TipoDocumentoDetectado[] = [
  "CONSULTA_RUC",
  "CONSULTA_DEUDA_COACTIVA",
  "CONSULTA_PROVEEDORES_ESTADO",
  "EXPERIENCIA_SEACE",
  "REPORTE_EQUIFAX",
  "SUSTENTO_PAGO",
];

export interface ProcessedUpload {
  fileName: string;
  size: number;
  tipoDetectado: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  confianza: number;
  nombreSugerido?: string;
  resultados: EvidenciaResultado[];
  resumenIA: string;
  experienceMatchUpdate?: ExperienceMatch;
  equifaxUpdate?: EquifaxSummary;
  sustentoPagoUpdate?: Omit<SustentoPago, "id">;
}

function extensionFromName(name: string): Documento["extension"] {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "xlsx" || ext === "png" || ext === "jpg" || ext === "zip") return ext;
  if (ext === "jpeg") return "jpg";
  if (ext === "xls" || ext === "csv") return "xlsx";
  return "pdf";
}

function scoreFromChecklistItems(items: { estado: string }[]): number {
  if (items.length === 0) return 100;
  const points = items.reduce((acc, i) => acc + (i.estado === "completo" ? 1 : i.estado === "advertencia" ? 0.7 : 0), 0);
  return Math.round((points / items.length) * 100);
}

function findFactor(expediente: Expediente, id: string): number | undefined {
  return expediente.readyScore.factores.find((f) => f.id === id)?.valor;
}

function recomputeReadyScore(expediente: Expediente): Expediente["readyScore"] {
  const documentoBlocks = expediente.checklist.filter((b) => b.id !== "validaciones");
  const validacionesBlock = expediente.checklist.find((b) => b.id === "validaciones");

  const documentacionPct = scoreFromChecklistItems(documentoBlocks.flatMap((b) => b.items));
  const validacionesPct = scoreFromChecklistItems(validacionesBlock?.items ?? []);
  // Only override experiencia/equifax/consistencia when we actually have fresh
  // source data for them — otherwise keep whatever the expediente already had,
  // so uploading unrelated evidence never makes an untouched factor regress to 0.
  const experienciaPct = expediente.experienceMatch?.projectFitScore ?? findFactor(expediente, "experiencia") ?? 0;
  const equifaxPct = expediente.equifax
    ? Math.round((expediente.equifax.score / 900) * 100)
    : findFactor(expediente, "equifax") ?? 0;
  const consistenciaPct = findFactor(expediente, "consistencia") ?? 90;

  const factores = [
    { id: "documentacion", label: "Documentación", valor: documentacionPct, peso: 0.3 },
    { id: "validaciones", label: "Validaciones externas", valor: validacionesPct, peso: 0.25 },
    { id: "experiencia", label: "Experiencia (SEACE)", valor: experienciaPct, peso: 0.2 },
    { id: "equifax", label: "Equifax", valor: equifaxPct, peso: 0.15 },
    { id: "consistencia", label: "Consistencia de datos", valor: consistenciaPct, peso: 0.1 },
  ];

  const valor = Math.round(factores.reduce((acc, f) => acc + f.valor * f.peso, 0));
  const etiqueta = valor >= 85 ? "Listo para evaluación" : valor >= 60 ? "Requiere atención" : "Incompleto";

  return { valor, etiqueta, factores };
}

function overallTono(resultados: EvidenciaResultado[]): "success" | "warning" | "danger" | "neutral" {
  if (resultados.some((r) => r.tono === "danger")) return "danger";
  if (resultados.some((r) => r.tono === "warning")) return "warning";
  if (resultados.some((r) => r.tono === "success")) return "success";
  return "neutral";
}

function nivelFromPendientes(count: number): NivelRiesgo {
  if (count === 0) return "bajo";
  if (count <= 2) return "bajo";
  if (count <= 4) return "medio";
  return "alto";
}

/**
 * Folds one classified + interpreted upload into an Expediente: checks off
 * (or adds) the matching checklist item, records the document, appends an
 * "Evidencias del Expediente" card for external validations, refreshes
 * Equifax/Experience Match when the upload provided fresh data, and
 * recomputes the Ready Score and documental risk summary from the result.
 *
 * Pure function — the caller (client state, eventually a real DB) owns
 * persistence. No network/storage side effects happen here.
 */
export function applyUploadedEvidence(expediente: Expediente, upload: ProcessedUpload): Expediente {
  const now = new Date().toISOString();
  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isKnown = upload.tipoDetectado !== "DESCONOCIDO";

  const nuevoDocumento: Documento = {
    id: docId,
    nombre: upload.fileName,
    nombreSugerido: upload.nombreSugerido,
    extension: extensionFromName(upload.fileName),
    tamanioBytes: upload.size,
    subidoEn: now,
    categoria: upload.categoria,
    tipoDetectado: upload.tipoDetectado,
    confianzaDeteccion: upload.confianza,
    estado: isKnown ? "completo" : "advertencia",
  };

  const checklist: ChecklistBloque[] = expediente.checklist.map((bloque) => ({ ...bloque, items: [...bloque.items] }));

  if (isKnown) {
    const block = checklist.find((b) => b.id === upload.categoria);
    if (block) {
      const existingIdx = block.items.findIndex((i) => i.tipoDetectado === upload.tipoDetectado);
      if (existingIdx !== -1) {
        block.items[existingIdx] = {
          ...block.items[existingIdx],
          estado: "completo",
          documentoId: docId,
          notas: undefined,
        };
      } else {
        block.items.push({
          id: `item-${docId}`,
          label: TIPO_LABELS[upload.tipoDetectado],
          estado: "completo",
          tipoDetectado: upload.tipoDetectado,
          documentoId: docId,
        });
      }
    }
  }

  let evidencias = expediente.evidencias;
  if (isKnown && VALIDACIONES_TIPOS.includes(upload.tipoDetectado)) {
    const nuevaEvidencia: Evidencia = {
      id: `ev-${docId}`,
      nombreArchivo: upload.fileName,
      tipoDetectado: upload.tipoDetectado,
      tituloVisible: TIPO_LABELS[upload.tipoDetectado],
      subidoEn: now,
      estado: "completo",
      resultados: upload.resultados,
      resumenIA: upload.resumenIA,
    };
    const existingEvIdx = evidencias.findIndex((e) => e.tipoDetectado === upload.tipoDetectado);
    evidencias =
      existingEvIdx !== -1
        ? evidencias.map((e, i) => (i === existingEvIdx ? nuevaEvidencia : e))
        : [...evidencias, nuevaEvidencia];
  }

  const sustentosPago = upload.sustentoPagoUpdate
    ? [...expediente.sustentosPago, { id: `sp-${docId}`, ...upload.sustentoPagoUpdate }]
    : expediente.sustentosPago;

  const insights =
    isKnown && upload.resumenIA
      ? [...expediente.insights, { id: `insight-${docId}`, texto: upload.resumenIA, tono: overallTono(upload.resultados) }]
      : expediente.insights;

  let updated: Expediente = {
    ...expediente,
    documentos: [nuevoDocumento, ...expediente.documentos],
    checklist,
    evidencias,
    sustentosPago,
    insights,
    experienceMatch: upload.experienceMatchUpdate ?? expediente.experienceMatch,
    equifax: upload.equifaxUpdate ?? expediente.equifax,
    actualizadoEn: now,
  };

  updated = { ...updated, readyScore: recomputeReadyScore(updated) };

  // "Riesgo Documental" and the executive brief's pendientes list are scoped to
  // the client/project/consortium paperwork (not external validations, which
  // have their own risk narrative) and count only genuinely missing items —
  // an "advertencia" (e.g. a power of attorney close to expiring) is a
  // separate legal-risk concern, not a missing document.
  const documentoBlocks = updated.checklist.filter((b) => b.id !== "validaciones");
  const documentoItems = documentoBlocks.flatMap((b) => b.items);
  const faltantesCount = documentoItems.filter((i) => i.estado === "pendiente").length;

  updated = {
    ...updated,
    executiveBrief: {
      ...updated.executiveBrief,
      estadoDocumentalPct: scoreFromChecklistItems(documentoItems),
      pendientes: documentoItems.filter((i) => i.estado !== "completo").map((i) => i.label),
    },
    riesgos: updated.riesgos.map((r) =>
      r.id === "documental"
        ? {
            ...r,
            nivel: nivelFromPendientes(faltantesCount),
            descripcion: `${faltantesCount} documento(s) pendientes de un total de ${documentoItems.length}.`,
            detalle:
              faltantesCount > 0
                ? documentoItems.filter((i) => i.estado === "pendiente").map((i) => `Falta ${i.label}.`)
                : ["Checklist documental completo."],
          }
        : r
    ),
  };

  return updated;
}
