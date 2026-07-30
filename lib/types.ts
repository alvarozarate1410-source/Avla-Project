export type EstadoExpediente = "en_analisis" | "listo" | "observado" | "aprobado" | "archivado";

export type NivelRiesgo = "bajo" | "medio" | "alto" | "critico";

export type EstadoItem = "completo" | "pendiente" | "advertencia";

export type CategoriaChecklist = "cliente" | "proyecto" | "consorcio" | "validaciones";

export type TipoDocumentoDetectado =
  | "F1_FICHA_BASICA"
  | "F2_DECLARACION_EXPERIENCIA"
  | "F3_DJ_PATRIMONIAL"
  | "DNI"
  | "DECLARACION_JURADA"
  | "EEFF_SITUACIONAL"
  | "VIGENCIA_PODER"
  | "COPIA_LITERAL"
  | "CARTA_NOMBRAMIENTO"
  | "SOLICITUD_EMISION"
  | "BASES_INTEGRADAS"
  | "MEMORIA_DESCRIPTIVA"
  | "PRESUPUESTO"
  | "REPORTE_BUENA_PRO"
  | "ACTA_BUENA_PRO"
  | "FICHA_CONSORCIO"
  | "CONTRATO_CONSORCIO"
  | "CONSULTA_RUC"
  | "CONSULTA_DEUDA_COACTIVA"
  | "CONSULTA_PROVEEDORES_ESTADO"
  | "EXPERIENCIA_SEACE"
  | "REPORTE_EQUIFAX"
  | "SUSTENTO_PAGO"
  | "DESCONOCIDO";

export interface ChecklistItem {
  id: string;
  label: string;
  estado: EstadoItem;
  tipoDetectado?: TipoDocumentoDetectado;
  documentoId?: string;
  notas?: string;
}

export interface ChecklistBloque {
  id: CategoriaChecklist;
  titulo: string;
  items: ChecklistItem[];
}

export interface Documento {
  id: string;
  nombre: string;
  nombreSugerido?: string;
  extension: "pdf" | "docx" | "xlsx" | "png" | "jpg" | "zip";
  tamanioBytes: number;
  subidoEn: string;
  categoria: CategoriaChecklist;
  tipoDetectado: TipoDocumentoDetectado;
  confianzaDeteccion: number;
  estado: EstadoItem;
}

export interface EvidenciaResultado {
  etiqueta: string;
  valor: string;
  tono: "success" | "warning" | "danger" | "neutral";
}

export interface Evidencia {
  id: string;
  nombreArchivo: string;
  tipoDetectado: TipoDocumentoDetectado;
  tituloVisible: string;
  subidoEn: string;
  estado: EstadoItem;
  resultados: EvidenciaResultado[];
  resumenIA: string;
}

export interface RiesgoFactor {
  id: "documental" | "financiero" | "legal" | "operativo";
  titulo: string;
  nivel: NivelRiesgo;
  descripcion: string;
  detalle: string[];
}

export interface ReadyScoreFactor {
  id: string;
  label: string;
  valor: number;
  peso: number;
}

export interface ReadyScore {
  valor: number;
  etiqueta: string;
  factores: ReadyScoreFactor[];
}

export interface ConfianzaIA {
  valor: number;
  mensaje: string;
}

export interface ExecutiveBrief {
  generadoEn: string;
  parrafos: string[];
  montoReferencial?: number;
  entidad?: string;
  estadoDocumentalPct: number;
  pendientes: string[];
  recomendacion: string;
}

export interface InsightIA {
  id: string;
  texto: string;
  tono: "success" | "warning" | "danger" | "neutral";
}

export interface ExperienceMatchContrato {
  id: string;
  entidad: string;
  objeto: string;
  monto: number;
  anio: number;
  categoria: string;
  compatible: boolean;
}

export interface ExperienceMatch {
  projectFitScore: number;
  contratosAnalizados: number;
  contratosCompatibles: number;
  explicacion: string;
  riesgos: string[];
  categorias: { nombre: string; cantidad: number; pct: number }[];
  contratos: ExperienceMatchContrato[];
}

export interface EquifaxSummary {
  score: number;
  clasificacion: string;
  riesgos: string[];
  alertas: string[];
  conclusiones: string[];
}

export interface SustentoPago {
  id: string;
  monto: number;
  entidadBancaria: string;
  fecha: string;
  beneficiario: string;
  observaciones: string;
}

export interface InformacionExtraida {
  razonSocial: string;
  ruc: string;
  representanteLegal: string;
  direccion: string;
  correo: string;
  actividadEconomica: string;
  patrimonio: number;
  participacionConsorcio?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestions?: string[];
}

export interface Expediente {
  id: string;
  nombreProyecto: string;
  broker: string;
  ejecutivo: string;
  creadoEn: string;
  actualizadoEn: string;
  estado: EstadoExpediente;
  readyScore: ReadyScore;
  confianzaIA: ConfianzaIA;
  riesgos: RiesgoFactor[];
  executiveBrief: ExecutiveBrief;
  insights: InsightIA[];
  checklist: ChecklistBloque[];
  documentos: Documento[];
  evidencias: Evidencia[];
  informacionExtraida: InformacionExtraida;
  experienceMatch?: ExperienceMatch;
  equifax?: EquifaxSummary;
  sustentosPago: SustentoPago[];
  chat: ChatMessage[];
  tiempoAhorradoMin: number;
  consorcioDetectado?: { empresas: number; nombres: string[] };
}
