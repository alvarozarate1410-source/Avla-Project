"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ExpedienteHeader } from "@/components/expediente/expediente-header";
import { ReadyScoreCard } from "@/components/expediente/ready-score-card";
import { ConfianzaCard } from "@/components/expediente/confianza-card";
import { RiskCard } from "@/components/expediente/risk-card";
import { ExecutiveBriefCard } from "@/components/expediente/executive-brief-card";
import { InsightsCard } from "@/components/expediente/insights-card";
import { ChecklistSection } from "@/components/expediente/checklist-section";
import { ExperienceMatchCard } from "@/components/expediente/experience-match-card";
import { EquifaxCard } from "@/components/expediente/equifax-card";
import { EvidenciasGrid } from "@/components/expediente/evidencias-grid";
import { InformacionExtraidaCard } from "@/components/expediente/informacion-extraida-card";
import { RequerimientoCard } from "@/components/expediente/requerimiento-card";
import { DocumentosListCard } from "@/components/expediente/documentos-list-card";
import { ChatPanel } from "@/components/expediente/chat-panel";
import { generateExpedienteReport } from "@/lib/services/report-generator";
import { useExpedientesStore } from "@/lib/store/expedientes-store";
import type { Expediente } from "@/lib/types";

export function ExpedienteDetailView({ expediente }: { expediente: Expediente }) {
  const [generating, setGenerating] = useState(false);

  // Reads live store state at call time (not the closed-over prop) so
  // concurrent uploads (multiple files processed in parallel) never clobber
  // each other's updates — the same "functional update" safety a React
  // setState updater gives you, applied to the zustand store instead.
  function handleExpedienteChange(updater: (prev: Expediente) => Expediente) {
    const store = useExpedientesStore.getState();
    const current = store.overrides[expediente.id] ?? expediente;
    store.upsert(updater(current));
  }

  async function handleGenerateReport() {
    if (generating) return;
    setGenerating(true);
    try {
      await generateExpedienteReport(expediente);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Topbar>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{expediente.nombreProyecto}</p>
          <p className="text-xs text-[var(--muted)]">Expediente #{expediente.id.split("-").pop()}</p>
        </div>
      </Topbar>

      <ExpedienteHeader expediente={expediente} onGenerateReport={handleGenerateReport} onExpedienteChange={handleExpedienteChange} />
      {generating && (
        <div className="animate-shimmer h-0.5 w-full bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent" />
      )}

      <main className="noise-veil flex-1 px-6 py-6">
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReadyScoreCard readyScore={expediente.readyScore} />
          <ConfianzaCard
            confianza={expediente.confianzaIA}
            actualizadoEn={expediente.actualizadoEn}
            documentosCount={expediente.documentos.length}
            tiempoAhorradoMin={expediente.tiempoAhorradoMin}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {expediente.riesgos.map((r, i) => (
            <RiskCard key={r.id} riesgo={r} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ExecutiveBriefCard brief={expediente.executiveBrief} />
            <InsightsCard insights={expediente.insights} />
            <ChecklistSection bloques={expediente.checklist} />
            {expediente.experienceMatch && <ExperienceMatchCard match={expediente.experienceMatch} />}
            {expediente.equifax && <EquifaxCard equifax={expediente.equifax} />}
            <EvidenciasGrid evidencias={expediente.evidencias} />
          </div>

          <div className="space-y-6">
            <InformacionExtraidaCard info={expediente.informacionExtraida} />
            {expediente.requerimiento && <RequerimientoCard requerimiento={expediente.requerimiento} />}
            <DocumentosListCard documentos={expediente.documentos} />
            <div className="sticky top-[88px]">
              <ChatPanel expediente={expediente} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
