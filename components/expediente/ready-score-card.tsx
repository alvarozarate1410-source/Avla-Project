"use client";

import { Card } from "@/components/ui/card";
import { ReadyScoreRing } from "@/components/dashboard/ready-score-ring";
import { scoreColor } from "@/lib/risk";
import type { ReadyScore } from "@/lib/types";

export function ReadyScoreCard({ readyScore }: { readyScore: ReadyScore }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Expediente Ready Score</p>
          <p className="mt-1 text-[13px] font-medium" style={{ color: scoreColor(readyScore.valor) }}>
            {readyScore.etiqueta.toUpperCase()}
          </p>
        </div>
        <ReadyScoreRing value={readyScore.valor} size={64} strokeWidth={6} />
      </div>

      <div className="mt-4 space-y-2.5">
        {readyScore.factores.map((f) => (
          <div key={f.id}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted)]">{f.label}</span>
              <span className="font-medium tabular-nums">{f.valor}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${f.valor}%`, background: scoreColor(f.valor) }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
