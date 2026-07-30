"use client";

import { useEffect } from "react";

/** Registers the PWA service worker; a no-op on browsers without support. */
export function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
