import type { ComponentType, SVGProps } from "react";

import { StatusBadge } from "@/components/career-wiki/ui/status-badge";
import { cn } from "@/lib/utils";

export type CareerWikiStatusItem = {
  label: string;
  value: string;
  status?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export function CareerWikiStatusStrip({
  items,
  className,
}: {
  items: CareerWikiStatusItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={`${item.label}-${item.value}`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
              <span className="truncate text-xs text-muted-foreground">{item.label}</span>
            </div>
            {item.status ? <StatusBadge value={item.status} label={item.value} /> : <span className="truncate text-sm font-medium">{item.value}</span>}
          </div>
        );
      })}
    </div>
  );
}
