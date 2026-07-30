import { notFound } from "next/navigation";
import { getExpedienteById, expedientes } from "@/lib/mock-data";
import { ExpedienteDetailView } from "@/components/expediente/expediente-detail-view";

export function generateStaticParams() {
  return expedientes.map((e) => ({ id: e.id }));
}

export default async function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expediente = getExpedienteById(id);

  if (!expediente) notFound();

  return <ExpedienteDetailView expediente={expediente} />;
}
