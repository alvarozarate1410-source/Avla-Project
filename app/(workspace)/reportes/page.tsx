import { BarChart3 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ReportesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Reportes</h1>
          <p className="text-xs text-[var(--muted)]">Analítica del área comercial</p>
        </div>
      </Topbar>
      <ComingSoon
        icon={BarChart3}
        title="Analítica comercial"
        description="Tiempo ahorrado por Ejecutivo, distribución de riesgos por broker y tendencias de Ready Score. En construcción."
      />
    </>
  );
}
