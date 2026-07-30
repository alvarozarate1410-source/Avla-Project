"use client";

import Link from "next/link";
import { Building2, Hash, Briefcase, FolderKanban, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAllExpedientes } from "@/lib/store/expedientes-store";
import { buildClientePerfiles } from "@/lib/services/clientes";

export function ClientesListContent() {
  const expedientes = useAllExpedientes();
  const perfiles = buildClientePerfiles(expedientes);

  return (
    <main className="noise-veil flex-1 px-6 py-8">
      <p className="mb-6 text-sm text-[var(--muted)]">
        Directorio consolidado por RUC — la identidad de cada cliente se construye a partir del F1 más reciente que
        subiste para esa empresa.
      </p>

      {perfiles.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-[var(--muted-2)]" />
          <p className="text-sm text-[var(--muted)]">
            Aún no hay clientes identificados. Sube un F1 en un expediente para que aparezca aquí.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {perfiles.map((c) => (
            <Link key={c.ruc} href={`/clientes/${c.ruc}`}>
              <Card className="h-full cursor-pointer p-5 transition-colors hover:border-[var(--muted-2)]">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/12 text-[var(--brand)]">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <p className="truncate text-sm font-semibold">{c.razonSocial}</p>
                </div>
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Hash className="h-3.5 w-3.5" />
                  {c.ruc}
                </div>
                {c.actividadEconomica && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {c.actividadEconomica}
                      {c.ciiu ? ` (CIIU ${c.ciiu})` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--border-soft)] pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {c.expedientes.length} expediente(s)
                  </span>
                  {c.alertasRecurrentes.length > 0 && (
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {c.alertasRecurrentes.length}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
