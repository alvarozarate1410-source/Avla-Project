import Link from "next/link";
import { FolderCheck, Clock3, ShieldAlert, FolderKanban, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { ExpedienteCard } from "@/components/dashboard/expediente-card";
import { expedientes } from "@/lib/mock-data";

export default function DashboardPage() {
  const activos = expedientes.filter((e) => e.estado !== "archivado" && e.estado !== "aprobado");
  const listos = expedientes.filter((e) => e.readyScore.valor >= 85);
  const tiempoTotal = expedientes.reduce((acc, e) => acc + e.tiempoAhorradoMin, 0);
  const criticos = expedientes.filter((e) => e.riesgos.some((r) => r.nivel === "alto" || r.nivel === "critico"));

  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Dashboard</h1>
          <p className="text-xs text-[var(--muted)]">Vista general de expedientes comerciales</p>
        </div>
      </Topbar>

      <main className="noise-veil flex-1 px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Hola, Diego 👋</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Tienes {activos.length} expedientes activos. {criticos.length > 0 ? `${criticos.length} requieren atención.` : "Todo bajo control."}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/expedientes/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo expediente
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile index={0} label="Expedientes activos" value={String(activos.length)} hint="En análisis o con observaciones" icon={<FolderKanban />} tone="brand" />
          <StatTile index={1} label="Listos para evaluación" value={String(listos.length)} hint="Ready Score ≥ 85%" icon={<FolderCheck />} tone="success" />
          <StatTile index={2} label="Tiempo ahorrado" value={`${tiempoTotal} min`} hint="vs. proceso manual, este mes" icon={<Clock3 />} tone="brand" />
          <StatTile index={3} label="Riesgos altos" value={String(criticos.length)} hint="Requieren revisión del Ejecutivo" icon={<ShieldAlert />} tone="danger" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Expedientes recientes</h3>
          <Link href="/expedientes" className="text-xs font-medium text-[var(--brand)] hover:underline">
            Ver todos
          </Link>
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
