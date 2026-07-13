import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-line bg-surface p-6 text-center", className)}>
      <div className="mx-auto grid size-10 place-items-center rounded-lg bg-surface-low text-muted-foreground">
        <Inbox className="size-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
