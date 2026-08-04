interface AvlaMarkProps {
  className?: string;
}

/**
 * The app's own brand mark — a bold "A" whose left leg ends in the
 * paintbrush-style swoosh/hook from AVLA's official wordmark, instead of a
 * plain typeface glyph. Stroke-based (not filled) so className controls
 * size the same way lucide icons do (h-4 w-4, h-6 w-6, ...) and color
 * follows currentColor from the parent, matching how the old Sparkles icon
 * was used in the brand-gradient squares.
 */
export function AvlaMark({ className }: AvlaMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.4 L20 21" />
        <path d="M8 15 L16 15" />
        <path d="M12 2.4 C9 8.5, 5.5 13.8, 3.5 18.5 C2.7 20.8, 4 22.3, 6.3 21.3 C7.6 20.7, 7.7 19.3, 6.7 18.5" />
      </g>
    </svg>
  );
}
