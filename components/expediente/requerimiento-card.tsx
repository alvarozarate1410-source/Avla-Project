"use client";

import { MapPin, Wallet, User, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RequerimientoInfo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function RequerimientoCard({ requerimiento }: { requerimiento: RequerimientoInfo }) {
  const rows = [
    { icon: MapPin, label: "Lugar de ejecución", value: requerimiento.lugarEjecucion },
    {
      icon: Wallet,
      label: "Monto adjudicado",
      value: requerimiento.montoAdjudicado !== undefined ? formatCurrency(requerimiento.montoAdjudicado) : undefined,
    },
    { icon: User, label: "Beneficiario", value: requerimiento.beneficiario },
    {
      icon: CalendarClock,
      label: "Plazo",
      value: requerimiento.plazoValor !== undefined ? `${requerimiento.plazoValor} ${requerimiento.plazoUnidad}` : undefined,
    },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-base">Requerimiento</CardTitle>
        {requerimiento.montoAdjudicadoFuente && (
          <Badge variant="brand">Fuente: {requerimiento.montoAdjudicadoFuente}</Badge>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3.5 pt-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2.5">
            <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            <div className="min-w-0">
              <p className="text-[10.5px] text-[var(--muted)]">{row.label}</p>
              <p className="truncate text-[13px] font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
