"use client";

import { FileWarning, Landmark, Scale, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { nivelRiesgoConfig } from "@/lib/risk";
import type { RiesgoFactor } from "@/lib/types";

const ICONS = {
  documental: FileWarning,
  financiero: Landmark,
  legal: Scale,
  operativo: Wrench,
} as const;

export function RiskCard({ riesgo, index = 0 }: { riesgo: RiesgoFactor; index?: number }) {
  const cfg = nivelRiesgoConfig[riesgo.nivel];
  const Icon = ICONS[riesgo.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
    >
      <Card className="group h-full p-5 transition-colors hover:border-[var(--muted-2)]">
        <div className="flex items-start justify-between">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <h4 className="mt-3 text-sm font-semibold tracking-tight">{riesgo.titulo}</h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{riesgo.descripcion}</p>
        <ul className="mt-3 space-y-1.5 border-t border-[var(--border-soft)] pt-3">
          {riesgo.detalle.map((d, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: cfg.color }} />
              {d}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
