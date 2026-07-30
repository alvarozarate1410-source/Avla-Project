"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileImage, File as FileIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Documento } from "@/lib/types";
import { estadoItemConfig } from "@/lib/risk";
import { formatBytes } from "@/lib/utils";

const EXT_ICON: Record<Documento["extension"], typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  zip: FileIcon,
};

const EXT_COLOR: Record<Documento["extension"], string> = {
  pdf: "var(--danger)",
  docx: "var(--info)",
  xlsx: "var(--success)",
  png: "var(--brand)",
  jpg: "var(--brand)",
  zip: "var(--muted)",
};

export function DocumentosListCard({ documentos }: { documentos: Documento[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? documentos : documentos.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-base">Documentos ({documentos.length})</CardTitle>
        {documentos.length > 5 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Ver menos" : "Ver todos"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-1">
          {visible.map((doc) => {
            const Icon = EXT_ICON[doc.extension];
            const cfg = estadoItemConfig[doc.estado];
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-2)]"
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: EXT_COLOR[doc.extension] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{doc.nombre}</p>
                  <p className="text-[10.5px] text-[var(--muted)]">
                    {doc.extension.toUpperCase()} · {formatBytes(doc.tamanioBytes)}
                  </p>
                </div>
                {doc.estado !== "completo" && (
                  <Badge
                    className="shrink-0"
                    style={{ background: cfg.bg, color: cfg.color, borderColor: "transparent" }}
                  >
                    {cfg.label}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
        {documentos.length === 0 && (
          <p className="py-6 text-center text-xs text-[var(--muted-2)]">Sin documentos cargados.</p>
        )}
        {!expanded && documentos.length > 5 && (
          <p className="mt-2 px-2 text-[11px] text-[var(--muted)]">
            + {documentos.length - 5} documentos más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
