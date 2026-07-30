import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";

interface Rule {
  tipo: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  nombreCanonico: string;
  filenameKeywords: string[];
  contentKeywords: string[];
}

const RULES: Rule[] = [
  { tipo: "F1_FICHA_BASICA", categoria: "cliente", nombreCanonico: "F1_Ficha_Basica_Cliente", filenameKeywords: ["f1", "ficha basica", "ficha de cliente"], contentKeywords: ["ficha basica del cliente", "ficha basica persona juridica"] },
  { tipo: "F2_DECLARACION_EXPERIENCIA", categoria: "cliente", nombreCanonico: "F2_Declaracion_Experiencia", filenameKeywords: ["f2", "declaracion de experiencia", "experiencia"], contentKeywords: ["declaracion de experiencia", "experiencia del proveedor"] },
  { tipo: "F3_DJ_PATRIMONIAL", categoria: "cliente", nombreCanonico: "F3_DJ_Patrimonial", filenameKeywords: ["f3", "dj patrimonial", "declaracion jurada patrimonial", "accionistas"], contentKeywords: ["declaracion jurada patrimonial", "composicion accionaria"] },
  { tipo: "DNI", categoria: "cliente", nombreCanonico: "DNI_Representante_Legal", filenameKeywords: ["dni"], contentKeywords: ["documento nacional de identidad", "reniec"] },
  { tipo: "DECLARACION_JURADA", categoria: "cliente", nombreCanonico: "DDJJ", filenameKeywords: ["ddjj", "declaracion jurada"], contentKeywords: ["declaro bajo juramento"] },
  { tipo: "EEFF_SITUACIONAL", categoria: "cliente", nombreCanonico: "EEFF_Situacional", filenameKeywords: ["eeff", "estados financieros", "situacional"], contentKeywords: ["estado de situacion financiera", "estados financieros"] },
  { tipo: "VIGENCIA_PODER", categoria: "cliente", nombreCanonico: "Vigencia_Poder", filenameKeywords: ["vigencia de poder", "vigencia poder"], contentKeywords: ["vigencia de poder", "registro de personas juridicas"] },
  { tipo: "COPIA_LITERAL", categoria: "cliente", nombreCanonico: "Copia_Literal", filenameKeywords: ["copia literal"], contentKeywords: ["copia literal de dominio", "partida registral"] },
  { tipo: "CARTA_NOMBRAMIENTO", categoria: "cliente", nombreCanonico: "Carta_Nombramiento", filenameKeywords: ["carta de nombramiento", "nombramiento"], contentKeywords: ["carta de nombramiento", "designamos como representante"] },
  { tipo: "SOLICITUD_EMISION", categoria: "proyecto", nombreCanonico: "Solicitud_Emision", filenameKeywords: ["solicitud de emision", "c1"], contentKeywords: ["solicitud de emision de carta fianza", "solicitud de emision"] },
  { tipo: "BASES_INTEGRADAS", categoria: "proyecto", nombreCanonico: "Bases_Integradas", filenameKeywords: ["bases integradas", "bases"], contentKeywords: ["bases integradas", "bases del procedimiento"] },
  { tipo: "MEMORIA_DESCRIPTIVA", categoria: "proyecto", nombreCanonico: "Memoria_Descriptiva", filenameKeywords: ["memoria descriptiva"], contentKeywords: ["memoria descriptiva"] },
  { tipo: "PRESUPUESTO", categoria: "proyecto", nombreCanonico: "Presupuesto", filenameKeywords: ["presupuesto"], contentKeywords: ["presupuesto de obra", "presupuesto referencial"] },
  { tipo: "REPORTE_BUENA_PRO", categoria: "proyecto", nombreCanonico: "Reporte_Buena_Pro", filenameKeywords: ["reporte de buena pro", "reporte buena pro"], contentKeywords: ["otorgamiento de la buena pro"] },
  { tipo: "ACTA_BUENA_PRO", categoria: "proyecto", nombreCanonico: "Acta_Buena_Pro", filenameKeywords: ["acta de buena pro", "acta buena pro"], contentKeywords: ["acta de otorgamiento de buena pro"] },
  { tipo: "FICHA_CONSORCIO", categoria: "consorcio", nombreCanonico: "Ficha_Consorcio", filenameKeywords: ["ficha consorcio", "ficha del consorcio"], contentKeywords: ["ficha basica del consorcio"] },
  { tipo: "CONTRATO_CONSORCIO", categoria: "consorcio", nombreCanonico: "Contrato_Consorcio", filenameKeywords: ["contrato de consorcio", "contrato consorcio"], contentKeywords: ["contrato de consorcio", "participacion del consorcio"] },
  { tipo: "CONSULTA_RUC", categoria: "validaciones", nombreCanonico: "Consulta_RUC", filenameKeywords: ["consulta ruc", "sunat ruc"], contentKeywords: ["consulta ruc", "numero de ruc", "condicion del contribuyente"] },
  { tipo: "CONSULTA_DEUDA_COACTIVA", categoria: "validaciones", nombreCanonico: "Consulta_Deuda_Coactiva", filenameKeywords: ["deuda coactiva"], contentKeywords: ["deuda coactiva", "cobranza coactiva"] },
  { tipo: "CONSULTA_PROVEEDORES_ESTADO", categoria: "validaciones", nombreCanonico: "Proveedores_Estado_OSCE", filenameKeywords: ["proveedores del estado", "osce", "rnp"], contentKeywords: ["registro nacional de proveedores", "capitulo de bienes"] },
  { tipo: "EXPERIENCIA_SEACE", categoria: "validaciones", nombreCanonico: "Experiencia_SEACE", filenameKeywords: ["seace", "experiencia seace"], contentKeywords: ["seace", "buscador de convocatorias"] },
  { tipo: "REPORTE_EQUIFAX", categoria: "validaciones", nombreCanonico: "Reporte_Equifax", filenameKeywords: ["equifax"], contentKeywords: ["equifax", "score crediticio"] },
  { tipo: "SUSTENTO_PAGO", categoria: "validaciones", nombreCanonico: "Sustento_Pago", filenameKeywords: ["sustento de pago", "voucher", "comprobante de pago"], contentKeywords: ["constancia de transferencia", "numero de operacion"] },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ClassificationResult {
  tipoDetectado: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  confianza: number;
  nombreSugerido: string;
}

export function classifyDocument(fileName: string, extractedText: string): ClassificationResult {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const nameNorm = normalize(fileName.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
  const textNorm = normalize(extractedText);

  let best: { rule: Rule; score: number } | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.filenameKeywords) {
      if (nameNorm.includes(normalize(kw))) score += 0.55;
    }
    for (const kw of rule.contentKeywords) {
      if (textNorm.includes(normalize(kw))) score += 0.35;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score };
    }
  }

  if (!best) {
    return {
      tipoDetectado: "DESCONOCIDO",
      categoria: "cliente",
      confianza: 0,
      nombreSugerido: fileName,
    };
  }

  const confianza = Math.min(0.99, 0.55 + best.score * 0.4);
  return {
    tipoDetectado: best.rule.tipo,
    categoria: best.rule.categoria,
    confianza: Number(confianza.toFixed(2)),
    nombreSugerido: `${best.rule.nombreCanonico}.${ext}`,
  };
}
