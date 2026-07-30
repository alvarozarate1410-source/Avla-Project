"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "brand" | "success" | "warning" | "danger";
  index?: number;
}) {
  const toneMap: Record<string, string> = {
    brand: "bg-[var(--brand)]/12 text-[var(--brand)]",
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
    danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4", toneMap[tone])}>
            {icon}
          </div>
        </div>
        <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p>}
      </Card>
    </motion.div>
  );
}
