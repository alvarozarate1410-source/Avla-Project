import type { Expediente } from "@/lib/types";

export interface ClientePerfil {
  ruc: string;
  razonSocial: string;
  representantesLegales: string[];
  direccion: string;
  correo: string;
  actividadEconomica: string;
  ciiu?: string;
  patrimonioMasReciente: number;
  expedientes: Expediente[];
  alertasRecurrentes: string[];
}

/**
 * Groups all expedientes by RUC into a client profile: identity fields come
 * from the most recently updated expediente for that RUC (the freshest F1
 * extraction), while the expediente list and alertas are aggregated across
 * every expediente that client has ever had.
 */
export function buildClientePerfiles(expedientes: Expediente[]): ClientePerfil[] {
  const byRuc = new Map<string, Expediente[]>();
  for (const e of expedientes) {
    const ruc = e.informacionExtraida.ruc?.trim();
    if (!ruc) continue;
    if (!byRuc.has(ruc)) byRuc.set(ruc, []);
    byRuc.get(ruc)!.push(e);
  }

  const perfiles: ClientePerfil[] = [];
  for (const [ruc, exps] of byRuc) {
    const sorted = [...exps].sort((a, b) => (a.actualizadoEn < b.actualizadoEn ? 1 : -1));
    const info = sorted[0].informacionExtraida;

    const alertas = new Set<string>();
    for (const e of exps) {
      for (const r of e.riesgos) {
        if (r.nivel === "alto" || r.nivel === "critico") {
          alertas.add(`${r.titulo} (${e.nombreProyecto}): ${r.descripcion}`);
        }
      }
    }

    perfiles.push({
      ruc,
      razonSocial: info.razonSocial || "Sin razón social",
      representantesLegales: info.representantesLegales?.length
        ? info.representantesLegales
        : info.representanteLegal
          ? [info.representanteLegal]
          : [],
      direccion: info.direccion,
      correo: info.correo,
      actividadEconomica: info.actividadEconomica,
      ciiu: info.ciiu,
      patrimonioMasReciente: info.patrimonio,
      expedientes: sorted,
      alertasRecurrentes: Array.from(alertas),
    });
  }

  return perfiles.sort((a, b) => b.expedientes.length - a.expedientes.length);
}

export function findClientePerfil(expedientes: Expediente[], ruc: string): ClientePerfil | undefined {
  return buildClientePerfiles(expedientes).find((c) => c.ruc === ruc);
}
