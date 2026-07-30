import type { ExpedienteTemplate } from "@/lib/types";

let n = 0;
const id = () => `tpl-item-${++n}`;

export const DEFAULT_TEMPLATES: ExpedienteTemplate[] = [
  {
    id: "fiel_cumplimiento",
    nombre: "Fiel Cumplimiento",
    descripcion: "Carta fianza de fiel cumplimiento para un proveedor único (sin consorcio).",
    bloques: [
      {
        id: "cliente",
        titulo: "Cliente",
        items: [
          { id: id(), label: "F1 - Ficha básica de cliente PJ", tipoDetectado: "F1_FICHA_BASICA", obligatorio: true },
          { id: id(), label: "F2 - Declaración de experiencia", tipoDetectado: "F2_DECLARACION_EXPERIENCIA", obligatorio: true },
          { id: id(), label: "F3 - DJ patrimonial (Accionistas)", tipoDetectado: "F3_DJ_PATRIMONIAL", obligatorio: true },
          { id: id(), label: "DNI", tipoDetectado: "DNI", obligatorio: true },
          { id: id(), label: "DDJJ", tipoDetectado: "DECLARACION_JURADA", obligatorio: true },
          { id: id(), label: "EEFF Situacional, con Notas", tipoDetectado: "EEFF_SITUACIONAL", obligatorio: true },
          { id: id(), label: "Vigencia Poder (≤ 30 días)", tipoDetectado: "VIGENCIA_PODER", obligatorio: true },
          { id: id(), label: "Copia Literal", tipoDetectado: "COPIA_LITERAL", obligatorio: true },
        ],
      },
      {
        id: "proyecto",
        titulo: "Proyecto",
        items: [
          { id: id(), label: "Solicitud de emisión", tipoDetectado: "SOLICITUD_EMISION", obligatorio: true },
          { id: id(), label: "Bases Integradas", tipoDetectado: "BASES_INTEGRADAS", obligatorio: true },
          { id: id(), label: "Memoria Descriptiva", tipoDetectado: "MEMORIA_DESCRIPTIVA", obligatorio: false },
          { id: id(), label: "Presupuesto", tipoDetectado: "PRESUPUESTO", obligatorio: false },
          { id: id(), label: "Reporte de Buena Pro", tipoDetectado: "REPORTE_BUENA_PRO", obligatorio: true },
          { id: id(), label: "Acta de Buena Pro", tipoDetectado: "ACTA_BUENA_PRO", obligatorio: true },
        ],
      },
      { id: "consorcio", titulo: "Consorcio", items: [] },
      {
        id: "validaciones",
        titulo: "Validaciones Externas",
        items: [
          { id: id(), label: "Consulta RUC (SUNAT)", tipoDetectado: "CONSULTA_RUC", obligatorio: true },
          { id: id(), label: "Consulta Deuda Coactiva", tipoDetectado: "CONSULTA_DEUDA_COACTIVA", obligatorio: true },
          { id: id(), label: "Proveedores del Estado (OSCE)", tipoDetectado: "CONSULTA_PROVEEDORES_ESTADO", obligatorio: true },
          { id: id(), label: "Experiencia SEACE", tipoDetectado: "EXPERIENCIA_SEACE", obligatorio: true },
          { id: id(), label: "Reporte Equifax", tipoDetectado: "REPORTE_EQUIFAX", obligatorio: true },
        ],
      },
    ],
  },
  {
    id: "licitacion_publica",
    nombre: "Licitación Pública",
    descripcion: "Etapa de licitación (antes del otorgamiento de la buena pro): solicitud de la carta de participación en el proceso.",
    bloques: [
      {
        id: "cliente",
        titulo: "Cliente",
        items: [
          { id: id(), label: "F1 - Ficha básica de cliente PJ", tipoDetectado: "F1_FICHA_BASICA", obligatorio: true },
          { id: id(), label: "F2 - Declaración de experiencia", tipoDetectado: "F2_DECLARACION_EXPERIENCIA", obligatorio: true },
          { id: id(), label: "F3 - DJ patrimonial (Accionistas)", tipoDetectado: "F3_DJ_PATRIMONIAL", obligatorio: true },
          { id: id(), label: "DNI", tipoDetectado: "DNI", obligatorio: true },
          { id: id(), label: "DDJJ", tipoDetectado: "DECLARACION_JURADA", obligatorio: true },
          { id: id(), label: "EEFF Situacional, con Notas", tipoDetectado: "EEFF_SITUACIONAL", obligatorio: false },
          { id: id(), label: "Vigencia Poder (≤ 30 días)", tipoDetectado: "VIGENCIA_PODER", obligatorio: true },
          { id: id(), label: "Copia Literal", tipoDetectado: "COPIA_LITERAL", obligatorio: false },
        ],
      },
      {
        id: "proyecto",
        titulo: "Proyecto",
        items: [
          { id: id(), label: "Solicitud de emisión", tipoDetectado: "SOLICITUD_EMISION", obligatorio: true },
          { id: id(), label: "Bases Integradas", tipoDetectado: "BASES_INTEGRADAS", obligatorio: true },
          { id: id(), label: "Memoria Descriptiva", tipoDetectado: "MEMORIA_DESCRIPTIVA", obligatorio: false },
          { id: id(), label: "Presupuesto", tipoDetectado: "PRESUPUESTO", obligatorio: false },
        ],
      },
      { id: "consorcio", titulo: "Consorcio", items: [] },
      {
        id: "validaciones",
        titulo: "Validaciones Externas",
        items: [
          { id: id(), label: "Consulta RUC (SUNAT)", tipoDetectado: "CONSULTA_RUC", obligatorio: true },
          { id: id(), label: "Consulta Deuda Coactiva", tipoDetectado: "CONSULTA_DEUDA_COACTIVA", obligatorio: true },
          { id: id(), label: "Proveedores del Estado (OSCE)", tipoDetectado: "CONSULTA_PROVEEDORES_ESTADO", obligatorio: true },
          { id: id(), label: "Experiencia SEACE", tipoDetectado: "EXPERIENCIA_SEACE", obligatorio: false },
        ],
      },
    ],
  },
  {
    id: "consorcio",
    nombre: "Consorcio",
    descripcion: "Carta fianza cuando el postor es un consorcio de dos o más empresas.",
    bloques: [
      {
        id: "cliente",
        titulo: "Cliente",
        items: [
          { id: id(), label: "F1 - Ficha básica de cliente PJ", tipoDetectado: "F1_FICHA_BASICA", obligatorio: true },
          { id: id(), label: "F2 - Declaración de experiencia", tipoDetectado: "F2_DECLARACION_EXPERIENCIA", obligatorio: true },
          { id: id(), label: "F3 - DJ patrimonial (Accionistas)", tipoDetectado: "F3_DJ_PATRIMONIAL", obligatorio: true },
          { id: id(), label: "DNI", tipoDetectado: "DNI", obligatorio: true },
          { id: id(), label: "DDJJ", tipoDetectado: "DECLARACION_JURADA", obligatorio: true },
          { id: id(), label: "EEFF Situacional, con Notas", tipoDetectado: "EEFF_SITUACIONAL", obligatorio: true },
          { id: id(), label: "Vigencia Poder (≤ 30 días)", tipoDetectado: "VIGENCIA_PODER", obligatorio: true },
          { id: id(), label: "Copia Literal", tipoDetectado: "COPIA_LITERAL", obligatorio: true },
          { id: id(), label: "Carta de Nombramiento", tipoDetectado: "CARTA_NOMBRAMIENTO", obligatorio: true },
        ],
      },
      {
        id: "proyecto",
        titulo: "Proyecto",
        items: [
          { id: id(), label: "Solicitud de emisión", tipoDetectado: "SOLICITUD_EMISION", obligatorio: true },
          { id: id(), label: "Bases Integradas", tipoDetectado: "BASES_INTEGRADAS", obligatorio: true },
          { id: id(), label: "Memoria Descriptiva", tipoDetectado: "MEMORIA_DESCRIPTIVA", obligatorio: false },
          { id: id(), label: "Presupuesto", tipoDetectado: "PRESUPUESTO", obligatorio: false },
          { id: id(), label: "Reporte de Buena Pro", tipoDetectado: "REPORTE_BUENA_PRO", obligatorio: true },
          { id: id(), label: "Acta de Buena Pro", tipoDetectado: "ACTA_BUENA_PRO", obligatorio: true },
        ],
      },
      {
        id: "consorcio",
        titulo: "Consorcio",
        items: [
          { id: id(), label: "Ficha básica del consorcio", tipoDetectado: "FICHA_CONSORCIO", obligatorio: true },
          { id: id(), label: "Contrato de Consorcio", tipoDetectado: "CONTRATO_CONSORCIO", obligatorio: true },
        ],
      },
      {
        id: "validaciones",
        titulo: "Validaciones Externas",
        items: [
          { id: id(), label: "Consulta RUC (SUNAT)", tipoDetectado: "CONSULTA_RUC", obligatorio: true },
          { id: id(), label: "Consulta Deuda Coactiva", tipoDetectado: "CONSULTA_DEUDA_COACTIVA", obligatorio: true },
          { id: id(), label: "Proveedores del Estado (OSCE)", tipoDetectado: "CONSULTA_PROVEEDORES_ESTADO", obligatorio: true },
          { id: id(), label: "Experiencia SEACE", tipoDetectado: "EXPERIENCIA_SEACE", obligatorio: true },
          { id: id(), label: "Reporte Equifax", tipoDetectado: "REPORTE_EQUIFAX", obligatorio: true },
        ],
      },
    ],
  },
];
