"use client";

import { Clock3, Gauge, FolderKanban, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { useAllExpedientes } from "@/lib/store/expedientes-store";
import { computeReportes } from "@/lib/services/reportes";
import { scoreColor } from "@/lib/risk";
import { formatCurrency, formatDate } from "@/lib/utils";

const ESTADO_COLOR: Record<string, string> = {
  en_analisis: "var(--brand)",
  listo: "var(--success)",
  observado: "var(--danger)",
  aprobado: "var(--success)",
  archivado: "var(--muted)",
};

export function ReportesContent() {
  const expedientes = useAllExpedientes();
  const data = computeReportes(expedientes);

  if (data.totalExpedientes === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-[var(--muted)]">Aún no hay expedientes para analizar.</p>
      </main>
    );
  }

  return (
    <main className="noise-veil flex-1 px-6 py-8">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile index={0} label="Expedientes totales" value={String(data.totalExpedientes)} icon={<FolderKanban />} tone="brand" />
        <StatTile index={1} label="Ready Score promedio" value={`${data.readyScorePromedio}%`} icon={<Gauge />} tone="success" />
        <StatTile index={2} label="Tiempo ahorrado acumulado" value={`${data.tiempoAhorradoTotal} min`} icon={<Clock3 />} tone="brand" />
        <StatTile index={3} label="Brokers activos" value={String(data.brokers.length)} icon={<TrendingUp />} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolución del Ready Score</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolucionReadyScore} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="fecha" tickFormatter={(v) => formatDate(v)} stroke="var(--muted)" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="var(--muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value, _name, item) => [`${value}%`, item?.payload?.expediente ?? ""]}
                  labelFormatter={(v) => (typeof v === "string" ? formatDate(v) : "")}
                />
                <Line type="monotone" dataKey="valor" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {data.porEstado.map((e) => (
              <div key={e.estado}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">{e.label}</span>
                  <span className="font-medium">
                    {e.count} · {e.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: ESTADO_COLOR[e.estado] }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Ranking de brokers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 pr-4 font-medium">Broker</th>
                  <th className="py-2 pr-4 font-medium">Volumen</th>
                  <th className="py-2 pr-4 font-medium">Ready Score prom.</th>
                  <th className="py-2 pr-4 font-medium">Riesgos altos</th>
                  <th className="py-2 pr-4 font-medium">Monto referencial total</th>
                </tr>
              </thead>
              <tbody>
                {data.brokers.map((b) => (
                  <tr key={b.broker} className="border-b border-[var(--border-soft)]">
                    <td className="py-2.5 pr-4 font-medium">{b.broker}</td>
                    <td className="py-2.5 pr-4">{b.volumen}</td>
                    <td className="py-2.5 pr-4">
                      <span style={{ color: scoreColor(b.readyScorePromedio) }} className="font-medium">
                        {b.readyScorePromedio}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={b.riesgosAltos > 0 ? "font-medium text-[var(--danger)]" : "text-[var(--muted)]"}>
                        {b.riesgosAltos}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(b.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
