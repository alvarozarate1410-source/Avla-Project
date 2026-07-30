import type { AppNotification, Expediente } from "@/lib/types";

type NotificationInput = Omit<AppNotification, "id" | "createdAt" | "leido">;

function factorValor(expediente: Expediente, id: string): number | undefined {
  return expediente.readyScore.factores.find((f) => f.id === id)?.valor;
}

function hasDeudaCoactiva(expediente: Expediente): boolean {
  return expediente.evidencias.some((e) => e.tipoDetectado === "CONSULTA_DEUDA_COACTIVA" && e.resultados.some((r) => r.tono === "danger"));
}

function hasSancionOSCE(expediente: Expediente): boolean {
  return expediente.evidencias.some((e) => e.tipoDetectado === "CONSULTA_PROVEEDORES_ESTADO" && e.resultados.some((r) => r.tono === "danger"));
}

/**
 * Compares an expediente before/after one evidence upload and returns any
 * notifications the change should raise. `before` is the state the user was
 * looking at right before this upload; `after` is the result of folding the
 * upload in via applyUploadedEvidence. Each notification carries a
 * dedupeKey so the store can silently drop repeats (e.g. re-uploading the
 * same Equifax report twice shouldn't notify twice).
 */
export function detectUploadNotifications(before: Expediente, after: Expediente): NotificationInput[] {
  const notifications: NotificationInput[] = [];
  const base = { expedienteId: after.id, expedienteNombre: after.nombreProyecto };

  if (before.readyScore.valor < 85 && after.readyScore.valor >= 85) {
    notifications.push({
      ...base,
      tipo: "ready_score_alto",
      titulo: "Ready Score alto",
      mensaje: `${after.nombreProyecto} alcanzó ${after.readyScore.valor}% de Ready Score — listo para evaluación.`,
      dedupeKey: `${after.id}:ready_score_alto:${after.readyScore.valor}`,
    });
  }

  if (!hasDeudaCoactiva(before) && hasDeudaCoactiva(after)) {
    notifications.push({
      ...base,
      tipo: "riesgo_detectado",
      titulo: "Riesgo detectado: deuda coactiva",
      mensaje: `Se identificó deuda coactiva en la consulta SUNAT de ${after.nombreProyecto}.`,
      dedupeKey: `${after.id}:riesgo:deuda_coactiva`,
    });
  }

  if (!hasSancionOSCE(before) && hasSancionOSCE(after)) {
    notifications.push({
      ...base,
      tipo: "riesgo_detectado",
      titulo: "Riesgo detectado: sanción OSCE",
      mensaje: `Se identificó una sanción o inhabilitación registrada en OSCE para ${after.nombreProyecto}.`,
      dedupeKey: `${after.id}:riesgo:sancion_osce`,
    });
  }

  const beforeAlertas = before.equifax?.alertas.length ?? 0;
  const afterAlertas = after.equifax?.alertas.length ?? 0;
  if (afterAlertas > beforeAlertas) {
    notifications.push({
      ...base,
      tipo: "riesgo_detectado",
      titulo: "Alerta Equifax",
      mensaje: `El reporte Equifax de ${after.nombreProyecto} registra ${after.equifax!.alertas[0]}.`,
      dedupeKey: `${after.id}:riesgo:equifax:${afterAlertas}`,
    });
  }

  if (factorValor(before, "documentacion") !== 100 && factorValor(after, "documentacion") === 100) {
    notifications.push({
      ...base,
      tipo: "checklist_completo",
      titulo: "Checklist completo",
      mensaje: `El checklist documental de ${after.nombreProyecto} quedó 100% completo.`,
      dedupeKey: `${after.id}:checklist_completo`,
    });
  }

  if (!before.experienceMatch && after.experienceMatch) {
    notifications.push({
      ...base,
      tipo: "experience_match_listo",
      titulo: "Experience Match calculado",
      mensaje: `Se calculó el Project Fit Score de ${after.nombreProyecto}: ${after.experienceMatch.projectFitScore}%.`,
      dedupeKey: `${after.id}:experience_match`,
    });
  }

  return notifications;
}

const STALE_THRESHOLD_DAYS = 5;

/**
 * Flags expedientes sitting in "en_analisis" without an update in a while.
 * Meant to be run periodically (e.g. once per app load) against the full
 * expediente list — dedupeKey includes the day bucket so it re-notifies
 * every few days rather than exactly once forever, without spamming on
 * every page load in between.
 */
export function detectStaleNotifications(expedientes: Expediente[], now = new Date()): NotificationInput[] {
  const notifications: NotificationInput[] = [];

  for (const expediente of expedientes) {
    if (expediente.estado !== "en_analisis") continue;
    const updated = new Date(expediente.actualizadoEn);
    const daysInactive = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInactive < STALE_THRESHOLD_DAYS) continue;

    const bucket = Math.floor(daysInactive / STALE_THRESHOLD_DAYS);
    notifications.push({
      expedienteId: expediente.id,
      expedienteNombre: expediente.nombreProyecto,
      tipo: "expediente_inactivo",
      titulo: "Expediente sin actividad",
      mensaje: `${expediente.nombreProyecto} lleva ${daysInactive} día(s) en "En análisis" sin actividad.`,
      dedupeKey: `${expediente.id}:inactivo:${bucket}`,
    });
  }

  return notifications;
}
