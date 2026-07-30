import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/parsers/extract-text";
import { classifyDocument } from "@/lib/services/document-classifier";
import { interpretEvidence } from "@/lib/services/evidence-interpreter";
import { analyzeSeaceWorkbook } from "@/lib/parsers/parse-seace-excel";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const context = formData?.get("context");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractText(file.name, buffer);
  const classification = classifyDocument(file.name, text);

  let resultados: ReturnType<typeof interpretEvidence>["resultados"] = [];
  let resumenIA = "";
  let equifaxUpdate: ReturnType<typeof interpretEvidence>["equifaxUpdate"] = undefined;
  let sustentoPagoUpdate: ReturnType<typeof interpretEvidence>["sustentoPagoUpdate"] = undefined;
  let experienceMatch = undefined;

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
  } else if (classification.tipoDetectado !== "DESCONOCIDO") {
    const interpretation = interpretEvidence(classification.tipoDetectado, text);
    resultados = interpretation.resultados;
    resumenIA = interpretation.resumenIA;
    equifaxUpdate = interpretation.equifaxUpdate;
    sustentoPagoUpdate = interpretation.sustentoPagoUpdate;
  }

  return NextResponse.json({
    fileName: file.name,
    size: file.size,
    ...classification,
    extracto: text.slice(0, 240),
    resultados,
    resumenIA,
    equifaxUpdate: equifaxUpdate ?? null,
    sustentoPagoUpdate: sustentoPagoUpdate ?? null,
    experienceMatch: experienceMatch ?? null,
  });
}
