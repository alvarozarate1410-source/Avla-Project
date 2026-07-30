"use client";

import { useState } from "react";
import { Plus, Trash2, RotateCcw, FileStack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTemplatesStore, TIPO_OPTIONS } from "@/lib/store/templates-store";
import { TIPO_LABELS, CATEGORIA_LABELS } from "@/lib/document-labels";
import type { CategoriaChecklist, TipoDocumentoDetectado } from "@/lib/types";

export function TemplatesContent() {
  const templates = useTemplatesStore((s) => s.templates);
  const addItem = useTemplatesStore((s) => s.addItem);
  const removeItem = useTemplatesStore((s) => s.removeItem);
  const toggleObligatorio = useTemplatesStore((s) => s.toggleObligatorio);
  const resetToDefaults = useTemplatesStore((s) => s.resetToDefaults);
  const [activeId, setActiveId] = useState(templates[0]?.id);

  const active = templates.find((t) => t.id === activeId) ?? templates[0];

  return (
    <main className="noise-veil flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm text-[var(--muted)]">
            Cada tipo de carta fianza tiene un checklist distinto. Configúralo aquí una vez y se aplicará automáticamente
            al crear un expediente nuevo de ese tipo — la IA marcará cada documento como completo apenas lo reconozca en
            la carpeta subida.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={resetToDefaults}>
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar valores por defecto
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {templates.map((t) => {
          const total = t.bloques.flatMap((b) => b.items).length;
          const obligatorios = t.bloques.flatMap((b) => b.items).filter((i) => i.obligatorio).length;
          return (
            <Card
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`cursor-pointer p-5 transition-colors ${active?.id === t.id ? "border-[var(--brand)]" : "hover:border-[var(--muted-2)]"}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/12 text-[var(--brand)]">
                  <FileStack className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{t.nombre}</p>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-[var(--muted)]">{t.descripcion}</p>
              <p className="text-[11px] text-[var(--muted)]">
                {total} documentos · {obligatorios} obligatorios
              </p>
            </Card>
          );
        })}
      </div>

      {active && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist: {active.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={active.bloques[0]?.id}>
              <TabsList>
                {active.bloques.map((b) => (
                  <TabsTrigger key={b.id} value={b.id}>
                    {b.titulo} ({b.items.length})
                  </TabsTrigger>
                ))}
              </TabsList>
              {active.bloques.map((b) => (
                <TabsContent key={b.id} value={b.id}>
                  <BlockEditor
                    templateId={active.id}
                    categoria={b.id}
                    items={b.items}
                    onAdd={addItem}
                    onRemove={removeItem}
                    onToggle={toggleObligatorio}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function BlockEditor({
  templateId,
  categoria,
  items,
  onAdd,
  onRemove,
  onToggle,
}: {
  templateId: string;
  categoria: CategoriaChecklist;
  items: { id: string; label: string; tipoDetectado?: TipoDocumentoDetectado; obligatorio: boolean }[];
  onAdd: (templateId: string, categoria: CategoriaChecklist, item: { label: string; tipoDetectado?: TipoDocumentoDetectado; obligatorio: boolean }) => void;
  onRemove: (templateId: string, categoria: CategoriaChecklist, itemId: string) => void;
  onToggle: (templateId: string, categoria: CategoriaChecklist, itemId: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [tipo, setTipo] = useState<TipoDocumentoDetectado | "">("");

  function handleAdd() {
    if (!label.trim()) return;
    onAdd(templateId, categoria, { label: label.trim(), tipoDetectado: tipo || undefined, obligatorio: true });
    setLabel("");
    setTipo("");
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--muted-2)]">Sin documentos en este bloque para {CATEGORIA_LABELS[categoria]}.</p>
      ) : (
        <ul className="mb-4 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{item.label}</p>
                {item.tipoDetectado && (
                  <p className="text-[10.5px] text-[var(--muted)]">Detecta: {TIPO_LABELS[item.tipoDetectado]}</p>
                )}
              </div>
              <button onClick={() => onToggle(templateId, categoria, item.id)}>
                <Badge variant={item.obligatorio ? "danger" : "outline"} className="cursor-pointer">
                  {item.obligatorio ? "Obligatorio" : "Opcional"}
                </Badge>
              </button>
              <Button variant="ghost" size="icon" onClick={() => onRemove(templateId, categoria, item.id)} aria-label="Eliminar">
                <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-3">
        <Input
          placeholder="Nombre del documento"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDocumentoDetectado | "")}
          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)]"
        >
          <option value="">Tipo a detectar (opcional)</option>
          {TIPO_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TIPO_LABELS[t]}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleAdd} disabled={!label.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
