import { Topbar } from "@/components/layout/topbar";
import { ExpedientesListContent } from "@/components/dashboard/expedientes-list-content";
import { ExpedientesCount } from "@/components/dashboard/expedientes-count";

export default function ExpedientesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Expedientes</h1>
          <ExpedientesCount />
        </div>
      </Topbar>
      <ExpedientesListContent />
    </>
  );
}
