"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { playChime } from "@/lib/audio/chime";

const VISIBLE_MS = 1300;

/**
 * Shown once per full page load (mounted at the root layout, which React
 * only mounts once per hard navigation/app open — client-side route changes
 * within the app never remount it), on both the desktop web app and a
 * PWA launch from the home screen.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    playChime();
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-[#08090f]"
          aria-hidden="true"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 15%, rgba(109,94,248,0.22), transparent 45%), radial-gradient(circle at 82% 75%, rgba(79,140,255,0.18), transparent 45%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-5"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_-20px_rgba(109,94,248,0.55)] backdrop-blur-xl">
              <span className="animate-pulse-ring absolute inset-0 rounded-2xl" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="font-[var(--font-brand)] text-2xl font-bold uppercase tracking-[0.08em] text-white">
                AVLA <span className="brand-gradient-text">NEXUS</span>
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                Commercial Intelligence Workspace
              </p>
            </div>

            <div className="mt-1 h-[3px] w-32 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
                className="h-full w-1/2 rounded-full brand-gradient"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
