import type { ReactNode } from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepperItem = {
  key: string;
  title: string;
  description?: string;
  state: "done" | "current" | "pending" | "blocked";
  action?: ReactNode;
};

export function Stepper({ items, className }: { items: StepperItem[]; className?: string }) {
  return (
    <ol className={cn("grid gap-3", className)}>
      {items.map((item, index) => {
        const Icon = item.state === "done" ? CheckCircle2 : item.state === "blocked" ? XCircle : Circle;
        return (
          <li key={item.key} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  item.state === "done" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  item.state === "current" && "border-blue-200 bg-blue-50 text-blue-700",
                  item.state === "blocked" && "border-red-200 bg-red-50 text-red-700",
                  item.state === "pending" && "border-line bg-surface-low text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                {item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                {item.action ? <div className="mt-3">{item.action}</div> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
