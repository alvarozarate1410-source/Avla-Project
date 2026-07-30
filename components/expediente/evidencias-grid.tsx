"use client";

import { motion } from "framer-motion";
import {
  FileSearch,
  ShieldAlert,
  Landmark,
  Briefcase,
  ShieldCheck,
  Receipt,
  FileQuestion,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Evidencia, TipoDocumentoDetectado } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const TIPO_ICON: Partial<Record<TipoDocumentoDetectado, typeof FileSearch>> = {
  CONSULTA_RUC: FileSearch,
  CONSULTA_DEUDA_COACTIVA: ShieldAlert,
  CONSULTA_PROVEEDORES_ESTADO: Landmark,
  EXPERIENCIA_SEACE: Briefcase,
  REPORTE_EQUIFAX: ShieldCheck,
  SUSTENTO_PAGO: Receipt,
};

const TONE_COLOR = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--muted)",
} as const;

export function EvidenciasGrid({ evidencias }: { evidencias: Evidencia[] }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Evidencias del Expediente</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {evidencias.map((ev, i) => {
            const Icon = TIPO_ICON[ev.tipoDetectado] ?? FileQuestion;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 transition-colors hover:border-[var(--muted-2)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/12 text-[var(--brand)]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{ev.tituloVisible}</p>
                    <p className="truncate text-[11px] text-[var(--muted)]">{formatDate(ev.subidoEn)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {ev.resultados.map((r) => (
                    <div key={r.etiqueta} className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--muted)]">{r.etiqueta}</span>
                      <span className="font-semibold" style={{ color: TONE_COLOR[r.tono] }}>
                        {r.valor}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 border-t border-[var(--border-soft)] pt-2 text-[11px] leading-relaxed text-[var(--muted)]">
                  {ev.resumenIA}
                </p>
              </motion.div>
            );
          })}
        </div>
        {evidencias.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--muted-2)]">
            Aún no se han subido evidencias de validación externa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
