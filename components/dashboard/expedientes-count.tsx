"use client";

import { useAllExpedientes } from "@/lib/store/expedientes-store";

export function ExpedientesCount() {
  const expedientes = useAllExpedientes();
  return <p className="text-xs text-[var(--muted)]">{expedientes.length} expedientes en el workspace</p>;
}
