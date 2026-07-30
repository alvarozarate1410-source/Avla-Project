import { Topbar } from "@/components/layout/topbar";
import { TemplatesContent } from "@/components/templates/templates-content";

export default function PlantillasPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Plantillas</h1>
          <p className="text-xs text-[var(--muted)]">Checklists reutilizables por tipo de expediente</p>
        </div>
      </Topbar>
      <TemplatesContent />
    </>
  );
}
