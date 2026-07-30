import { ExpedienteDetailBoundary } from "@/components/expediente/expediente-detail-boundary";

export default async function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExpedienteDetailBoundary id={id} />;
}
