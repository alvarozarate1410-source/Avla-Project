"use client";

import { Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ExecutiveBrief } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ExecutiveBriefCard({ brief }: { brief: ExecutiveBrief }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
          <Badge variant="brand" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Generado por IA
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {brief.parrafos.map((p, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed text-[var(--foreground)]/90">
              {p}
            </p>
          ))}
        </div>

        {(brief.montoReferencial || brief.entidad) && (
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-[var(--surface-2)] p-4">
            {brief.montoReferencial && (
              <div>
                <p className="text-[11px] text-[var(--muted)]">Monto Referencial</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">{formatCurrency(brief.montoReferencial)}</p>
              </div>
            )}
            {brief.entidad && (
              <div>
                <p className="text-[11px] text-[var(--muted)]">Entidad</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">{brief.entidad}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">Estado documental</span>
            <span className="font-semibold text-[var(--success)]">{brief.estadoDocumentalPct}% completo</span>
          </div>
          <Progress value={brief.estadoDocumentalPct} />
        </div>

        {brief.pendientes.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--danger)]">
              <AlertCircle className="h-3.5 w-3.5" />
              Documentos faltantes
            </p>
            <ul className="space-y-1">
              {brief.pendientes.map((p, i) => (
                <li key={i} className="text-xs text-[var(--muted)]">
                  • {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-[var(--brand)]/25 bg-[var(--brand)]/8 p-3.5">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--foreground)]/90">
            <span className="font-semibold">Recomendación: </span>
            {brief.recomendacion}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
