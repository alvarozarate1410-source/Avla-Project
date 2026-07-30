import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <main className="noise-veil flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-[0_8px_24px_-8px_var(--brand)]">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      </div>
    </main>
  );
}
