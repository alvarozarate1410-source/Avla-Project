import { Settings2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ConfiguracionPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Configuración</h1>
          <p className="text-xs text-[var(--muted)]">Cuenta, equipo e integraciones</p>
        </div>
      </Topbar>
      <ComingSoon
        icon={Settings2}
        title="Configuración del workspace"
        description="Gestiona usuarios, permisos por rol e integraciones (SUNAT, OSCE, Equifax). En construcción."
      />
    </>
  );
}
