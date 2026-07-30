"use client";

import { Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadyScoreRing } from "@/components/dashboard/ready-score-ring";
import type { ExperienceMatch } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_COLORS = ["var(--success)", "var(--brand)", "var(--muted-2)", "var(--warning)"];

export function ExperienceMatchCard({ match }: { match: ExperienceMatch }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[var(--brand)]" />
          <CardTitle className="text-base">Experience Match</CardTitle>
          <Badge variant="brand">IA · SEACE</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <ReadyScoreRing value={match.projectFitScore} size={76} strokeWidth={7} />
            <div>
              <p className="text-xs text-[var(--muted)]">Project Fit Score</p>
              <p className="text-2xl font-bold tracking-tight">{match.projectFitScore}%</p>
              <p className="text-xs font-medium text-[var(--success)]">Alta compatibilidad</p>
            </div>
          </div>
          <p className="flex-1 text-[13px] leading-relaxed text-[var(--foreground)]/85">{match.explicacion}</p>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Distribución por categoría</span>
            <span className="text-[var(--muted)]">{match.contratosAnalizados} contratos analizados</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            {match.categorias.map((cat, i) => (
              <div
                key={cat.nombre}
                style={{ width: `${cat.pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
            {match.categorias.map((cat, i) => (
              <div key={cat.nombre} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                {cat.nombre} — {cat.cantidad} ({cat.pct}%)
              </div>
            ))}
          </div>
        </div>

        {match.riesgos.length > 0 && (
          <div className="mt-4 space-y-1.5 rounded-lg bg-[var(--warning-bg)] p-3.5">
            {match.riesgos.map((r, i) => (
              <p key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--foreground)]/90">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
                {r}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">Contratos representativos</p>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Entidad</th>
                  <th className="px-3 py-2 font-medium">Objeto</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Compatible</th>
                </tr>
              </thead>
              <tbody>
                {match.contratos.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border-soft)]">
                    <td className="px-3 py-2">{c.entidad}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[var(--muted)]">{c.objeto}</td>
                    <td className="px-3 py-2 tabular-nums">{formatCurrency(c.monto)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={c.compatible ? "success" : "outline"}>{c.compatible ? "Sí" : "No"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
