import type { TipoDocumentoDetectado } from "@/lib/types";

export const TIPO_LABELS: Record<TipoDocumentoDetectado, string> = {
  F1_FICHA_BASICA: "F1 - Ficha básica de cliente",
  F2_DECLARACION_EXPERIENCIA: "F2 - Declaración de experiencia",
  F3_DJ_PATRIMONIAL: "F3 - DJ patrimonial",
  DNI: "DNI",
  DECLARACION_JURADA: "Declaración Jurada",
  EEFF_SITUACIONAL: "EEFF Situacional",
  VIGENCIA_PODER: "Vigencia de Poder",
  COPIA_LITERAL: "Copia Literal",
  CARTA_NOMBRAMIENTO: "Carta de Nombramiento",
  SOLICITUD_EMISION: "Solicitud de Emisión",
  BASES_INTEGRADAS: "Bases Integradas",
  MEMORIA_DESCRIPTIVA: "Memoria Descriptiva",
  PRESUPUESTO: "Presupuesto",
  REPORTE_BUENA_PRO: "Reporte de Buena Pro",
  ACTA_BUENA_PRO: "Acta de Buena Pro",
  FICHA_CONSORCIO: "Ficha básica del consorcio",
  CONTRATO_CONSORCIO: "Contrato de Consorcio",
  CONSULTA_RUC: "Consulta RUC",
  CONSULTA_DEUDA_COACTIVA: "Consulta Deuda Coactiva",
  CONSULTA_PROVEEDORES_ESTADO: "Proveedores del Estado (OSCE)",
  EXPERIENCIA_SEACE: "Experiencia SEACE",
  REPORTE_EQUIFAX: "Reporte Equifax",
  SUSTENTO_PAGO: "Sustento de Pago",
  DESCONOCIDO: "Sin identificar",
};

export const CATEGORIA_LABELS = {
  cliente: "Cliente",
  proyecto: "Proyecto",
  consorcio: "Consorcio",
  validaciones: "Validaciones Externas",
} as const;
