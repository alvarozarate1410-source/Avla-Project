import type { ChatMessage, Expediente } from "@/lib/types";
import { mockChatResponse } from "@/lib/ai/mock-chat";

export interface PortfolioContext {
  totalExpedientes: number;
  readyScorePromedio: number;
  porEstado: { label: string; count: number; pct: number }[];
  expedientesConRiesgoAlto: number;
}

function buildSystemPrompt(expediente: Expediente, portfolio: PortfolioContext | undefined) {
  const context = {
    proyecto: expediente.nombreProyecto,
    estado: expediente.estado,
    broker: expediente.broker,
    ejecutivo: expediente.ejecutivo,
    readyScore: expediente.readyScore,
    confianzaIA: expediente.confianzaIA,
    riesgos: expediente.riesgos,
    executiveBrief: expediente.executiveBrief,
    insights: expediente.insights,
    checklist: expediente.checklist,
    documentos: expediente.documentos.map((d) => ({
      nombre: d.nombre,
      tipo: d.tipoDetectado,
      estado: d.estado,
      confianzaDeteccion: d.confianzaDeteccion,
    })),
    evidencias: expediente.evidencias.map((e) => ({
      tipo: e.tipoDetectado,
      resultados: e.resultados,
      resumen: e.resumenIA,
    })),
    informacionExtraida: expediente.informacionExtraida,
    requerimiento: expediente.requerimiento,
    consorcioDetectado: expediente.consorcioDetectado,
    experienceMatch: expediente.experienceMatch,
    equifax: expediente.equifax,
    sustentosPago: expediente.sustentosPago,
  };

  return `Eres el Copiloto de AVLA Lens, un asistente de inteligencia comercial para Ejecutivos de Seguros de AVLA que evalúan expedientes de carta fianza.

Tu trabajo NO es solo reportar datos — es analizarlos como lo haría un analista de riesgo senior:
- Cuando te pregunten por riesgos, no los listes en el mismo orden en que aparecen: compáralos entre sí, identifica cuál es más urgente y explica por qué (¿cuál pondría en riesgo la emisión de la carta fianza? ¿cuál es fácil de resolver vs. cuál requiere una decisión del Ejecutivo?).
- Cuando te pregunten qué revisar o priorizar, da una secuencia concreta de pasos (primero esto, porque..., luego esto...), no una lista plana.
- Busca activamente inconsistencias entre fuentes de datos dentro del mismo contexto (por ejemplo: un monto que aparece distinto en Bases Integradas vs. Reporte de Buena Pro — revisa el campo "montoAdjudicadoFuente" del requerimiento, que indica si el monto fue cruzado entre ambas fuentes o viene de una sola; un patrimonio declarado bajo frente a un monto referencial alto; un score Equifax sólido pero con alertas de texto). Si encuentras algo así, dilo explícitamente.
- Cuando te pregunten cómo se compara este expediente con la cartera, usa el resumen de cartera que se te da abajo (si está disponible) — compara el Ready Score de este expediente contra el promedio, y su distribución de riesgo contra el resto.
- Da recomendaciones concretas y accionables, no solo el estado actual. Termina con una recomendación cuando la pregunta lo amerite.
- Sé conciso pero completo: prioriza sustancia sobre longitud. Usa viñetas cuando compares o enumeres varias cosas, pero no conviertas todo en una lista — cuando razonas o comparas, escribe en prosa.
- No inventes datos que no estén en el contexto. Si no tienes la información para responder algo con certeza, dilo explícitamente en vez de adivinar.

Contexto del expediente actual (JSON):
${JSON.stringify(context, null, 2)}
${
  portfolio
    ? `\nResumen de la cartera completa del Ejecutivo (para preguntas comparativas):\n${JSON.stringify(portfolio, null, 2)}`
    : ""
}`;
}

export async function generateChatReply(
  expediente: Expediente,
  message: string,
  history: ChatMessage[],
  portfolio?: PortfolioContext
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return mockChatResponse(expediente, message);
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 900,
      system: buildSystemPrompt(expediente, portfolio),
      messages: [
        ...history.slice(-8).map((m) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : mockChatResponse(expediente, message);
  } catch (err) {
    console.error("[avla-nexus] AI provider error, falling back to mock:", err);
    return mockChatResponse(expediente, message);
  }
}
