"use client";

import { CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChecklistBloque, EstadoItem } from "@/lib/types";
import { estadoItemConfig } from "@/lib/risk";
import { cn } from "@/lib/utils";

const ICONS: Record<EstadoItem, typeof CheckCircle2> = {
  completo: CheckCircle2,
  pendiente: XCircle,
  advertencia: AlertTriangle,
};

export function ChecklistSection({ bloques }: { bloques: ChecklistBloque[] }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Checklist del Expediente</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bloques.map((bloque) => {
            const completos = bloque.items.filter((i) => i.estado === "completo").length;
            return (
              <div key={bloque.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {bloque.titulo}
                  </p>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                    {completos}/{bloque.items.length}
                  </span>
                </div>
                {bloque.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-[11px] text-[var(--muted-2)]">
                    <FileText className="h-5 w-5" />
                    No aplica para este expediente
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {bloque.items.map((item) => {
                      const cfg = estadoItemConfig[item.estado];
                      const Icon = ICONS[item.estado];
                      return (
                        <li key={item.id} className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-[12.5px] leading-snug",
                                item.estado === "pendiente" ? "text-[var(--foreground)]" : "text-[var(--foreground)]/85"
                              )}
                            >
                              {item.label}
                            </p>
                            {item.notas && (
                              <p className="text-[10.5px] text-[var(--warning)]">{item.notas}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border-soft)] pt-3 text-[11px] text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" /> Completo
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-[var(--danger)]" /> Faltante
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" /> Advertencia
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
