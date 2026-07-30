/**
 * A short, subtle two-note chime synthesized with the Web Audio API rather
 * than a shipped audio file — keeps this to a few lines with no asset
 * pipeline. Browsers block autoplaying audio before the user has
 * interacted with the page at all, so this tries to play immediately and,
 * if that's rejected, arms a one-time listener that plays it on the
 * visitor's very first click/tap/keypress instead.
 */
export function playChime() {
  if (typeof window === "undefined") return;

  const attempt = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const notes: [number, number][] = [
        [880, now], // A5
        [1318.5, now + 0.09], // E6
      ];

      for (const [freq, start] of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      }

      setTimeout(() => ctx.close().catch(() => {}), 800);
      return true;
    } catch {
      return false;
    }
  };

  if (attempt()) return;

  const onFirstInteraction = () => {
    attempt();
    window.removeEventListener("pointerdown", onFirstInteraction);
    window.removeEventListener("keydown", onFirstInteraction);
  };
  window.addEventListener("pointerdown", onFirstInteraction, { once: true });
  window.addEventListener("keydown", onFirstInteraction, { once: true });
}
