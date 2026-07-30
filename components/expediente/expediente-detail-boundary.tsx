"use client";

import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useExpedienteById } from "@/lib/store/expedientes-store";
import { ExpedienteDetailView } from "@/components/expediente/expediente-detail-view";

export function ExpedienteDetailBoundary({ id }: { id: string }) {
  const { expediente, hasHydrated } = useExpedienteById(id);

  if (!expediente) {
    if (!hasHydrated) {
      return (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
        </div>
      );
    }
    notFound();
  }

  return <ExpedienteDetailView expediente={expediente} />;
}
