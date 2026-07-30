import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/parsers/extract-text";
import { classifyDocument } from "@/lib/services/document-classifier";
import { interpretEvidence } from "@/lib/services/evidence-interpreter";
import { analyzeSeaceWorkbook } from "@/lib/parsers/parse-seace-excel";
import { interpretF1, interpretBasesIntegradas, interpretReporteBuenaPro, extractNombreProyecto } from "@/lib/services/proyecto-interpreter";
import type { InformacionExtraida, RequerimientoInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const context = formData?.get("context");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extraction = await extractText(file.name, buffer);
  const text = extraction.text;
  const classification = classifyDocument(file.name, text);

  let resultados: ReturnType<typeof interpretEvidence>["resultados"] = [];
  let resumenIA = "";
  let equifaxUpdate: ReturnType<typeof interpretEvidence>["equifaxUpdate"] = undefined;
  let sustentoPagoUpdate: ReturnType<typeof interpretEvidence>["sustentoPagoUpdate"] = undefined;
  let experienceMatch = undefined;
  let f1Data: Partial<InformacionExtraida> | null = null;
  let requerimientoData: RequerimientoInfo | null = null;
  let buenaProData: { montoAdjudicado?: number; beneficiario?: string } | null = null;
  let nombreProyectoSugerido: string | null = null;

  if (classification.tipoDetectado === "BASES_INTEGRADAS" || classification.tipoDetectado === "SOLICITUD_EMISION") {
    nombreProyectoSugerido = extractNombreProyecto(text) ?? null;
  }

  if (classification.tipoDetectado === "EXPERIENCIA_SEACE") {
    experienceMatch = analyzeSeaceWorkbook(buffer, typeof context === "string" ? context : "") ?? undefined;
    if (experienceMatch) {
      resultados = [
        { etiqueta: "Contratos analizados", valor: String(experienceMatch.contratosAnalizados), tono: "neutral" },
        {
          etiqueta: "Compatibles",
          valor: `${experienceMatch.contratosCompatibles} (${experienceMatch.projectFitScore}%)`,
          tono: experienceMatch.projectFitScore >= 60 ? "success" : "warning",
        },
      ];
      resumenIA = experienceMatch.explicacion;
    } else {
      resumenIA = "No se pudo analizar el archivo de experiencia SEACE. Verifica que sea un Excel con columnas de objeto y entidad.";
    }
  } else if (classification.tipoDetectado === "F1_FICHA_BASICA" || classification.tipoDetectado === "F3_DJ_PATRIMONIAL") {
    f1Data = interpretF1(text);
    const found = Object.keys(f1Data).length;
    resultados = [{ etiqueta: "Datos extraídos", valor: `${found} campo(s)`, tono: found > 0 ? "success" : "warning" }];
    resumenIA =
      found > 0
        ? `Se extrajeron ${found} campo(s) del cliente${f1Data.razonSocial ? ` (${f1Data.razonSocial})` : ""}.`
        : "No se pudieron extraer campos automáticamente de este documento. Revisa el formato.";
  } else if (classification.tipoDetectado === "BASES_INTEGRADAS") {
    requerimientoData = interpretBasesIntegradas(text);
    const found = Object.keys(requerimientoData).length;
    resultados = [{ etiqueta: "Requerimiento", valor: `${found} campo(s) identificados`, tono: found > 0 ? "success" : "warning" }];
    resumenIA =
      found > 0
        ? `Se identificó el Requerimiento: ${[
            requerimientoData.lugarEjecucion && `lugar de ejecución (${requerimientoData.lugarEjecucion})`,
            requerimientoData.montoAdjudicado && `monto adjudicado (S/ ${requerimientoData.montoAdjudicado.toLocaleString("es-PE")})`,
            requerimientoData.plazoValor && `plazo (${requerimientoData.plazoValor} ${requerimientoData.plazoUnidad})`,
          ]
            .filter(Boolean)
            .join(", ")}.`
        : "No se pudo extraer automáticamente la sección de Requerimiento. Revisa el documento.";
  } else if (classification.tipoDetectado === "REPORTE_BUENA_PRO") {
    buenaProData = interpretReporteBuenaPro(text);
    const found = Object.keys(buenaProData).length;
    resultados = [{ etiqueta: "Datos extraídos", valor: `${found} campo(s)`, tono: found > 0 ? "success" : "warning" }];
    resumenIA =
      buenaProData.montoAdjudicado !== undefined
        ? `Monto adjudicado según Reporte de Buena Pro: S/ ${buenaProData.montoAdjudicado.toLocaleString("es-PE")}.`
        : "No se pudo extraer automáticamente el monto adjudicado de este reporte.";
  } else if (classification.tipoDetectado !== "DESCONOCIDO") {
    const interpretation = interpretEvidence(classification.tipoDetectado, text);
    resultados = interpretation.resultados;
    resumenIA = interpretation.resumenIA;
    equifaxUpdate = interpretation.equifaxUpdate;
    sustentoPagoUpdate = interpretation.sustentoPagoUpdate;
  } else if (extraction.error) {
    // Genuinely couldn't read the file — say exactly why instead of a mute
    // "unrecognized document" badge, so the Ejecutivo knows whether to
    // retry, re-scan, or just accept it needs manual review.
    resumenIA = `No se pudo leer este documento: ${extraction.error}`;
  } else if (!text.trim()) {
    resumenIA = "El documento se procesó pero no se encontró texto legible en él. Revísalo manualmente.";
  } else {
    resumenIA = "El documento se leyó correctamente, pero su contenido no coincide con ningún tipo de documento conocido. Revísalo manualmente.";
  }

  return NextResponse.json({
    fileName: file.name,
    size: file.size,
    ...classification,
    extracto: text.slice(0, 240),
    resultados,
    resumenIA,
    extractionMethod: extraction.method,
    extractionWarning: extraction.warning ?? null,
    extractionError: extraction.error ?? null,
    equifaxUpdate: equifaxUpdate ?? null,
    sustentoPagoUpdate: sustentoPagoUpdate ?? null,
    experienceMatch: experienceMatch ?? null,
    f1Data,
    requerimientoData,
    buenaProData,
    nombreProyectoSugerido,
  });
}
