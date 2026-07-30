import { Topbar } from "@/components/layout/topbar";
import { ConfiguracionContent } from "@/components/configuracion/configuracion-content";

export default function ConfiguracionPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Configuración</h1>
          <p className="text-xs text-[var(--muted)]">Cuenta, equipo e integraciones</p>
        </div>
      </Topbar>
      <ConfiguracionContent />
    </>
  );
}
