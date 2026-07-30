"use client";

import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EquifaxSummary } from "@/lib/types";

export function EquifaxCard({ equifax }: { equifax: EquifaxSummary }) {
  const pct = Math.round((equifax.score / 900) * 100);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
          <CardTitle className="text-base">Equifax</CardTitle>
        </div>
        <Badge variant={pct >= 70 ? "success" : pct >= 45 ? "warning" : "danger"}>{equifax.clasificacion}</Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Score crediticio</span>
              <span className="font-semibold tabular-nums">{equifax.score} / 900</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full brand-gradient transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {equifax.alertas.length > 0 ? (
          <div className="mt-4 space-y-1.5">
            {equifax.alertas.map((a, i) => (
              <p key={i} className="flex items-start gap-2 text-[12px] text-[var(--danger)]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {a}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[var(--success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sin alertas críticas
          </p>
        )}

        <ul className="mt-3 space-y-1.5 border-t border-[var(--border-soft)] pt-3">
          {equifax.conclusiones.map((c, i) => (
            <li key={i} className="text-[12px] leading-relaxed text-[var(--muted)]">
              • {c}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
