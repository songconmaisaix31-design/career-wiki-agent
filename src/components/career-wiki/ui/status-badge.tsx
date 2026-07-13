import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { labelForStatus, statusTone } from "@/components/career-wiki/navigation";

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  muted: "border-line bg-surface-low text-muted-foreground",
  blocked: "border-red-200 bg-red-600 text-white",
};

export function StatusBadge({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const tone = statusTone(value);
  return (
    <Badge variant="outline" className={cn("h-6 rounded-md border px-2.5", toneClasses[tone], className)}>
      {label ?? labelForStatus(value)}
    </Badge>
  );
}
