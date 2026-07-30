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
import { DocumentosListCard } from "@/components/expediente/documentos-list-card";
import { ChatPanel } from "@/components/expediente/chat-panel";
import { generateExpedienteReport } from "@/lib/services/report-generator";
import type { Expediente } from "@/lib/types";

export function ExpedienteDetailView({ expediente }: { expediente: Expediente }) {
  const [generating, setGenerating] = useState(false);

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

      <ExpedienteHeader expediente={expediente} onGenerateReport={handleGenerateReport} />
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
            <DocumentosListCard documentos={expediente.documentos} />
            <div className="sticky top-[88px]">
              <ChatPanel expedienteId={expediente.id} initialMessages={expediente.chat} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
