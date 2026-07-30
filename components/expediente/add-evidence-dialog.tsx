"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, FileSpreadsheet, FileImage, Loader2, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TIPO_LABELS } from "@/lib/document-labels";
import type { Expediente, TipoDocumentoDetectado } from "@/lib/types";
import { formatBytes, cn } from "@/lib/utils";
import { applyUploadedEvidence } from "@/lib/services/expediente-mutations";
import { detectUploadNotifications } from "@/lib/services/notification-triggers";
import { useNotificationsStore } from "@/lib/store/notifications-store";

type Stage = "analizando" | "completado" | "error";

interface QueueItem {
  id: string;
  file: File;
  stage: Stage;
  tipoDetectado?: TipoDocumentoDetectado;
  resumenIA?: string;
}

const EXT_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
};

export function AddEvidenceDialog({
  expediente,
  onExpedienteChange,
}: {
  expediente: Expediente;
  onExpedienteChange: (updater: (prev: Expediente) => Expediente) => void;
}) {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const pushNotification = useNotificationsStore((s) => s.push);

  const processFile = useCallback(
    async (file: File) => {
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
      setQueue((prev) => [...prev, { id, file, stage: "analizando" }]);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("context", `${expediente.nombreProyecto} ${expediente.informacionExtraida.actividadEconomica}`);

      try {
        const res = await fetch("/api/documents/classify", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al procesar el archivo");

        setQueue((prev) =>
          prev.map((q) => (q.id === id ? { ...q, stage: "completado", tipoDetectado: data.tipoDetectado, resumenIA: data.resumenIA } : q))
        );

        onExpedienteChange((prev) => {
          const next = applyUploadedEvidence(prev, {
            fileName: data.fileName,
            size: data.size,
            tipoDetectado: data.tipoDetectado,
            categoria: data.categoria,
            confianza: data.confianza,
            nombreSugerido: data.nombreSugerido,
            resultados: data.resultados ?? [],
            resumenIA: data.resumenIA ?? "",
            experienceMatchUpdate: data.experienceMatch ?? undefined,
            equifaxUpdate: data.equifaxUpdate ?? undefined,
            sustentoPagoUpdate: data.sustentoPagoUpdate ?? undefined,
            f1Update: data.f1Data ?? undefined,
            requerimientoUpdate: data.requerimientoData ?? undefined,
            buenaProUpdate: data.buenaProData ?? undefined,
          });
          for (const notification of detectUploadNotifications(prev, next)) pushNotification(notification);
          return next;
        });
      } catch {
        setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, stage: "error" } : q)));
      }
    },
    [expediente.nombreProyecto, expediente.informacionExtraida.actividadEconomica, onExpedienteChange, pushNotification]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach(processFile);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQueue([]);
      }}
    >
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4" />
        Agregar evidencia
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar evidencia al expediente</DialogTitle>
          <DialogDescription>
            Sube capturas, PDF o Excel de tus consultas manuales (RUC, deuda coactiva, OSCE, SEACE, Equifax, sustentos de
            pago). La IA reconoce el tipo de documento sola.
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragActive ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border)] hover:border-[var(--muted-2)]"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
          <p className="text-sm font-medium">Arrastra o haz clic para subir evidencia</p>
          <p className="mt-1 text-xs text-[var(--muted)]">PDF, Excel, PNG, JPG</p>
        </div>

        {queue.length > 0 && (
          <ul className="max-h-64 space-y-1.5 overflow-y-auto">
            <AnimatePresence initial={false}>
              {queue.map((item) => {
                const ext = item.file.name.split(".").pop()?.toLowerCase() ?? "";
                const Icon = EXT_ICON[ext] ?? FileText;
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium">{item.file.name}</p>
                        <p className="text-[10.5px] text-[var(--muted)]">{formatBytes(item.file.size)}</p>
                      </div>
                      <StageBadge item={item} />
                    </div>
                    {item.stage === "completado" && item.resumenIA && (
                      <p className="mt-2 border-t border-[var(--border-soft)] pt-2 text-[11px] leading-relaxed text-[var(--muted)]">
                        {item.resumenIA}
                      </p>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StageBadge({ item }: { item: QueueItem }) {
  switch (item.stage) {
    case "analizando":
      return (
        <span className="flex items-center gap-1 text-[11px] text-[var(--brand)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Analizando
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
