"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ConfianzaIA } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ConfianzaCard({
  confianza,
  actualizadoEn,
  documentosCount,
  tiempoAhorradoMin,
}: {
  confianza: ConfianzaIA;
  actualizadoEn: string;
  documentosCount: number;
  tiempoAhorradoMin: number;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full brand-gradient opacity-10 blur-2xl" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--muted)]">Nivel de Confianza IA</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{confianza.valor}%</p>
      <p className="mt-1 text-[13px] font-medium text-[var(--success)]">{confianza.mensaje}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border-soft)] pt-4 text-xs">
        <div>
          <p className="text-[var(--muted)]">Documentos procesados</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">{documentosCount}</p>
        </div>
        <div>
          <p className="text-[var(--muted)]">Tiempo ahorrado</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">{tiempoAhorradoMin} min</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
        <Sparkles className="h-3 w-3" />
        Actualizado {formatDateTime(actualizadoEn)} por AVLA Lens AI
      </div>
    </Card>
  );
}
