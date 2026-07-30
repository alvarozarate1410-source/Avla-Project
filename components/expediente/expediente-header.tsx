"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Share2, MoreVertical, FileDown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddEvidenceDialog } from "@/components/expediente/add-evidence-dialog";
import type { Expediente } from "@/lib/types";
import { estadoExpedienteConfig } from "@/lib/risk";
import { formatDate } from "@/lib/utils";

function EditableTitle({
  nombreProyecto,
  onSave,
}: {
  nombreProyecto: string;
  onSave: (nombre: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nombreProyecto);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraft(nombreProyecto);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== nombreProyecto) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          aria-label="Nombre del expediente"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-9 text-xl font-semibold tracking-tight sm:text-2xl"
        />
        <Button variant="ghost" size="icon" aria-label="Guardar nombre" onClick={commit}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Cancelar" onClick={() => setEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="group/title flex min-w-0 items-center gap-2 text-left"
      aria-label="Editar nombre del expediente"
    >
      <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{nombreProyecto}</h1>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-[var(--muted-2)] opacity-0 transition-opacity group-hover/title:opacity-100" />
    </button>
  );
}

export function ExpedienteHeader({
  expediente,
  onGenerateReport,
  onExpedienteChange,
}: {
  expediente: Expediente;
  onGenerateReport: () => void;
  onExpedienteChange: (updater: (prev: Expediente) => Expediente) => void;
}) {
  const estadoCfg = estadoExpedienteConfig[expediente.estado];

  return (
    <div className="border-b border-[var(--border)] px-6 py-5">
      <Link
        href="/expedientes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a expedientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <EditableTitle
              nombreProyecto={expediente.nombreProyecto}
              onSave={(nombre) => onExpedienteChange((prev) => ({ ...prev, nombreProyecto: nombre }))}
            />
            <Badge variant={estadoCfg.variant}>{estadoCfg.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
            <span>Creado el {formatDate(expediente.creadoEn)}</span>
            <span className="opacity-40">•</span>
            <span>Broker: {expediente.broker}</span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1.5">
              Ejecutivo:
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px]">
                  {expediente.ejecutivo
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {expediente.ejecutivo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AddEvidenceDialog expediente={expediente} onExpedienteChange={onExpedienteChange} />
          <Button variant="secondary" onClick={onGenerateReport}>
            <Download className="h-4 w-4" />
            Descargar reporte
          </Button>
          <Button>
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más opciones">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onGenerateReport}>
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicar expediente</DropdownMenuItem>
              <DropdownMenuItem>Archivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
