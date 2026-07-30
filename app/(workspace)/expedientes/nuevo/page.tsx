import { Topbar } from "@/components/layout/topbar";
import { NuevoExpedienteFlow } from "@/components/upload/nuevo-expediente-flow";

export default function NuevoExpedientePage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Nuevo expediente</h1>
          <p className="text-xs text-[var(--muted)]">Sube la carpeta del broker y deja que la IA la ordene</p>
        </div>
      </Topbar>
      <main className="noise-veil flex-1 px-6 py-10">
        <NuevoExpedienteFlow />
      </main>
    </>
  );
}
