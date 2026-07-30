import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CategoriaChecklist, ExpedienteTemplate, TemplateChecklistItem, TipoDocumentoDetectado } from "@/lib/types";
import { DEFAULT_TEMPLATES } from "@/lib/mock-data/default-templates";

interface TemplatesState {
  templates: ExpedienteTemplate[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addItem: (templateId: string, categoria: CategoriaChecklist, item: Omit<TemplateChecklistItem, "id">) => void;
  removeItem: (templateId: string, categoria: CategoriaChecklist, itemId: string) => void;
  toggleObligatorio: (templateId: string, categoria: CategoriaChecklist, itemId: string) => void;
  resetToDefaults: () => void;
}

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set) => ({
      templates: DEFAULT_TEMPLATES,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      addItem: (templateId, categoria, item) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id !== templateId
              ? t
              : {
                  ...t,
                  bloques: t.bloques.map((b) =>
                    b.id !== categoria ? b : { ...b, items: [...b.items, { ...item, id: `tpl-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }] }
                  ),
                }
          ),
        })),
      removeItem: (templateId, categoria, itemId) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id !== templateId
              ? t
              : { ...t, bloques: t.bloques.map((b) => (b.id !== categoria ? b : { ...b, items: b.items.filter((i) => i.id !== itemId) })) }
          ),
        })),
      toggleObligatorio: (templateId, categoria, itemId) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id !== templateId
              ? t
              : {
                  ...t,
                  bloques: t.bloques.map((b) =>
                    b.id !== categoria
                      ? b
                      : { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, obligatorio: !i.obligatorio } : i)) }
                  ),
                }
          ),
        })),
      resetToDefaults: () => set({ templates: DEFAULT_TEMPLATES }),
    }),
    {
      name: "avla-nexus-templates",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

export function getTemplateById(templates: ExpedienteTemplate[], id: string): ExpedienteTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export const TIPO_OPTIONS: TipoDocumentoDetectado[] = [
  "F1_FICHA_BASICA",
  "F2_DECLARACION_EXPERIENCIA",
  "F3_DJ_PATRIMONIAL",
  "DNI",
  "DECLARACION_JURADA",
  "EEFF_SITUACIONAL",
  "VIGENCIA_PODER",
  "COPIA_LITERAL",
  "CARTA_NOMBRAMIENTO",
  "SOLICITUD_EMISION",
  "BASES_INTEGRADAS",
  "MEMORIA_DESCRIPTIVA",
  "PRESUPUESTO",
  "REPORTE_BUENA_PRO",
  "ACTA_BUENA_PRO",
  "FICHA_CONSORCIO",
  "CONTRATO_CONSORCIO",
  "CONTRATO_ENTIDAD",
  "CONSULTA_RUC",
  "CONSULTA_DEUDA_COACTIVA",
  "CONSULTA_PROVEEDORES_ESTADO",
  "EXPERIENCIA_SEACE",
  "REPORTE_EQUIFAX",
  "SUSTENTO_PAGO",
];
