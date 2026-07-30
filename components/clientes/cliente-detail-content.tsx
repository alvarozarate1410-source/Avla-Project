"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Hash, User, MapPin, Mail, Briefcase, Wallet, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClienteTimeline } from "@/components/clientes/cliente-timeline";
import { useAllExpedientes } from "@/lib/store/expedientes-store";
import { buildClientePerfiles } from "@/lib/services/clientes";
import { formatCurrency } from "@/lib/utils";

export function ClienteDetailContent({ ruc }: { ruc: string }) {
  const expedientes = useAllExpedientes();
  const cliente = buildClientePerfiles(expedientes).find((c) => c.ruc === ruc);

  if (!cliente) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <Building2 className="mb-3 h-8 w-8 text-[var(--muted-2)]" />
        <p className="text-sm text-[var(--muted)]">No se encontró un cliente con RUC {ruc}.</p>
        <Link href="/clientes" className="mt-3 text-xs font-medium text-[var(--brand)] hover:underline">
          Volver a Clientes
        </Link>
      </main>
    );
  }

  const rows = [
    { icon: Hash, label: "RUC", value: cliente.ruc },
    {
      icon: User,
      label: cliente.representantesLegales.length > 1 ? "Representantes Legales" : "Representante Legal",
      value: cliente.representantesLegales.join(", ") || "No identificado",
    },
    { icon: MapPin, label: "Dirección Fiscal", value: cliente.direccion || "No identificada" },
    { icon: Mail, label: "Correo", value: cliente.correo || "No identificado" },
    {
      icon: Briefcase,
      label: "Actividad Económica",
      value: cliente.actividadEconomica ? `${cliente.actividadEconomica}${cliente.ciiu ? ` (CIIU ${cliente.ciiu})` : ""}` : "No identificada",
    },
    { icon: Wallet, label: "Patrimonio (último declarado)", value: formatCurrency(cliente.patrimonioMasReciente) },
  ];

  return (
    <main className="noise-veil flex-1 px-6 py-6">
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a Clientes
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/12 text-[var(--brand)]">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{cliente.razonSocial}</h1>
          <p className="text-sm text-[var(--muted)]">
            RUC {cliente.ruc} · {cliente.expedientes.length} expediente(s) en el historial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Perfil del cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-4">
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

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-0">
              {cliente.alertasRecurrentes.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
              )}
              <CardTitle className="text-base">Alertas recurrentes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {cliente.alertasRecurrentes.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">Sin riesgos altos o críticos registrados en su historial.</p>
              ) : (
                <ul className="space-y-2">
                  {cliente.alertasRecurrentes.map((a, i) => (
                    <li key={i} className="rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-[12px] leading-relaxed text-[var(--foreground)]/90">
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Historial de proyectos</h3>
          <Card className="p-6">
            <ClienteTimeline expedientes={cliente.expedientes} />
          </Card>
        </div>
      </div>
    </main>
  );
}
