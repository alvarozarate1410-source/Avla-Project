"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, TrendingUp, AlertTriangle, ClipboardCheck, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotificationsStore } from "@/lib/store/notifications-store";
import { useAllExpedientes } from "@/lib/store/expedientes-store";
import { detectStaleNotifications } from "@/lib/services/notification-triggers";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { NotificationTipo } from "@/lib/types";

const ICON_BY_TIPO: Record<NotificationTipo, typeof TrendingUp> = {
  ready_score_alto: TrendingUp,
  riesgo_detectado: AlertTriangle,
  checklist_completo: ClipboardCheck,
  expediente_inactivo: Clock,
  experience_match_listo: Sparkles,
};

export function NotificationsBell() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const pushNotification = useNotificationsStore((s) => s.push);
  const expedientes = useAllExpedientes();

  // Stale-expediente check runs once per app load against the current
  // expediente list — cheap, and detectStaleNotifications's dedupeKey
  // already prevents re-notifying the same expediente every reload.
  useEffect(() => {
    for (const notification of detectStaleNotifications(expedientes)) pushNotification(notification);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.leido).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--brand)] text-[8px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3.5 py-2.5">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo leído
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-3.5 py-8 text-center text-xs text-[var(--muted)]">Sin notificaciones por ahora.</p>
        ) : (
          <ul className="max-h-[380px] overflow-y-auto">
            {notifications.map((n) => {
              const Icon = ICON_BY_TIPO[n.tipo];
              return (
                <li key={n.id}>
                  <Link
                    href={`/expedientes/${n.expedienteId}`}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex gap-2.5 border-b border-[var(--border-soft)] px-3.5 py-3 transition-colors hover:bg-[var(--surface-2)]",
                      !n.leido && "bg-[var(--brand)]/[0.04]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        n.tipo === "riesgo_detectado" ? "bg-[var(--danger-bg)] text-[var(--danger)]" : "bg-[var(--brand)]/12 text-[var(--brand)]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12.5px] font-medium">{n.titulo}</p>
                        {!n.leido && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />}
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted)]">{n.mensaje}</p>
                      <p className="mt-1 text-[10px] text-[var(--muted-2)]">{formatDate(n.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
