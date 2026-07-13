import type { ReactNode } from "react";
import { Ban } from "lucide-react";

export function BlockedState({
  title = "当前步骤被阻断",
  reason,
  action,
}: {
  title?: string;
  reason: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-start gap-3">
        <Ban className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6">{reason}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
