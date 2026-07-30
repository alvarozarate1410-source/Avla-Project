"use client";

import { Bell, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Topbar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-xl sm:px-6">
      <MobileNav />
      <div className="flex min-w-0 flex-1 items-center gap-4">{children}</div>
      <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)] lg:flex">
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar expedientes, clientes...</span>
        <kbd className="ml-auto rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-2)]">
          ⌘K
        </kbd>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Ayuda">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
