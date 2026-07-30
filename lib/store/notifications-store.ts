import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppNotification } from "@/lib/types";

interface NotificationsState {
  notifications: AppNotification[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  /** No-ops if a notification with the same dedupeKey already exists, so a
   * re-render or a re-scan of the same event never produces duplicates. */
  push: (input: Omit<AppNotification, "id" | "createdAt" | "leido">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      push: (input) =>
        set((s) => {
          if (s.notifications.some((n) => n.dedupeKey === input.dedupeKey)) return s;
          const notification: AppNotification = {
            ...input,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            leido: false,
          };
          // Cap the list so a long-lived session doesn't grow this forever.
          return { notifications: [notification, ...s.notifications].slice(0, 50) };
        }),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, leido: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, leido: true })) })),
      clear: () => set({ notifications: [] }),
    }),
    {
      name: "avla-nexus-notifications",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
