"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  LayoutTemplate,
  Settings2,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expedientes", label: "Expedientes", icon: FolderKanban },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/plantillas", label: "Plantillas", icon: LayoutTemplate },
  { href: "/configuracion", label: "Configuración", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-xl transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-[0_4px_14px_-4px_var(--brand)]">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="truncate text-[15px] font-semibold tracking-tight">AVLA NEXUS</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label="Colapsar barra lateral"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-1 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          aria-label="Expandir barra lateral"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      )}

      <div className="px-3">
        <Button asChild className={cn("w-full gap-2", collapsed && "px-0")}>
          <Link href="/expedientes/nuevo">
            <Plus className="h-4 w-4" />
            {!collapsed && "Nuevo expediente"}
          </Link>
        </Button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full brand-gradient" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border)] p-3">
        {!collapsed && (
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Almacenamiento</span>
              <span className="font-medium">128 de 500 GB</span>
            </div>
            <Progress value={25.6} className="h-1.5" />
          </div>
        )}
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback>DF</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">Diego Fernández</p>
              <p className="truncate text-xs leading-tight text-[var(--muted)]">Practicante Comercial</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
