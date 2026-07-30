import { Topbar } from "@/components/layout/topbar";
import { ReportesContent } from "@/components/reportes/reportes-content";

export default function ReportesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Reportes</h1>
          <p className="text-xs text-[var(--muted)]">Analítica de cartera</p>
        </div>
      </Topbar>
      <ReportesContent />
    </>
  );
}
