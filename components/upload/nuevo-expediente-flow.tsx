"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  FileStack,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TIPO_LABELS, CATEGORIA_LABELS } from "@/lib/document-labels";
import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";
import type { ProcessedUpload } from "@/lib/services/expediente-mutations";
import { synthesizeExpediente } from "@/lib/services/expediente-synthesizer";
import { useExpedientesStore } from "@/lib/store/expedientes-store";
import { useTemplatesStore } from "@/lib/store/templates-store";
import { useUser } from "@/components/layout/user-context";
import { formatBytes, cn } from "@/lib/utils";

type Stage = "en_cola" | "procesando" | "completado" | "error";

interface QueueItem extends Partial<ProcessedUpload> {
  id: string;
  file: File;
  stage: Stage;
  nombreProyectoSugerido?: string;
}

const EXT_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  zip: FileArchive,
};

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

export function NuevoExpedienteFlow() {
  const router = useRouter();
  const user = useUser();
  const templates = useTemplatesStore((s) => s.templates);
  const upsertExpediente = useExpedientesStore((s) => s.upsert);

  const [step, setStep] = useState<"template" | "upload" | "review">("template");
  const [templateId, setTemplateId] = useState(templates[0]?.id);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [broker, setBroker] = useState("");
  const [ejecutivo, setEjecutivo] = useState(user.rol === "Ejecutivo Comercial" ? user.nombre : "");
  const folderInputRef = useRef<HTMLInputElement>(null);

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: (accepted) => addFiles(accepted) });

  async function processQueue() {
    setRunning(true);
    // Sequential (not parallel) so each file's project-name/actividad guess
    // can enrich the SEACE keyword-matching context for files processed
    // after it — the classify route's "context" field only helps if we
    // already know something about the project by the time we reach it.
    let context = "";
    const pending = queue.filter((q) => q.stage === "en_cola");

    for (const item of pending) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, stage: "procesando" } : q)));
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("context", context);
        const res = await fetch("/api/documents/classify", { method: "POST", body: fd });
        const data = await res.json();

        if (data.f1Data?.razonSocial) context += ` ${data.f1Data.razonSocial}`;
        if (data.f1Data?.actividadEconomica) context += ` ${data.f1Data.actividadEconomica}`;
        if (data.nombreProyectoSugerido) context += ` ${data.nombreProyectoSugerido}`;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  stage: "completado",
                  fileName: data.fileName,
                  size: data.size,
                  tipoDetectado: data.tipoDetectado,
                  categoria: data.categoria,
                  confianza: data.confianza,
                  nombreSugerido: data.nombreSugerido,
                  resultados: data.resultados ?? [],
                  resumenIA: data.resumenIA ?? "",
                  equifaxUpdate: data.equifaxUpdate ?? undefined,
                  sustentoPagoUpdate: data.sustentoPagoUpdate ?? undefined,
                  experienceMatchUpdate: data.experienceMatch ?? undefined,
                  f1Update: data.f1Data ?? undefined,
                  requerimientoUpdate: data.requerimientoData ?? undefined,
                  buenaProUpdate: data.buenaProData ?? undefined,
                  nombreProyectoSugerido: data.nombreProyectoSugerido ?? undefined,
                }
              : q
          )
        );
      } catch {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, stage: "error" } : q)));
      }
    }

    setRunning(false);
  }

  const allDone = queue.length > 0 && queue.every((q) => q.stage === "completado" || q.stage === "error");

  const suggestedName = useMemo(() => queue.find((q) => q.nombreProyectoSugerido)?.nombreProyectoSugerido, [queue]);
  const suggestedRazonSocial = useMemo(() => queue.find((q) => q.f1Update?.razonSocial)?.f1Update?.razonSocial, [queue]);

  function goToReview() {
    if (!nombreProyecto && (suggestedName || suggestedRazonSocial)) {
      setNombreProyecto(suggestedName ?? `Expediente ${suggestedRazonSocial}`);
    }
    setStep("review");
  }

  function handleCreate() {
    if (!nombreProyecto.trim() || !template) return;
    const uploads: ProcessedUpload[] = queue
      .filter((q) => q.stage === "completado" && q.tipoDetectado)
      .map((q) => ({
        fileName: q.fileName!,
        size: q.size!,
        tipoDetectado: q.tipoDetectado!,
        categoria: q.categoria!,
        confianza: q.confianza!,
        nombreSugerido: q.nombreSugerido,
        resultados: q.resultados ?? [],
        resumenIA: q.resumenIA ?? "",
        experienceMatchUpdate: q.experienceMatchUpdate,
        equifaxUpdate: q.equifaxUpdate,
        sustentoPagoUpdate: q.sustentoPagoUpdate,
        f1Update: q.f1Update,
        requerimientoUpdate: q.requerimientoUpdate,
        buenaProUpdate: q.buenaProUpdate,
      }));

    const expediente = synthesizeExpediente({
      template,
      nombreProyecto: nombreProyecto.trim(),
      broker: broker.trim() || "Sin especificar",
      ejecutivo: ejecutivo.trim() || user.nombre,
      uploads,
    });

    upsertExpediente(expediente);
    router.push(`/expedientes/${expediente.id}`);
  }

  const porCategoria: Record<CategoriaChecklist, QueueItem[]> = { cliente: [], proyecto: [], consorcio: [], validaciones: [] };
  for (const item of queue) {
    if (item.stage === "completado" && item.categoria && item.tipoDetectado !== "DESCONOCIDO") porCategoria[item.categoria].push(item);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Steps step={step} />

      {step === "template" && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Elige el tipo de carta fianza — el checklist correcto se aplicará automáticamente. Puedes ajustarlo después en
            Plantillas.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {templates.map((t) => (
              <Card
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "cursor-pointer p-5 transition-colors",
                  templateId === t.id ? "border-[var(--brand)]" : "hover:border-[var(--muted-2)]"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/12 text-[var(--brand)]">
                    <FileStack className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{t.nombre}</p>
                </div>
                <p className="text-xs leading-relaxed text-[var(--muted)]">{t.descripcion}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep("upload")} disabled={!templateId}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="mt-6">
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

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep("template")}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={goToReview} disabled={!allDone}>
              Revisar y crear expediente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del expediente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-medium text-[var(--muted)]">Nombre del proyecto</label>
                <Input value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)} placeholder="Ej. Hospital de Lima – Proyecto de Construcción" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--muted)]">Broker</label>
                <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="Ej. Seguros Globales" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-[var(--muted)]">Ejecutivo asignado</label>
                <Input value={ejecutivo} onChange={(e) => setEjecutivo(e.target.value)} placeholder="Nombre del Ejecutivo" />
              </div>
            </CardContent>
          </Card>

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
                          <span className="truncate">{item.tipoDetectado && TIPO_LABELS[item.tipoDetectado as TipoDocumentoDetectado]}</span>
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

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep("upload")}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={handleCreate} disabled={!nombreProyecto.trim()} size="lg">
              Crear expediente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Steps({ step }: { step: "template" | "upload" | "review" }) {
  const items: { id: typeof step; label: string }[] = [
    { id: "template", label: "1. Tipo de expediente" },
    { id: "upload", label: "2. Subir documentos" },
    { id: "review", label: "3. Revisar y crear" },
  ];
  const activeIdx = items.findIndex((i) => i.id === step);

  return (
    <div className="flex items-center gap-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              i === activeIdx
                ? "brand-gradient text-white"
                : i < activeIdx
                  ? "bg-[var(--success-bg)] text-[var(--success)]"
                  : "bg-[var(--surface-2)] text-[var(--muted)]"
            )}
          >
            {item.label}
          </span>
          {i < items.length - 1 && <span className="h-px w-6 bg-[var(--border)]" />}
        </div>
      ))}
    </div>
  );
}

function StageBadge({ item }: { item: QueueItem }) {
  switch (item.stage) {
    case "en_cola":
      return <span className="text-[11px] text-[var(--muted-2)]">En cola</span>;
    case "procesando":
      return (
        <span className="flex items-center gap-1 text-[11px] text-[var(--brand)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Procesando
        </span>
      );
    case "completado":
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--success)]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {item.tipoDetectado && item.tipoDetectado !== "DESCONOCIDO" ? TIPO_LABELS[item.tipoDetectado as TipoDocumentoDetectado] : "Sin identificar"}
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
