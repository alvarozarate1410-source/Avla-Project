import { NextRequest, NextResponse } from "next/server";
import { extractText, type ExtractionResult } from "@/lib/parsers/extract-text";
import { classifyDocument } from "@/lib/services/document-classifier";
import { interpretEvidence } from "@/lib/services/evidence-interpreter";
import { analyzeSeaceWorkbook } from "@/lib/parsers/parse-seace-excel";
import { interpretF1, interpretBasesIntegradas, interpretReporteBuenaPro, extractNombreProyecto } from "@/lib/services/proyecto-interpreter";
import type { InformacionExtraida, RequerimientoInfo } from "@/lib/types";

// Without this, Vercel runs the route under its platform default duration,
// which is far shorter than a multi-page scanned document's OCR pass can
// legitimately take — the function gets killed mid-request with no clean
// response sent back, which is what an upload stuck in "Procesando" forever
// actually was. 120s comfortably covers the OCR pipeline's own internal
// budget (lib/parsers/ocr.ts's OCR_BUDGET_MS, 80s) plus cold-start and
// response overhead — raised from an initial 60s/45s pair after real single
// small documents (a 108KB PNG, an 831KB DNI PDF) still hit the timeout in
// production, which pointed at serverless cold-start cost (Tesseract's WASM
// worker + language model, PDFium's WASM init) as the dominant cost rather
// than per-page work; this sandbox's dev/prod servers stay warm across every
// test run, so that cost never showed up here. Requires a Vercel plan that
// allows a 120s function duration — if it doesn't, Vercel enforces its own
// plan limit regardless of this value.
export const maxDuration = 120;

// extractText() bounds its own OCR pass internally (lib/parsers/ocr.ts's
// OCR_BUDGET_MS), but that only covers the OCR path specifically — this is
// a last-resort backstop for any other way text extraction could stall
// (e.g. pdfjs's own parser spinning on a malformed or adversarial PDF), so
// this route always returns a clean, specific JSON error instead of
// silently running out the clock on maxDuration and getting killed with no
// response at all — which is what an upload stuck in "Procesando" forever
// actually was.
const REQUEST_BUDGET_MS = 100_000;

async function withRequestTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label}: tiempo de espera agotado (${Math.round(ms / 1000)}s)`)), ms)),
  ]);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let fileName: string;
  let buffer: Buffer;
  let context: string;

  if (contentType.includes("application/json")) {
    // Files over Vercel's ~4.5MB serverless request-body limit (real
    // scanned Peruvian official documents routinely exceed this) are
    // uploaded directly from the browser to Vercel Blob storage first (see
    // lib/services/classify-file.ts and /api/documents/upload-token),
    // bypassing this function's body limit entirely. This branch just
    // fetches the bytes from that blob URL instead of receiving them in
    // the request body.
    const body = await req.json().catch(() => null);
    if (!body || typeof body.blobUrl !== "string") {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const blobRes = await fetch(body.blobUrl).catch(() => null);
    if (!blobRes || !blobRes.ok) {
      return NextResponse.json({ error: "No se pudo descargar el archivo subido. Intenta de nuevo." }, { status: 502 });
    }
    buffer = Buffer.from(await blobRes.arrayBuffer());
    fileName = typeof body.fileName === "string" && body.fileName ? body.fileName : "archivo";
    context = typeof body.context === "string" ? body.context : "";
  } else {
    const formData = await req.formData().catch(() => null);
    const file = formData?.get("file");
    const rawContext = formData?.get("context");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    fileName = file.name;
    context = typeof rawContext === "string" ? rawContext : "";
  }

  const extraction: ExtractionResult = await withRequestTimeout(extractText(fileName, buffer), REQUEST_BUDGET_MS, "Procesamiento del documento").catch(
    (err: unknown): ExtractionResult => ({
      text: "",
      method: "unsupported",
      error: err instanceof Error ? err.message : String(err),
    })
  );
  const text = extraction.text;
  const classification = classifyDocument(fileName, text);

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
    experienceMatch = analyzeSeaceWorkbook(buffer, context) ?? undefined;
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
    fileName,
    size: buffer.length,
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
