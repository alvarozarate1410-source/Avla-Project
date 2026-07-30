import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Expediente } from "@/lib/types";
import { expedientes as mockExpedientes, getExpedienteById as getMockExpedienteById } from "@/lib/mock-data";

interface ExpedientesState {
  /** Newly-created expedientes and edited copies of demo ones, keyed by id.
   * There's no backend yet — this is the client's source of truth for
   * anything created or changed during the session, persisted to
   * localStorage so it survives reloads within the same browser. */
  overrides: Record<string, Expediente>;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  upsert: (expediente: Expediente) => void;
  remove: (id: string) => void;
}

export const useExpedientesStore = create<ExpedientesState>()(
  persist(
    (set) => ({
      overrides: {},
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      upsert: (expediente) => set((s) => ({ overrides: { ...s.overrides, [expediente.id]: expediente } })),
      remove: (id) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[id];
          return { overrides: next };
        }),
    }),
    {
      name: "avla-nexus-expedientes",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

/** All expedientes visible in list views: static demo data with any
 * client-side overrides/new records layered on top, newest first. */
export function useAllExpedientes(): Expediente[] {
  const overrides = useExpedientesStore((s) => s.overrides);
  const byId = new Map<string, Expediente>();
  for (const e of mockExpedientes) byId.set(e.id, e);
  for (const e of Object.values(overrides)) byId.set(e.id, e);
  return Array.from(byId.values()).sort((a, b) => (a.actualizadoEn < b.actualizadoEn ? 1 : -1));
}

/** Looks up a single expediente client-side: an override (edited demo or
 * newly-created) takes precedence over the static demo record. */
export function useExpedienteById(id: string): { expediente: Expediente | undefined; hasHydrated: boolean } {
  const override = useExpedientesStore((s) => s.overrides[id]);
  const hasHydrated = useExpedientesStore((s) => s.hasHydrated);
  return { expediente: override ?? getMockExpedienteById(id), hasHydrated };
}
