"use client";

import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightIA } from "@/lib/types";

const ICONS = {
  success: { Icon: CheckCircle2, color: "var(--success)" },
  warning: { Icon: AlertTriangle, color: "var(--warning)" },
  danger: { Icon: XCircle, color: "var(--danger)" },
  neutral: { Icon: Info, color: "var(--info)" },
};

export function InsightsCard({ insights }: { insights: InsightIA[] }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Insights IA</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {insights.map((insight) => {
            const { Icon, color } = ICONS[insight.tono];
            return (
              <li
                key={insight.id}
                className="flex items-start gap-2.5 rounded-lg bg-[var(--surface-2)] p-3 text-[13px] leading-snug"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                <span>{insight.texto}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
