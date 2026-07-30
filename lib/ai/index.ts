import type { ChatMessage, Expediente } from "@/lib/types";
import { mockChatResponse } from "@/lib/ai/mock-chat";

function buildSystemPrompt(expediente: Expediente) {
  return `Eres el Copiloto de AVLA Lens, un asistente de inteligencia comercial para Ejecutivos de Seguros de AVLA. Respondes preguntas sobre un expediente de evaluación de riesgo con base ÚNICAMENTE en el siguiente contexto estructurado (JSON). Sé conciso, profesional y directo. Usa viñetas cuando enumeres varios elementos. No inventes datos que no estén en el contexto.

Contexto del expediente:
${JSON.stringify(
  {
    proyecto: expediente.nombreProyecto,
    estado: expediente.estado,
    readyScore: expediente.readyScore,
    confianzaIA: expediente.confianzaIA,
    riesgos: expediente.riesgos,
    executiveBrief: expediente.executiveBrief,
    insights: expediente.insights,
    checklist: expediente.checklist,
    informacionExtraida: expediente.informacionExtraida,
    experienceMatch: expediente.experienceMatch,
    equifax: expediente.equifax,
  },
  null,
  2
)}`;
}

export async function generateChatReply(
  expediente: Expediente,
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return mockChatResponse(expediente, message);
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: buildSystemPrompt(expediente),
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
