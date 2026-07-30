import type { Expediente } from "@/lib/types";

export const plantaAgua: Expediente = {
  id: "exp-planta-agua-aqp",
  nombreProyecto: "Planta de Tratamiento de Agua – Arequipa",
  broker: "Rimac Corredores",
  ejecutivo: "Mariana Torres",
  creadoEn: "2026-07-10T08:30:00-05:00",
  actualizadoEn: "2026-07-28T16:00:00-05:00",
  estado: "listo",
  tiempoAhorradoMin: 41,
  readyScore: {
    valor: 97,
    etiqueta: "Listo para evaluación",
    factores: [
      { id: "documentacion", label: "Documentación", valor: 100, peso: 0.3 },
      { id: "validaciones", label: "Validaciones externas", valor: 98, peso: 0.25 },
      { id: "experiencia", label: "Experiencia (SEACE)", valor: 94, peso: 0.2 },
      { id: "equifax", label: "Equifax", valor: 96, peso: 0.15 },
      { id: "consistencia", label: "Consistencia de datos", valor: 96, peso: 0.1 },
    ],
  },
  confianzaIA: { valor: 98, mensaje: "Expediente listo para evaluación." },
  riesgos: [
    { id: "documental", titulo: "Riesgo Documental", nivel: "bajo", descripcion: "Checklist completo al 100%.", detalle: ["Todos los documentos obligatorios fueron recibidos y validados."] },
    { id: "financiero", titulo: "Riesgo Financiero", nivel: "bajo", descripcion: "Patrimonio sólido frente al monto referencial.", detalle: ["Patrimonio cubre el 48% del monto referencial."] },
    { id: "legal", titulo: "Riesgo Legal", nivel: "bajo", descripcion: "Sin observaciones legales.", detalle: ["Vigencia de poder vigente por 8 meses más."] },
    { id: "operativo", titulo: "Riesgo Operativo", nivel: "bajo", descripcion: "Experiencia técnica alineada.", detalle: ["Experiencia previa en 6 plantas de tratamiento similares."] },
  ],
  executiveBrief: {
    generadoEn: "2026-07-28T16:00:00-05:00",
    parrafos: [
      "El expediente corresponde a la construcción de una planta de tratamiento de agua potable en Arequipa, convocada por SEDAPAR, por un monto referencial de S/ 14,200,000.",
      "La documentación se encuentra completa al 100% y las validaciones externas no muestran alertas. El proveedor cuenta con experiencia directa en 6 proyectos similares.",
    ],
    montoReferencial: 14_200_000,
    entidad: "SEDAPAR",
    estadoDocumentalPct: 100,
    pendientes: [],
    recomendacion: "Expediente listo para pasar directamente a evaluación técnica.",
  },
  insights: [
    { id: "i1", texto: "Checklist documental completo al 100%.", tono: "success" },
    { id: "i2", texto: "Sin deuda coactiva ni sanciones.", tono: "success" },
    { id: "i3", texto: "Experiencia altamente compatible (94%).", tono: "success" },
  ],
  checklist: [
    { id: "cliente", titulo: "Cliente", items: [
      { id: "c1", label: "F1 - Ficha básica de cliente PJ", estado: "completo" },
      { id: "c2", label: "DNI representante legal", estado: "completo" },
      { id: "c3", label: "Vigencia Poder", estado: "completo" },
    ]},
    { id: "proyecto", titulo: "Proyecto", items: [
      { id: "p1", label: "Bases Integradas", estado: "completo" },
      { id: "p2", label: "Acta de Buena Pro", estado: "completo" },
    ]},
    { id: "consorcio", titulo: "Consorcio", items: [] },
    { id: "validaciones", titulo: "Validaciones Externas", items: [
      { id: "v1", label: "Consulta RUC (SUNAT)", estado: "completo" },
      { id: "v2", label: "Reporte Equifax", estado: "completo" },
    ]},
  ],
  documentos: [
    { id: "d1", nombre: "F1_Ficha_Basica_Hidraulica_Sur.pdf", extension: "pdf", tamanioBytes: 1_887_436, subidoEn: "2026-07-10T09:00:00-05:00", categoria: "cliente", tipoDetectado: "F1_FICHA_BASICA", confianzaDeteccion: 0.98, estado: "completo" },
    { id: "d2", nombre: "Bases_Integradas_SEDAPAR.pdf", extension: "pdf", tamanioBytes: 4_194_304, subidoEn: "2026-07-10T09:10:00-05:00", categoria: "proyecto", tipoDetectado: "BASES_INTEGRADAS", confianzaDeteccion: 0.95, estado: "completo" },
  ],
  evidencias: [
    { id: "e1", nombreArchivo: "Consulta_RUC.pdf", tipoDetectado: "CONSULTA_RUC", tituloVisible: "Consulta RUC", subidoEn: "2026-07-10T09:20:00-05:00", estado: "completo", resultados: [{ etiqueta: "Estado", valor: "Activo y Habido", tono: "success" }], resumenIA: "RUC activo y habido, sin observaciones." },
  ],
  informacionExtraida: {
    razonSocial: "Hidráulica del Sur S.A.C.",
    ruc: "20456789123",
    representanteLegal: "Rosa Elena Mendoza Quispe",
    direccion: "Av. Ejército 456, Arequipa",
    correo: "contacto@hidraulicasur.com",
    actividadEconomica: "Construcción de obras de ingeniería civil",
    patrimonio: 6_820_000,
  },
  sustentosPago: [],
  chat: [
    { id: "m1", role: "assistant", content: "Expediente listo para evaluación. ¿En qué puedo ayudarte?", createdAt: "2026-07-28T16:00:00-05:00" },
  ],
};

export const viaExpresa: Expediente = {
  id: "exp-via-expresa-sur",
  nombreProyecto: "Vía Expresa Sur – Concesión Vial",
  broker: "Marsh Perú",
  ejecutivo: "Mariana Torres",
  creadoEn: "2026-07-22T11:00:00-05:00",
  actualizadoEn: "2026-07-29T08:10:00-05:00",
  estado: "observado",
  tiempoAhorradoMin: 22,
  readyScore: {
    valor: 58,
    etiqueta: "Requiere atención",
    factores: [
      { id: "documentacion", label: "Documentación", valor: 62, peso: 0.3 },
      { id: "validaciones", label: "Validaciones externas", valor: 40, peso: 0.25 },
      { id: "experiencia", label: "Experiencia (SEACE)", valor: 70, peso: 0.2 },
      { id: "equifax", label: "Equifax", valor: 55, peso: 0.15 },
      { id: "consistencia", label: "Consistencia de datos", valor: 60, peso: 0.1 },
    ],
  },
  confianzaIA: { valor: 61, mensaje: "Expediente con observaciones relevantes." },
  riesgos: [
    { id: "documental", titulo: "Riesgo Documental", nivel: "alto", descripcion: "6 documentos pendientes de un total de 15.", detalle: ["Falta Contrato de Consorcio.", "Falta Vigencia de Poder actualizada."] },
    { id: "financiero", titulo: "Riesgo Financiero", nivel: "medio", descripcion: "Patrimonio ajustado frente al monto referencial.", detalle: ["Patrimonio cubre solo el 9% del monto referencial."] },
    { id: "legal", titulo: "Riesgo Legal", nivel: "critico", descripcion: "Sanción registrada en OSCE en proceso de apelación.", detalle: ["Sanción vigente sujeta a apelación ante el Tribunal de Contrataciones."] },
    { id: "operativo", titulo: "Riesgo Operativo", nivel: "medio", descripcion: "Experiencia parcialmente compatible.", detalle: ["38% de contratos corresponden a obras viales."] },
  ],
  executiveBrief: {
    generadoEn: "2026-07-29T08:10:00-05:00",
    parrafos: [
      "El expediente corresponde a la concesión vial Vía Expresa Sur, con un monto referencial de S/ 68,000,000. Se identificaron observaciones legales relevantes que requieren revisión antes de continuar.",
      "Se detectó una sanción registrada en OSCE actualmente en proceso de apelación, y el patrimonio declarado cubre solo el 9% del monto referencial.",
    ],
    montoReferencial: 68_000_000,
    entidad: "MTC - Provías Nacional",
    estadoDocumentalPct: 58,
    pendientes: ["Contrato de Consorcio", "Vigencia de Poder", "EEFF Situacional", "Carta de Nombramiento"],
    recomendacion: "Se recomienda escalar al Ejecutivo Comercial antes de continuar el análisis por la sanción OSCE en apelación.",
  },
  insights: [
    { id: "i1", texto: "Sanción OSCE en proceso de apelación.", tono: "danger" },
    { id: "i2", texto: "Patrimonio cubre solo el 9% del monto referencial.", tono: "warning" },
    { id: "i3", texto: "Faltan 6 documentos obligatorios.", tono: "warning" },
  ],
  checklist: [
    { id: "cliente", titulo: "Cliente", items: [
      { id: "c1", label: "F1 - Ficha básica de cliente PJ", estado: "completo" },
      { id: "c2", label: "Vigencia Poder", estado: "pendiente" },
      { id: "c3", label: "EEFF Situacional", estado: "pendiente" },
    ]},
    { id: "proyecto", titulo: "Proyecto", items: [
      { id: "p1", label: "Bases Integradas", estado: "completo" },
    ]},
    { id: "consorcio", titulo: "Consorcio", items: [
      { id: "k1", label: "Contrato de Consorcio", estado: "pendiente" },
    ]},
    { id: "validaciones", titulo: "Validaciones Externas", items: [
      { id: "v1", label: "Consulta RUC (SUNAT)", estado: "completo" },
      { id: "v2", label: "Proveedores del Estado (OSCE)", estado: "advertencia", notas: "Sanción en apelación" },
    ]},
  ],
  documentos: [
    { id: "d1", nombre: "F1_Ficha_Basica_Concesionaria.pdf", extension: "pdf", tamanioBytes: 1_310_720, subidoEn: "2026-07-22T11:30:00-05:00", categoria: "cliente", tipoDetectado: "F1_FICHA_BASICA", confianzaDeteccion: 0.96, estado: "completo" },
  ],
  evidencias: [
    { id: "e1", nombreArchivo: "Reporte_Proveedores_Estado_OSCE.pdf", tipoDetectado: "CONSULTA_PROVEEDORES_ESTADO", tituloVisible: "Proveedores del Estado (OSCE)", subidoEn: "2026-07-22T12:00:00-05:00", estado: "advertencia", resultados: [{ etiqueta: "Sanción", valor: "En apelación", tono: "danger" }], resumenIA: "Sanción registrada, actualmente en proceso de apelación ante el Tribunal de Contrataciones." },
  ],
  informacionExtraida: {
    razonSocial: "Concesionaria Vial del Sur S.A.",
    ruc: "20789456123",
    representanteLegal: "Fernando Aguilar Rojas",
    direccion: "Av. Javier Prado 2100, Lima",
    correo: "legal@concesionariavialsur.com",
    actividadEconomica: "Construcción de carreteras",
    patrimonio: 6_100_000,
  },
  sustentosPago: [],
  chat: [
    { id: "m1", role: "assistant", content: "Este expediente tiene observaciones legales importantes. ¿Quieres que te muestre el detalle de la sanción OSCE?", createdAt: "2026-07-29T08:10:00-05:00" },
  ],
};

export const colegioSanMartin: Expediente = {
  id: "exp-colegio-san-martin",
  nombreProyecto: "Colegio Nacional San Martín – Ampliación",
  broker: "Willis Towers Watson",
  ejecutivo: "Mariana Torres",
  creadoEn: "2026-07-05T10:00:00-05:00",
  actualizadoEn: "2026-07-24T09:00:00-05:00",
  estado: "aprobado",
  tiempoAhorradoMin: 35,
  readyScore: {
    valor: 100,
    etiqueta: "Aprobado",
    factores: [
      { id: "documentacion", label: "Documentación", valor: 100, peso: 0.3 },
      { id: "validaciones", label: "Validaciones externas", valor: 100, peso: 0.25 },
      { id: "experiencia", label: "Experiencia (SEACE)", valor: 100, peso: 0.2 },
      { id: "equifax", label: "Equifax", valor: 100, peso: 0.15 },
      { id: "consistencia", label: "Consistencia de datos", valor: 100, peso: 0.1 },
    ],
  },
  confianzaIA: { valor: 99, mensaje: "Expediente aprobado y emitido." },
  riesgos: [
    { id: "documental", titulo: "Riesgo Documental", nivel: "bajo", descripcion: "Checklist completo.", detalle: ["Sin pendientes."] },
    { id: "financiero", titulo: "Riesgo Financiero", nivel: "bajo", descripcion: "Sin observaciones.", detalle: ["Patrimonio ampliamente suficiente."] },
    { id: "legal", titulo: "Riesgo Legal", nivel: "bajo", descripcion: "Sin observaciones.", detalle: ["Documentación legal vigente."] },
    { id: "operativo", titulo: "Riesgo Operativo", nivel: "bajo", descripcion: "Experiencia amplia en obras educativas.", detalle: ["14 contratos ejecutados en infraestructura educativa."] },
  ],
  executiveBrief: {
    generadoEn: "2026-07-24T09:00:00-05:00",
    parrafos: ["Expediente aprobado y emitido sin observaciones. Proyecto de ampliación de infraestructura educativa por S/ 5,400,000 para el Colegio Nacional San Martín."],
    montoReferencial: 5_400_000,
    entidad: "UGEL 04",
    estadoDocumentalPct: 100,
    pendientes: [],
    recomendacion: "Expediente cerrado. Sin acciones pendientes.",
  },
  insights: [{ id: "i1", texto: "Expediente aprobado sin observaciones.", tono: "success" }],
  checklist: [
    { id: "cliente", titulo: "Cliente", items: [{ id: "c1", label: "F1 - Ficha básica de cliente PJ", estado: "completo" }] },
    { id: "proyecto", titulo: "Proyecto", items: [{ id: "p1", label: "Bases Integradas", estado: "completo" }] },
    { id: "consorcio", titulo: "Consorcio", items: [] },
    { id: "validaciones", titulo: "Validaciones Externas", items: [{ id: "v1", label: "Consulta RUC (SUNAT)", estado: "completo" }] },
  ],
  documentos: [],
  evidencias: [],
  informacionExtraida: {
    razonSocial: "Constructora Educativa del Perú S.A.C.",
    ruc: "20345678912",
    representanteLegal: "Patricia Ríos Salazar",
    direccion: "Jr. Cusco 890, Lima",
    correo: "administracion@construeduca.pe",
    actividadEconomica: "Construcción de edificios",
    patrimonio: 4_200_000,
  },
  sustentosPago: [],
  chat: [{ id: "m1", role: "assistant", content: "Este expediente ya fue aprobado y emitido.", createdAt: "2026-07-24T09:00:00-05:00" }],
};
