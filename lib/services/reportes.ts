import type { EstadoExpediente, Expediente } from "@/lib/types";
import { estadoExpedienteConfig } from "@/lib/risk";

export interface EstadoDistribucion {
  estado: EstadoExpediente;
  label: string;
  count: number;
  pct: number;
}

export interface BrokerRanking {
  broker: string;
  volumen: number;
  readyScorePromedio: number;
  riesgosAltos: number;
  montoTotal: number;
}

export interface ReadyScorePoint {
  id: string;
  fecha: string;
  expediente: string;
  valor: number;
}

export interface ReportesData {
  totalExpedientes: number;
  tiempoAhorradoTotal: number;
  readyScorePromedio: number;
  porEstado: EstadoDistribucion[];
  brokers: BrokerRanking[];
  evolucionReadyScore: ReadyScorePoint[];
}

export function computeReportes(expedientes: Expediente[]): ReportesData {
  const totalExpedientes = expedientes.length;
  const tiempoAhorradoTotal = expedientes.reduce((acc, e) => acc + e.tiempoAhorradoMin, 0);
  const readyScorePromedio = totalExpedientes
    ? Math.round(expedientes.reduce((acc, e) => acc + e.readyScore.valor, 0) / totalExpedientes)
    : 0;

  const estadoCounts = new Map<EstadoExpediente, number>();
  for (const e of expedientes) estadoCounts.set(e.estado, (estadoCounts.get(e.estado) ?? 0) + 1);
  const porEstado: EstadoDistribucion[] = Array.from(estadoCounts.entries())
    .map(([estado, count]) => ({
      estado,
      label: estadoExpedienteConfig[estado].label,
      count,
      pct: totalExpedientes ? Math.round((count / totalExpedientes) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const byBroker = new Map<string, Expediente[]>();
  for (const e of expedientes) {
    if (!byBroker.has(e.broker)) byBroker.set(e.broker, []);
    byBroker.get(e.broker)!.push(e);
  }
  const brokers: BrokerRanking[] = Array.from(byBroker.entries())
    .map(([broker, exps]) => ({
      broker,
      volumen: exps.length,
      readyScorePromedio: Math.round(exps.reduce((acc, e) => acc + e.readyScore.valor, 0) / exps.length),
      riesgosAltos: exps.filter((e) => e.riesgos.some((r) => r.nivel === "alto" || r.nivel === "critico")).length,
      montoTotal: exps.reduce((acc, e) => acc + (e.executiveBrief.montoReferencial ?? 0), 0),
    }))
    .sort((a, b) => b.volumen - a.volumen);

  const evolucionReadyScore: ReadyScorePoint[] = [...expedientes]
    .sort((a, b) => (a.creadoEn > b.creadoEn ? 1 : -1))
    .map((e) => ({ id: e.id, fecha: e.creadoEn, expediente: e.nombreProyecto, valor: e.readyScore.valor }));

  return { totalExpedientes, tiempoAhorradoTotal, readyScorePromedio, porEstado, brokers, evolucionReadyScore };
}
