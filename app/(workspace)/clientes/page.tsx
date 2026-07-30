import { Topbar } from "@/components/layout/topbar";
import { ClientesListContent } from "@/components/clientes/clientes-list-content";

export default function ClientesPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Clientes</h1>
          <p className="text-xs text-[var(--muted)]">Directorio de clientes por RUC</p>
        </div>
      </Topbar>
      <ClientesListContent />
    </>
  );
}
