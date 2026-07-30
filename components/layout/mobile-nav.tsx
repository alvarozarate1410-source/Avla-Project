"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
        <Menu className="h-4.5 w-4.5" />
      </Button>
      <DialogContent className="left-0 top-0 flex h-full max-w-[280px] translate-x-0 translate-y-0 flex-col rounded-none border-r border-l-0 border-t-0 border-b-0 p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
        <DialogTitle className="sr-only">Menú de navegación</DialogTitle>
        <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">AVLA NEXUS</span>
        </div>
        <div className="p-3">
          <Button asChild className="w-full gap-2" onClick={() => setOpen(false)}>
            <Link href="/expedientes/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo expediente
            </Link>
          </Button>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
