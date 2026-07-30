import { NextRequest, NextResponse } from "next/server";
import { getExpedienteById } from "@/lib/mock-data";
import { generateChatReply } from "@/lib/ai";
import type { ChatMessage, Expediente } from "@/lib/types";

function isExpediente(value: unknown): value is Expediente {
  return !!value && typeof value === "object" && typeof (value as Expediente).id === "string" && Array.isArray((value as Expediente).checklist);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.expedienteId !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  // Prefer the client's live (possibly mutated with newly-added evidence)
  // expediente snapshot over the static mock lookup, since there's no
  // backend persistence yet — the client is the source of truth for a
  // session's edits.
  const expediente = isExpediente(body.expediente) && body.expediente.id === body.expedienteId
    ? body.expediente
    : getExpedienteById(body.expedienteId);

  if (!expediente) {
    return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
  }

  const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const reply = await generateChatReply(expediente, body.message, history);

  return NextResponse.json({ reply });
}
