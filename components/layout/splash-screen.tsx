"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playChime } from "@/lib/audio/chime";

// The logo's bounce-in overshoots and lands at this offset into its own
// animation (see the `times` array below) — the chime and the particle
// burst both fire here so the "impact" is felt, heard, and seen at once.
const IMPACT_MS = 260;
const BOUNCE_MS = 620;
// How long the logo sits fully still after landing before the whole
// screen starts fading out — brief on purpose, just long enough to register.
const SETTLE_MS = 520;
const VISIBLE_MS = BOUNCE_MS + SETTLE_MS;

const PARTICLE_COUNT = 8;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  return { dx: Math.cos(angle) * 40, dy: Math.sin(angle) * 40, delay: (i % 3) * 0.025 };
});

/**
 * Shown once per full page load (mounted at the root layout, which React
 * only mounts once per hard navigation/app open — client-side route changes
 * within the app never remount it), on both the desktop web app and a
 * PWA launch from the home screen.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const chimeTimer = setTimeout(playChime, IMPACT_MS);
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => {
      clearTimeout(chimeTimer);
      clearTimeout(hideTimer);
    };
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
                "radial-gradient(circle at 20% 15%, rgba(1,113,206,0.22), transparent 45%), radial-gradient(circle at 82% 75%, rgba(63,169,255,0.18), transparent 45%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="relative flex h-16 w-16 items-center justify-center">
              {PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-[#5cb8ff]"
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.4], x: p.dx, y: p.dy }}
                  transition={{ duration: 0.55, delay: IMPACT_MS / 1000 + p.delay, ease: "easeOut" }}
                />
              ))}

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.18, 0.92, 1.04, 1], opacity: 1 }}
                transition={{
                  duration: BOUNCE_MS / 1000,
                  times: [0, 0.42, 0.64, 0.85, 1],
                  ease: ["easeOut", "easeInOut", "easeInOut", "easeOut"],
                }}
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_-20px_rgba(1,113,206,0.55)] backdrop-blur-xl"
              >
                <span className="animate-pulse-ring absolute inset-0 rounded-2xl" />
                {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark, next/image's optimization pipeline is unneeded overhead for a fixed 44px icon */}
                <img src="/brand/avla-mark.png" alt="Avla" className="h-11 w-11 rounded-xl" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: IMPACT_MS / 1000 + 0.05, ease: "easeOut" }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <p className="font-[var(--font-brand)] text-2xl font-bold uppercase tracking-[0.08em] text-white">
                AVLA <span className="brand-gradient-text">NEXUS</span>
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                Commercial Intelligence Workspace
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: IMPACT_MS / 1000 + 0.15 }}
              className="mt-1 h-[3px] w-32 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
                className="h-full w-1/2 rounded-full brand-gradient"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
