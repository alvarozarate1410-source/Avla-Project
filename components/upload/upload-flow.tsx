"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIPO_LABELS, CATEGORIA_LABELS } from "@/lib/document-labels";
import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";
import { formatBytes, cn } from "@/lib/utils";
import Link from "next/link";

type Stage = "en_cola" | "extrayendo" | "clasificando" | "completado" | "error";

interface QueueItem {
  id: string;
  file: File;
  stage: Stage;
  tipoDetectado?: TipoDocumentoDetectado;
  categoria?: CategoriaChecklist;
  confianza?: number;
  nombreSugerido?: string;
}

const EXT_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  zip: FileArchive,
};

const CONCURRENCY = 3;

async function expandZipEntries(file: File): Promise<File[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const files: File[] = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const name = path.split("/").pop();
    if (!name || name.startsWith(".")) continue;
    const blob = await entry.async("blob");
    files.push(new File([blob], name, { type: blob.type }));
  }
  return files;
}

export function UploadFlow() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (rawFiles: File[]) => {
    const expanded: File[] = [];
    for (const f of rawFiles) {
      if (f.name.toLowerCase().endsWith(".zip")) {
        try {
          expanded.push(...(await expandZipEntries(f)));
        } catch {
          expanded.push(f);
        }
      } else {
        expanded.push(f);
      }
    }

    setQueue((prev) => [
      ...prev,
      ...expanded.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        stage: "en_cola" as Stage,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => addFiles(accepted),
    noClick: false,
  });

  async function processQueue() {
    setRunning(true);
    const pending = queue.filter((q) => q.stage === "en_cola");
    let index = 0;

    async function worker() {
      while (index < pending.length) {
        const item = pending[index++];
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, stage: "extrayendo" } : q)));
        await new Promise((r) => setTimeout(r, 250));
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, stage: "clasificando" } : q)));

        try {
          const fd = new FormData();
          fd.append("file", item.file);
          const res = await fetch("/api/documents/classify", { method: "POST", body: fd });
          const data = await res.json();
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    stage: "completado",
                    tipoDetectado: data.tipoDetectado,
                    categoria: data.categoria,
                    confianza: data.confianza,
                    nombreSugerido: data.nombreSugerido,
                  }
                : q
            )
          );
        } catch {
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, stage: "error" } : q)));
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    setRunning(false);
  }

  const completados = queue.filter((q) => q.stage === "completado");
  const identificados = completados.filter((q) => q.tipoDetectado && q.tipoDetectado !== "DESCONOCIDO");
  const allDone = queue.length > 0 && queue.every((q) => q.stage === "completado" || q.stage === "error");

  const porCategoria: Record<CategoriaChecklist, QueueItem[]> = {
    cliente: [],
    proyecto: [],
    consorcio: [],
    validaciones: [],
  };
  for (const item of identificados) {
    if (item.categoria) porCategoria[item.categoria].push(item);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card
        {...getRootProps()}
        className={cn(
          "cursor-pointer border-2 border-dashed p-10 text-center transition-colors",
          isDragActive ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border)] hover:border-[var(--muted-2)]"
        )}
      >
        <input {...getInputProps()} />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error -- webkitdirectory is a non-standard but widely supported attribute
          webkitdirectory=""
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-[0_8px_24px_-8px_var(--brand)]">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">Arrastra la carpeta o los archivos del expediente aquí</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          PDF, Word, Excel, PNG, JPG, ZIP y subcarpetas — la IA se encarga del resto
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
            Seleccionar archivos
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              folderInputRef.current?.click();
            }}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Seleccionar carpeta
          </Button>
        </div>
      </Card>

      {queue.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Archivos ({queue.length})</CardTitle>
            {!running && !allDone && (
              <Button onClick={processQueue} size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Procesar con IA
              </Button>
            )}
            {running && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Procesando...
              </span>
            )}
          </CardHeader>
          <CardContent>
            <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {queue.map((item) => {
                  const ext = item.file.name.split(".").pop()?.toLowerCase() ?? "";
                  const Icon = EXT_ICON[ext] ?? FileText;
                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface-2)]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium">{item.file.name}</p>
                        <p className="text-[10.5px] text-[var(--muted)]">{formatBytes(item.file.size)}</p>
                      </div>
                      <StageBadge item={item} />
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </CardContent>
        </Card>
      )}

      {allDone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado de la clasificación</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(Object.keys(porCategoria) as CategoriaChecklist[]).map((cat) => (
                <div key={cat} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {CATEGORIA_LABELS[cat]} ({porCategoria[cat].length})
                  </p>
                  {porCategoria[cat].length === 0 ? (
                    <p className="text-[11px] text-[var(--muted-2)]">Sin documentos detectados</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {porCategoria[cat].map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                          <span className="truncate">{item.tipoDetectado && TIPO_LABELS[item.tipoDetectado]}</span>
                          <Badge variant="success" className="shrink-0">
                            {Math.round((item.confianza ?? 0) * 100)}%
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/8 p-5">
            <div>
              <p className="text-sm font-semibold">Triage completado</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {identificados.length} de {queue.length} documentos identificados automáticamente. El siguiente paso
                es subir las evidencias de validación externa (RUC, OSCE, Equifax, SEACE) para completar el análisis.
              </p>
            </div>
            <Button asChild>
              <Link href="/expedientes/exp-hospital-lima">
                Ver expediente de ejemplo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StageBadge({ item }: { item: QueueItem }) {
  switch (item.stage) {
    case "en_cola":
      return <span className="text-[11px] text-[var(--muted-2)]">En cola</span>;
    case "extrayendo":
      return (
        <span className="flex items-center gap-1 text-[11px] text-[var(--brand)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Extrayendo
        </span>
      );
    case "clasificando":
      return (
        <span className="flex items-center gap-1 text-[11px] text-[var(--brand)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Clasificando
        </span>
      );
    case "completado":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--success)]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {item.tipoDetectado && item.tipoDetectado !== "DESCONOCIDO" ? TIPO_LABELS[item.tipoDetectado] : "Sin identificar"}
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--danger)]">
          <AlertCircle className="h-3.5 w-3.5" /> Error
        </span>
      );
  }
}
