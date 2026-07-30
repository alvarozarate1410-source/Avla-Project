import { Topbar } from "@/components/layout/topbar";
import { ClienteDetailContent } from "@/components/clientes/cliente-detail-content";

export default async function ClienteDetailPage({ params }: { params: Promise<{ ruc: string }> }) {
  const { ruc } = await params;
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Perfil de cliente</h1>
          <p className="text-xs text-[var(--muted)]">RUC {ruc}</p>
        </div>
      </Topbar>
      <ClienteDetailContent ruc={ruc} />
    </>
  );
}
