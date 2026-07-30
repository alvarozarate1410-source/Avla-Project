"use client";

import Link from "next/link";
import { Building2, Calendar, Users2, UserSquare2 } from "lucide-react";
import type { Expediente } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { estadoExpedienteConfig } from "@/lib/risk";
import { formatDate } from "@/lib/utils";

/**
 * Chronological history of every project this client has been part of,
 * across brokers and time — this is what makes a repeat-client pattern
 * visible even when the same RUC shows up months later under a different
 * broker.
 */
export function ClienteTimeline({ expedientes }: { expedientes: Expediente[] }) {
  const sorted = [...expedientes].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));

  return (
    <ol className="relative space-y-5 border-l border-[var(--border)] pl-6">
      {sorted.map((exp) => {
        const estadoCfg = estadoExpedienteConfig[exp.estado];
        const consorcio = exp.consorcioDetectado;

        return (
          <li key={exp.id} className="relative">
            <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--brand)]" />
            <Link href={`/expedientes/${exp.id}`} className="group block">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[14px] font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  {exp.nombreProyecto}
                </h4>
                <Badge variant={estadoCfg.variant}>{estadoCfg.label}</Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(exp.creadoEn)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {exp.broker}
                </span>
                <span className="flex items-center gap-1.5">
                  {consorcio ? (
                    <>
                      <Users2 className="h-3.5 w-3.5" />
                      Consorcio de {consorcio.empresas}: {consorcio.nombres.join(", ")}
                    </>
                  ) : (
                    <>
                      <UserSquare2 className="h-3.5 w-3.5" />
                      Postor individual
                    </>
                  )}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
