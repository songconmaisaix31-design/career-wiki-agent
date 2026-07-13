import { cn } from "@/lib/utils";

export function ScoreBadge({
  label,
  value,
  max = 100,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  className?: string;
}) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(value, max)) : 0;
  const percent = max > 0 ? Math.round((safeValue / max) * 100) : 0;
  const tone =
    percent >= 70
      ? "bg-emerald-500"
      : percent >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{safeValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-high">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
