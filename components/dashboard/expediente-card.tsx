"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2, Clock, Users2 } from "lucide-react";
import type { Expediente } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { estadoExpedienteConfig } from "@/lib/risk";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReadyScoreRing } from "@/components/dashboard/ready-score-ring";

export function ExpedienteCard({ expediente, index = 0 }: { expediente: Expediente; index?: number }) {
  const estadoCfg = estadoExpedienteConfig[expediente.estado];
  const pendientesCount = expediente.checklist
    .flatMap((b) => b.items)
    .filter((i) => i.estado !== "completo").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
    >
      <Link href={`/expedientes/${expediente.id}`}>
        <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--muted-2)] hover:shadow-[var(--shadow-md)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={estadoCfg.variant}>{estadoCfg.label}</Badge>
                {pendientesCount > 0 && (
                  <span className="text-xs text-[var(--muted)]">{pendientesCount} pendientes</span>
                )}
              </div>
              <h3 className="truncate pr-2 text-[15px] font-semibold leading-tight tracking-tight">
                {expediente.nombreProyecto}
              </h3>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{expediente.broker}</span>
              </div>
            </div>
            <ReadyScoreRing value={expediente.readyScore.valor} size={52} strokeWidth={5} />
          </div>

          {expediente.executiveBrief.montoReferencial && (
            <p className="mt-4 text-lg font-semibold tracking-tight">
              {formatCurrency(expediente.executiveBrief.montoReferencial)}
              <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">
                {expediente.executiveBrief.entidad}
              </span>
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-3 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(expediente.actualizadoEn)}
            </div>
            {expediente.consorcioDetectado ? (
              <div className="flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5" />
                Consorcio ({expediente.consorcioDetectado.empresas})
              </div>
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
