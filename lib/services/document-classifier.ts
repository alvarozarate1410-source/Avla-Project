import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";

/** A plain string is matched as a literal substring; a RegExp allows the
 * word-order/preposition variance real document titles have ("ficha basica
 * DE cliente" vs "ficha basica DEL cliente" vs "ficha basica -- persona
 * juridica --") without needing to enumerate every exact phrasing. */
type Keyword = string | RegExp;

interface Rule {
  tipo: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  nombreCanonico: string;
  contentKeywords: Keyword[];
  /** Extra content phrases that, when present, strongly confirm the type —
   * used for documents whose real-world phrasing varies a lot. */
  strongContentKeywords?: Keyword[];
}

// Classification is content-only, on purpose: brokers name files however
// they want, with no consistent convention we can rely on, so a filename
// match used to be able to override what the document actually says. A
// rule only ever scores against extracted/OCR'd text now — which means
// every keyword list below has to genuinely stand on its own; there's no
// filename score left to quietly compensate for a keyword list that's too
// narrow.
const RULES: Rule[] = [
  {
    tipo: "F1_FICHA_BASICA",
    categoria: "cliente",
    nombreCanonico: "F1_Ficha_Basica_Cliente",
    contentKeywords: [/ficha\s+b[aá]sica.{0,40}(cliente|persona\s+jur[ií]dica)/, "ficha de datos del cliente"],
  },
  {
    tipo: "F2_DECLARACION_EXPERIENCIA",
    categoria: "cliente",
    nombreCanonico: "F2_Declaracion_Experiencia",
    contentKeywords: [/declaraci[oó]n\s+(jurada\s+)?de\s+experiencia/, "experiencia del proveedor", "relacion de contratos ejecutados"],
  },
  {
    tipo: "F3_DJ_PATRIMONIAL",
    categoria: "cliente",
    nombreCanonico: "F3_DJ_Patrimonial",
    contentKeywords: [/declaraci[oó]n\s+jurada.{0,25}patrimon/, "composicion accionaria", "declaracion jurada de bienes"],
  },
  { tipo: "DNI", categoria: "cliente", nombreCanonico: "DNI_Representante_Legal", contentKeywords: ["documento nacional de identidad", "reniec"] },
  {
    tipo: "DECLARACION_JURADA",
    categoria: "cliente",
    nombreCanonico: "DDJJ",
    contentKeywords: ["declaro bajo juramento", /declaraci[oó]n\s+jurada\s+de\s+(no\s+)?(tener|estar|encontrarse)/],
  },
  {
    tipo: "EEFF_SITUACIONAL",
    categoria: "cliente",
    nombreCanonico: "EEFF_Situacional",
    contentKeywords: ["estado de situacion financiera", "estados financieros", "situacion financiera"],
  },
  {
    tipo: "VIGENCIA_PODER",
    categoria: "cliente",
    nombreCanonico: "Vigencia_Poder",
    contentKeywords: [/vigencia\s+de\s+poder/, "registro de personas juridicas", "poderes inscritos"],
  },
  { tipo: "COPIA_LITERAL", categoria: "cliente", nombreCanonico: "Copia_Literal", contentKeywords: [/copia\s+literal/, "partida registral"] },
  {
    tipo: "CARTA_NOMBRAMIENTO",
    categoria: "cliente",
    nombreCanonico: "Carta_Nombramiento",
    contentKeywords: [/carta\s+de\s+nombramiento/, "designamos como representante", "hacemos de su conocimiento que se ha designado"],
  },
  {
    tipo: "SOLICITUD_EMISION",
    categoria: "proyecto",
    nombreCanonico: "Solicitud_Emision",
    contentKeywords: [/solicitud\s+de\s+emisi[oó]n/, "solicito la emision de la carta fianza", "carta fianza de fiel cumplimiento"],
  },
  {
    tipo: "BASES_INTEGRADAS",
    categoria: "proyecto",
    nombreCanonico: "Bases_Integradas",
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
  { tipo: "MEMORIA_DESCRIPTIVA", categoria: "proyecto", nombreCanonico: "Memoria_Descriptiva", contentKeywords: [/memoria\s+descriptiva/] },
  { tipo: "PRESUPUESTO", categoria: "proyecto", nombreCanonico: "Presupuesto", contentKeywords: [/presupuesto\s+(de\s+obra|referencial|base)/, "costo directo", "gastos generales"] },
  {
    tipo: "REPORTE_BUENA_PRO",
    categoria: "proyecto",
    nombreCanonico: "Reporte_Buena_Pro",
    contentKeywords: ["reporte de buena pro", /otorgamiento\s+de\s+la\s+buena\s+pro/, /consentimiento\s+de\s+la\s+buena\s+pro/, "postor ganador"],
  },
  {
    tipo: "ACTA_BUENA_PRO",
    categoria: "proyecto",
    nombreCanonico: "Acta_Buena_Pro",
    contentKeywords: [/acta\s+de\s+(otorgamiento\s+de\s+)?buena\s+pro/, "se otorga la buena pro"],
  },
  {
    tipo: "FICHA_CONSORCIO",
    categoria: "consorcio",
    nombreCanonico: "Ficha_Consorcio",
    contentKeywords: [/ficha\s+b[aá]sica.{0,30}consorcio/, "datos del consorcio"],
  },
  {
    tipo: "CONTRATO_CONSORCIO",
    categoria: "consorcio",
    nombreCanonico: "Contrato_Consorcio",
    contentKeywords: [/contrato\s+de\s+consorcio/, "participacion del consorcio", "consorciados acuerdan", "los consorciados"],
  },
  {
    tipo: "CONTRATO_ENTIDAD",
    categoria: "proyecto",
    nombreCanonico: "Contrato",
    // Deliberately avoid the bare word "contrato" (too generic, collides with
    // Contrato de Consorcio) — require it paired with entity/contractor language.
    contentKeywords: [/contrato\s+de\s+(obra|ejecuci[oó]n\s+de\s+obra|servicio)/, "el contratista y la entidad", "orden de servicio", "contratista y la entidad contratante"],
  },
  { tipo: "CONSULTA_RUC", categoria: "validaciones", nombreCanonico: "Consulta_RUC", contentKeywords: [/consulta.{0,15}ruc/, "numero de ruc", "condicion del contribuyente"] },
  { tipo: "CONSULTA_DEUDA_COACTIVA", categoria: "validaciones", nombreCanonico: "Consulta_Deuda_Coactiva", contentKeywords: [/deuda\s+coactiva/, "cobranza coactiva"] },
  {
    tipo: "CONSULTA_PROVEEDORES_ESTADO",
    categoria: "validaciones",
    nombreCanonico: "Proveedores_Estado_OSCE",
    contentKeywords: ["registro nacional de proveedores", "capitulo de bienes", "proveedores del estado", /\bosce\b/],
  },
  { tipo: "EXPERIENCIA_SEACE", categoria: "validaciones", nombreCanonico: "Experiencia_SEACE", contentKeywords: [/\bseace\b/, "buscador de convocatorias"] },
  { tipo: "REPORTE_EQUIFAX", categoria: "validaciones", nombreCanonico: "Reporte_Equifax", contentKeywords: [/\bequifax\b/, "score crediticio"] },
  {
    tipo: "SUSTENTO_PAGO",
    categoria: "validaciones",
    nombreCanonico: "Sustento_Pago",
    contentKeywords: ["constancia de transferencia", "numero de operacion", /comprobante\s+de\s+pago/, "voucher"],
  },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;

function matches(textNorm: string, kw: Keyword): boolean {
  return typeof kw === "string" ? textNorm.includes(normalize(kw)) : kw.test(textNorm);
}

export interface ClassificationResult {
  tipoDetectado: TipoDocumentoDetectado;
  categoria: CategoriaChecklist;
  confianza: number;
  nombreSugerido: string;
}

export function classifyDocument(fileName: string, extractedText: string): ClassificationResult {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const textNorm = normalize(extractedText);

  let best: { rule: Rule; score: number } | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.contentKeywords) {
      if (matches(textNorm, kw)) score += 0.45;
    }
    for (const kw of rule.strongContentKeywords ?? []) {
      if (matches(textNorm, kw)) score += 0.3;
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
