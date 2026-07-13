import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChecklistPanelItem = {
  key: string;
  label: string;
  passed: boolean;
  reason?: string;
  severity?: "info" | "warning" | "blocking";
  action?: ReactNode;
};

export function ChecklistPanel({ title, items }: { title: string; items: ChecklistPanelItem[] }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {items.filter((item) => item.passed).length}/{items.length} 通过
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => {
          const blocked = !item.passed && item.severity === "blocking";
          return (
            <div
              key={item.key}
              className={cn(
                "rounded-md border p-3 text-sm",
                item.passed && "border-emerald-100 bg-emerald-50/60",
                !item.passed && !blocked && "border-amber-100 bg-amber-50/70",
                blocked && "border-red-200 bg-red-50",
              )}
            >
              <div className="flex items-start gap-2">
                {item.passed ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                ) : (
                  <XCircle className={cn("mt-0.5 size-4 shrink-0", blocked ? "text-red-700" : "text-amber-700")} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.label}</p>
                  {item.reason ? <p className="mt-1 leading-6 text-muted-foreground">{item.reason}</p> : null}
                  {item.action ? <div className="mt-2">{item.action}</div> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
