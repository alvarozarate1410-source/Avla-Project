"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileSearch } from "lucide-react";
import { expedientes } from "@/lib/mock-data";
import { estadoExpedienteConfig } from "@/lib/risk";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = normalize(query.trim());
  const results =
    q.length > 0
      ? expedientes
          .filter((e) =>
            [e.nombreProyecto, e.broker, e.informacionExtraida.razonSocial, e.informacionExtraida.ruc, e.ejecutivo]
              .some((field) => normalize(field).includes(q))
          )
          .slice(0, 6)
      : [];

  return (
    <div ref={containerRef} className="relative hidden max-w-xs flex-1 lg:block">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-[var(--surface-2)] px-3 py-2 text-sm transition-colors",
          open ? "border-[var(--brand)]" : "border-[var(--border)]"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              router.push(`/expedientes/${results[0].id}`);
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Buscar expedientes, clientes..."
          className="w-full min-w-0 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
        />
        {!query && (
          <kbd className="ml-auto shrink-0 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-2)]">
            ⌘K
          </kbd>
        )}
      </div>

      {open && q.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-[var(--muted)]">Sin resultados para &ldquo;{query}&rdquo;</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((exp) => {
                const cfg = estadoExpedienteConfig[exp.estado];
                return (
                  <li key={exp.id}>
                    <Link
                      href={`/expedientes/${exp.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <FileSearch className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{exp.nombreProyecto}</p>
                        <p className="truncate text-[11px] text-[var(--muted)]">
                          {exp.broker} · {exp.informacionExtraida.razonSocial}
                        </p>
                      </div>
                      <Badge variant={cfg.variant} className="shrink-0">
                        {cfg.label}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
