"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/career-wiki/ui/empty-state";
import { StatusBadge } from "@/components/career-wiki/ui/status-badge";

type AuditLogView = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  summary: string;
  beforeJson: unknown;
  afterJson: unknown;
  metadata: unknown;
  createdAt: string;
};

export function AuditLogViewer({ logs }: { logs: AuditLogView[] }) {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [selectedId, setSelectedId] = useState(logs[0]?.id ?? "");
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const entityTypes = Array.from(new Set(logs.map((log) => log.entityType))).sort();
  const filtered = useMemo(
    () => logs.filter((log) => (!action || log.action === action) && (!entityType || log.entityType === entityType)),
    [action, entityType, logs],
  );
  const selected = filtered.find((log) => log.id === selectedId) ?? filtered[0];

  if (!logs.length) {
    return (
      <EmptyState
        title="暂无审计日志"
        description="证据编辑、Project Fit override、workflow transition、简历批准和导出等关键动作会自动记录在这里。"
      />
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Action
            <select value={action} onChange={(event) => setAction(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm">
              <option value="">全部动作</option>
              {actions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Entity type
            <select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="mt-2 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm">
              <option value="">全部实体</option>
              {entityTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-semibold">日志列表</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} 条</span>
          </div>
          <div className="space-y-2">
            {filtered.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSelectedId(log.id)}
                className="w-full rounded-lg border border-line bg-background p-3 text-left transition-colors hover:bg-surface-low"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{log.action}</p>
                  <span className="text-xs text-muted-foreground">{log.createdAt}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{log.entityType} / {log.entityId}</p>
                <p className="mt-2 line-clamp-2 text-sm">{log.summary}</p>
              </button>
            ))}
            {!filtered.length ? <p className="px-2 py-6 text-center text-sm text-muted-foreground">当前筛选条件下没有日志。</p> : null}
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-line bg-surface p-5">
        {selected ? (
          <div className="space-y-4">
            <div>
              <StatusBadge value={selected.action.includes("blocked") ? "blocked" : "info"} label={selected.action} />
              <h2 className="mt-3 text-xl font-semibold">日志详情</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selected.createdAt}</p>
            </div>
            <Detail label="Entity" value={`${selected.entityType} / ${selected.entityId}`} />
            <Detail label="Summary" value={selected.summary} />
            <Detail label="Actor" value={selected.actor} />
            <Detail label="Before summary" value={summarize(selected.beforeJson)} />
            <Detail label="After summary" value={summarize(selected.afterJson)} />
            <Detail label="Reason / Metadata" value={summarize(selected.metadata)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">请选择一条日志查看详情。</p>
        )}
      </aside>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm leading-6">{value}</p>
    </div>
  );
}

function summarize(value: unknown) {
  if (!value) return "无";
  try {
    const text = JSON.stringify(value);
    return text.length > 480 ? `${text.slice(0, 480)}...` : text;
  } catch {
    return "无法显示";
  }
}
