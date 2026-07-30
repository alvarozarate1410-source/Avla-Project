import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { ExpedienteCard } from "@/components/dashboard/expediente-card";
import { expedientes } from "@/lib/mock-data";

export default function ExpedientesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Expedientes</h1>
          <p className="text-xs text-[var(--muted)]">{expedientes.length} expedientes en el workspace</p>
        </div>
      </Topbar>

      <main className="flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">Todos los expedientes comerciales, ordenados por última actualización.</p>
          <Button asChild>
            <Link href="/expedientes/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo expediente
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expedientes.map((exp, i) => (
            <ExpedienteCard key={exp.id} expediente={exp} index={i} />
          ))}
        </div>
      </main>
    </>
  );
}
