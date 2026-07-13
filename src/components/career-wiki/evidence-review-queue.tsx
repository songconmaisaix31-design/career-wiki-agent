"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, ShieldAlert, XCircle } from "lucide-react";

import { labelForStatus } from "@/components/career-wiki/navigation";
import { EmptyState } from "@/components/career-wiki/ui/empty-state";
import { StatusBadge } from "@/components/career-wiki/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { EvidenceReviewItemView, EvidenceReviewStatus } from "@/lib/career-wiki/evidence-review/types";
import { cn } from "@/lib/utils";

export function EvidenceReviewQueue({ items }: { items: EvidenceReviewItemView[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);

  function updateStatus(status: EvidenceReviewStatus) {
    if (!selected) return;
    if (!note.trim()) {
      setMessage("请先填写 review note。证据审核动作必须说明原因。");
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/career-wiki/evidence-review/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selected.id, status }),
        });
        if (!response.ok) throw new Error(await response.text());
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "审核动作失败，请稍后重试。");
      }
    });
  }

  if (!items.length) {
    return (
      <EmptyState
        title="暂无证据审核项"
        description="运行 Project Fit 或 Evidence Review 后，缺证据、重复证据、草稿证据和弱来源问题会出现在这里。"
      />
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="High" value={items.filter((item) => item.status === "open" && item.severity === "high").length} tone="danger" />
          <SummaryCard label="Medium" value={items.filter((item) => item.status === "open" && item.severity === "medium").length} tone="warning" />
          <SummaryCard label="Low" value={items.filter((item) => item.status === "open" && item.severity === "low").length} tone="info" />
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <h2 className="px-1 font-semibold">审核队列</h2>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "w-full rounded-lg border border-line bg-background p-3 text-left transition-colors hover:bg-surface-low",
                  selected?.id === item.id && "border-primary bg-brand-muted/50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                  <StatusBadge value={item.severity} label={item.severity} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {labelForStatus(item.status)} · {item.targetType}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {selected ? (
        <div className="space-y-4">
          {message ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div> : null}
          <section className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={selected.severity} label={`${selected.severity} severity`} />
                  <StatusBadge value={selected.status} />
                </div>
                <h2 className="mt-3 text-xl font-semibold">{selected.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selected.issueType} · {selected.targetType} / {selected.targetId}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <DetailBlock title="问题说明" text={selected.detail} />
              <DetailBlock title="建议动作" text={selected.recommendedAction} />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-semibold">审核动作</h2>
            <label className="mt-3 block text-sm font-medium">
              Review note
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-md border border-line bg-background px-3 py-2 text-sm leading-6"
                placeholder="说明为什么接受风险、忽略、重新打开或标记已解决。"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => updateStatus("resolved")} disabled={isPending || !note.trim()}>
                <CheckCircle2 className="size-4" />
                标记已解决
              </Button>
              <Button variant="outline" onClick={() => updateStatus("accepted_risk")} disabled={isPending || !note.trim()}>
                <ShieldAlert className="size-4" />
                接受风险
              </Button>
              <Button variant="outline" onClick={() => updateStatus("ignored")} disabled={isPending || !note.trim()}>
                <XCircle className="size-4" />
                忽略
              </Button>
              <Button variant="outline" onClick={() => updateStatus("open")} disabled={isPending || !note.trim()}>
                <RotateCcw className="size-4" />
                重新打开
              </Button>
            </div>
            {!note.trim() ? <p className="mt-2 text-xs text-muted-foreground">按钮禁用原因：必须填写 review note。</p> : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" | "info" }) {
  const classes = {
    danger: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <div className={cn("rounded-lg border p-3", classes[tone])}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-background p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text || "暂无内容。"}</p>
    </div>
  );
}
