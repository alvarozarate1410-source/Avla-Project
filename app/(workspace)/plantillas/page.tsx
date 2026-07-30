import { LayoutTemplate } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function PlantillasPage() {
  return (
    <>
      <Topbar>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">Plantillas</h1>
          <p className="text-xs text-[var(--muted)]">Checklists reutilizables por tipo de proyecto</p>
        </div>
      </Topbar>
      <ComingSoon
        icon={LayoutTemplate}
        title="Plantillas de checklist"
        description="Configura los documentos obligatorios por tipo de proyecto (obra pública, concesión, saneamiento) para acelerar la validación. En construcción."
      />
    </>
  );
}
