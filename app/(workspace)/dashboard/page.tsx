import { Topbar } from "@/components/layout/topbar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Dashboard</h1>
          <p className="text-xs text-[var(--muted)]">Vista general de expedientes comerciales</p>
        </div>
      </Topbar>
      <DashboardContent />
    </>
  );
}
