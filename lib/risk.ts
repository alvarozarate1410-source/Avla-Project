import type { EstadoExpediente, EstadoItem, NivelRiesgo } from "@/lib/types";

export const nivelRiesgoConfig: Record<NivelRiesgo, { label: string; color: string; bg: string }> = {
  bajo: { label: "Bajo", color: "var(--success)", bg: "var(--success-bg)" },
  medio: { label: "Medio", color: "var(--warning)", bg: "var(--warning-bg)" },
  alto: { label: "Alto", color: "var(--danger)", bg: "var(--danger-bg)" },
  critico: { label: "Crítico", color: "var(--danger)", bg: "var(--danger-bg)" },
};

export const estadoItemConfig: Record<EstadoItem, { label: string; color: string; bg: string }> = {
  completo: { label: "Completo", color: "var(--success)", bg: "var(--success-bg)" },
  pendiente: { label: "Faltante", color: "var(--danger)", bg: "var(--danger-bg)" },
  advertencia: { label: "Advertencia", color: "var(--warning)", bg: "var(--warning-bg)" },
};

export const estadoExpedienteConfig: Record<EstadoExpediente, { label: string; variant: "brand" | "success" | "warning" | "danger" | "info" }> = {
  en_analisis: { label: "En análisis", variant: "brand" },
  listo: { label: "Listo", variant: "success" },
  observado: { label: "Observado", variant: "danger" },
  aprobado: { label: "Aprobado", variant: "success" },
  archivado: { label: "Archivado", variant: "info" },
};

export function scoreColor(value: number) {
  if (value >= 85) return "var(--success)";
  if (value >= 60) return "var(--warning)";
  return "var(--danger)";
}
