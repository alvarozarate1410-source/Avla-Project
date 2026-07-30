import { Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ClientesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Clientes</h1>
          <p className="text-xs text-[var(--muted)]">Directorio de clientes y consorcios</p>
        </div>
      </Topbar>
      <ComingSoon
        icon={Users}
        title="Directorio de clientes"
        description="Aquí verás el historial consolidado por RUC: expedientes previos, alertas recurrentes y experiencia acumulada. En construcción."
      />
    </>
  );
}
