import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";

interface Rule {
  tipo: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  nombreCanonico: string;
  filenameKeywords: string[];
  contentKeywords: string[];
  /** Extra content phrases that, when present, strongly confirm the type even
   * with an unrelated filename — used for documents whose file naming in the
   * wild is highly inconsistent (e.g. Bases Integradas/Administrativas). */
  strongContentKeywords?: string[];
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
  {
    tipo: "BASES_INTEGRADAS",
    categoria: "proyecto",
    nombreCanonico: "Bases_Integradas",
    // Real-world filenames vary a lot (TDR, "bases adm", version numbers,
    // acronyms) — content is the reliable signal, filename keywords are just
    // a bonus when they happen to be there.
    filenameKeywords: ["bases integradas", "bases administrativas", "base administrativa", "bases", "tdr", "terminos de referencia"],
    contentKeywords: [
      "bases integradas",
      "bases del procedimiento",
      "bases administrativas",
      "base administrativa",
      "seccion especifica",
      "requerimientos tecnicos minimos",
      "factor de evaluacion",
      "sistema de contratacion",
      "valor referencial",
    ],
    strongContentKeywords: ["capitulo i", "capitulo ii", "capitulo iii", "seccion general", "seccion especifica de las bases"],
  },
  { tipo: "MEMORIA_DESCRIPTIVA", categoria: "proyecto", nombreCanonico: "Memoria_Descriptiva", filenameKeywords: ["memoria descriptiva"], contentKeywords: ["memoria descriptiva"] },
  { tipo: "PRESUPUESTO", categoria: "proyecto", nombreCanonico: "Presupuesto", filenameKeywords: ["presupuesto"], contentKeywords: ["presupuesto de obra", "presupuesto referencial"] },
  { tipo: "REPORTE_BUENA_PRO", categoria: "proyecto", nombreCanonico: "Reporte_Buena_Pro", filenameKeywords: ["reporte de buena pro", "reporte buena pro"], contentKeywords: ["otorgamiento de la buena pro", "consentimiento de la buena pro"] },
  { tipo: "ACTA_BUENA_PRO", categoria: "proyecto", nombreCanonico: "Acta_Buena_Pro", filenameKeywords: ["acta de buena pro", "acta buena pro"], contentKeywords: ["acta de otorgamiento de buena pro"] },
  { tipo: "FICHA_CONSORCIO", categoria: "consorcio", nombreCanonico: "Ficha_Consorcio", filenameKeywords: ["ficha consorcio", "ficha del consorcio"], contentKeywords: ["ficha basica del consorcio"] },
  { tipo: "CONTRATO_CONSORCIO", categoria: "consorcio", nombreCanonico: "Contrato_Consorcio", filenameKeywords: ["contrato de consorcio", "contrato consorcio"], contentKeywords: ["contrato de consorcio", "participacion del consorcio", "consorciados acuerdan"] },
  {
    tipo: "CONTRATO_ENTIDAD",
    categoria: "proyecto",
    nombreCanonico: "Contrato",
    filenameKeywords: ["contrato de obra", "contrato de servicio", "contrato n"],
    // Deliberately avoid the bare word "contrato" (too generic, collides with
    // Contrato de Consorcio) — require it paired with entity/contractor language.
    contentKeywords: ["contrato de obra", "contrato de ejecucion de obra", "el contratista y la entidad", "orden de servicio", "contratista y la entidad contratante"],
  },
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
    // Content is the trustworthy signal — filenames in the wild are
    // inconsistent, so content matches are weighted at least as heavily.
    for (const kw of rule.filenameKeywords) {
      if (nameNorm.includes(normalize(kw))) score += 0.45;
    }
    for (const kw of rule.contentKeywords) {
      if (textNorm.includes(normalize(kw))) score += 0.45;
    }
    for (const kw of rule.strongContentKeywords ?? []) {
      if (textNorm.includes(normalize(kw))) score += 0.3;
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

  const confianza = Math.min(0.99, 0.55 + best.score * 0.35);
  return {
    tipoDetectado: best.rule.tipo,
    categoria: best.rule.categoria,
    confianza: Number(confianza.toFixed(2)),
    nombreSugerido: `${best.rule.nombreCanonico}.${ext}`,
  };
}
