"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "¿Qué documentos faltan?",
  "¿Qué riesgos detectaste?",
  "¿Hay deuda coactiva?",
  "¿Cuál es el representante?",
];

export function ChatPanel({ expedienteId, initialMessages }: { expedienteId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expedienteId, message: trimmed, history: nextMessages }),
      });
      const data = await res.json();
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.ok ? data.reply : "No pude procesar tu pregunta. Intenta nuevamente.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hubo un problema de conexión. Intenta nuevamente.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md brand-gradient text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-base">Asistente IA</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Nuevo chat"
          onClick={() => setMessages(initialMessages.slice(0, 1))}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}
            >
              {m.role === "assistant" && (
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[9px]">AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "brand-gradient text-white"
                    : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)]"
                )}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[9px]">AI</AvatarFallback>
              </Avatar>
              <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-2)]"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-[var(--border)] p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--brand)]/40 hover:text-[var(--foreground)] disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Escribe tu pregunta..."
            className="min-h-[40px] resize-none py-2.5"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
