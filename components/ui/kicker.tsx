import { cn } from "@/lib/utils";

/** Small tracked-out label used above section headings. */
export function Kicker({
  children,
  className,
  accent = "text-fog",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.35em]",
        accent,
        className,
      )}
    >
      <span className="h-px w-8 bg-current opacity-40" />
      {children}
    </span>
  );
}
