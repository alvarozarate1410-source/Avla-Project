interface AvlaMarkProps {
  className?: string;
}

/**
 * The app's own brand mark — a bold "A" letterform standing in for the
 * "Avla" wordmark inside the existing brand-gradient square pattern used
 * across sidebar, splash screen, mobile nav, login and register headers.
 */
export function AvlaMark({ className }: AvlaMarkProps) {
  return (
    <span className={`font-sans font-extrabold leading-none tracking-tight ${className ?? ""}`} aria-hidden="true">
      A
    </span>
  );
}
