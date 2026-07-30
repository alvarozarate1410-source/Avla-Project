"use client";

import { Building2, Hash, User, MapPin, Mail, Briefcase, Wallet, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InformacionExtraida } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function InformacionExtraidaCard({ info }: { info: InformacionExtraida }) {
  const rows = [
    { icon: Building2, label: "Razón Social", value: info.razonSocial },
    { icon: Hash, label: "RUC", value: info.ruc },
    { icon: User, label: "Representante Legal", value: info.representanteLegal },
    { icon: MapPin, label: "Dirección", value: info.direccion },
    { icon: Mail, label: "Correo", value: info.correo },
    { icon: Briefcase, label: "Actividad Económica", value: info.actividadEconomica },
    { icon: Wallet, label: "Patrimonio", value: formatCurrency(info.patrimonio) },
    ...(info.participacionConsorcio
      ? [{ icon: Users2, label: "Participación Consorcio", value: `${info.participacionConsorcio}%` }]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Información extraída</CardTitle>
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
