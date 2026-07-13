"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Play } from "lucide-react";

import { labelForWorkflowState } from "@/components/career-wiki/navigation";
import { ChecklistPanel } from "@/components/career-wiki/ui/checklist-panel";
import { EmptyState } from "@/components/career-wiki/ui/empty-state";
import { StatusBadge } from "@/components/career-wiki/ui/status-badge";
import { Stepper, type StepperItem } from "@/components/career-wiki/ui/stepper";
import { Button } from "@/components/ui/button";
import { workflowTransitions } from "@/lib/career-wiki/workflow/state-machine";
import type { CareerWorkflowEventView, CareerWorkflowRunView, CareerWorkflowState } from "@/lib/career-wiki/workflow/types";
import { cn } from "@/lib/utils";

const orderedStates: CareerWorkflowState[] = [
  "jd_imported",
  "project_fit_reviewed",
  "evidence_reviewed",
  "resume_drafted",
  "diff_reviewed",
  "resume_approved",
  "exported",
];

const repairLinks: Partial<Record<CareerWorkflowState, string>> = {
  jd_imported: "/career-wiki/jd-import",
  project_fit_reviewed: "/career-wiki/project-fit",
  evidence_reviewed: "/career-wiki/evidence-review",
  resume_drafted: "/career-wiki/resume-tailor",
  diff_reviewed: "/career-wiki/resume-tailor",
  resume_approved: "/career-wiki/resume-tailor",
  exported: "/career-wiki/resume-versions",
};

export function WorkflowBoard({
  workflows,
  selectedWorkflow,
  events,
}: {
  workflows: CareerWorkflowRunView[];
  selectedWorkflow: CareerWorkflowRunView | null;
  events: CareerWorkflowEventView[];
}) {
  const [targetState, setTargetState] = useState<CareerWorkflowState | "">("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const nextStates = selectedWorkflow ? workflowTransitions[selectedWorkflow.currentState] : [];
  const steps = useMemo(() => buildSteps(selectedWorkflow), [selectedWorkflow]);

  function startWorkflow() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/career-wiki/workflows/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Career workflow" }),
        });
        if (!response.ok) throw new Error(await response.text());
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "启动 workflow 失败。");
      }
    });
  }

  function transitionWorkflow() {
    if (!selectedWorkflow || !targetState) return;
    if (!reason.trim()) {
      setMessage("请填写 transition reason。关键状态变更必须留下审计原因。");
      return;
    }
    const confirmed = window.confirm(`确认将流程推进到「${labelForWorkflowState(targetState)}」？`);
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const response = await fetch("/api/career-wiki/workflows/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowRunId: selectedWorkflow.id, toState: targetState, reason }),
        });
        if (!response.ok) throw new Error(await response.text());
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "状态流转失败。请检查 blocker 并补充 reason。");
      }
    });
  }

  if (!workflows.length) {
    return (
      <EmptyState
        title="还没有求职流程"
        description="导入 JD 后可以启动 workflow。流程会把 JD 导入、项目匹配、证据审核、简历生成、批准和导出串起来。"
        action={
          <Button onClick={startWorkflow} disabled={isPending}>
            <Play className="size-4" />
            启动 workflow
          </Button>
        }
      />
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <h2 className="font-semibold">流程列表</h2>
        <div className="grid gap-2">
          {workflows.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/career-wiki/workflow?id=${encodeURIComponent(workflow.id)}`}
              className={cn(
                "rounded-lg border border-line bg-surface p-3 transition-colors hover:bg-surface-low",
                selectedWorkflow?.id === workflow.id && "border-primary bg-brand-muted/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{workflow.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{labelForWorkflowState(workflow.currentState)}</p>
                </div>
                <StatusBadge value={workflow.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">更新：{workflow.updatedAt}</p>
            </Link>
          ))}
        </div>
      </aside>

      {selectedWorkflow ? (
        <div className="space-y-6">
          {message ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div> : null}

          <section className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={selectedWorkflow.status} />
                  <StatusBadge value={selectedWorkflow.currentState} label={labelForWorkflowState(selectedWorkflow.currentState)} />
                </div>
                <h2 className="mt-3 text-xl font-semibold">{selectedWorkflow.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  当前阶段：{labelForWorkflowState(selectedWorkflow.currentState)}。所有推进动作都需要 reason，并由后端 guard 校验。
                </p>
              </div>
              <div className="min-w-72 rounded-lg border border-line bg-background p-3">
                <label className="block text-sm font-medium">
                  下一阶段
                  <select
                    value={targetState}
                    onChange={(event) => setTargetState(event.target.value as CareerWorkflowState)}
                    className="mt-2 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm"
                  >
                    <option value="">请选择合法流转</option>
                    {nextStates.map((state) => (
                      <option key={state} value={state}>
                        {labelForWorkflowState(state)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block text-sm font-medium">
                  Reason
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 min-h-24 w-full rounded-md border border-line bg-background px-3 py-2 text-sm leading-6"
                    placeholder="说明为什么推进或归档。"
                  />
                </label>
                <Button className="mt-3 w-full" onClick={transitionWorkflow} disabled={isPending || !targetState || !reason.trim()}>
                  推进流程
                  <ArrowRight className="size-4" />
                </Button>
                {!reason.trim() ? <p className="mt-2 text-xs text-muted-foreground">按钮禁用原因：必须填写 reason。</p> : null}
              </div>
            </div>
          </section>

          <Stepper items={steps} className="lg:grid-cols-2" />

          <ChecklistPanel
            title="当前阶段检查"
            items={selectedWorkflow.checklist.map((item) => ({
              key: item.key,
              label: item.label,
              passed: item.passed,
              reason: item.reason,
              severity: item.severity,
              action: !item.passed && repairLinks[selectedWorkflow.currentState] ? (
                <Link href={repairLinks[selectedWorkflow.currentState] ?? "/career-wiki/dashboard"} className="text-sm font-medium text-primary hover:underline">
                  去修复
                </Link>
              ) : undefined,
            }))}
          />

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="font-semibold">事件时间线</h2>
            <div className="mt-3 space-y-2">
              {events.length ? (
                events.map((event) => (
                  <article key={event.id} className="rounded-lg border border-line bg-background p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{event.action}</p>
                      <span className="text-xs text-muted-foreground">{event.createdAt}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {event.fromState ? labelForWorkflowState(event.fromState) : "开始"}
                      {" -> "}
                      {labelForWorkflowState(event.toState)}
                    </p>
                    <p className="mt-1 leading-6">{event.reason || "未填写 reason"}</p>
                    {!event.guardResult.allowed ? <p className="mt-1 text-red-700">Guard 未完全通过，请查看 checklist。</p> : null}
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">暂无事件。启动或推进 workflow 后会自动记录。</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function buildSteps(workflow: CareerWorkflowRunView | null): StepperItem[] {
  const currentIndex = workflow ? orderedStates.indexOf(workflow.currentState) : -1;
  return orderedStates.map((state, index) => {
    const isCurrent = workflow?.currentState === state;
    const failedChecks = workflow?.checklist.filter((item) => !item.passed && item.severity === "blocking") ?? [];
    const blocked = isCurrent && failedChecks.length > 0;
    return {
      key: state,
      title: labelForWorkflowState(state),
      description: blocked
        ? failedChecks.map((item) => item.reason).filter(Boolean).join("；")
        : isCurrent
          ? "当前阶段。完成检查后才能进入下一步。"
          : index < currentIndex
            ? "已完成。"
            : "等待前置阶段完成。",
      state: blocked ? "blocked" : isCurrent ? "current" : index < currentIndex ? "done" : "pending",
      action: repairLinks[state] ? (
        <Link href={repairLinks[state] ?? "/career-wiki/dashboard"} className="text-sm font-medium text-primary hover:underline">
          打开相关页面
        </Link>
      ) : undefined,
    };
  });
}
