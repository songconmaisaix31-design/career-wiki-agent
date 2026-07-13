import Link from "next/link";
import { Activity, Database } from "lucide-react";

import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { labelForWorkflowState } from "@/components/career-wiki/navigation";
import { WorkflowBoard } from "@/components/career-wiki/workflow-board";
import { Button } from "@/components/ui/button";
import { getCareerWikiHealth } from "@/lib/career-wiki/health";
import { getWorkflowRun, listWorkflowRuns } from "@/lib/career-wiki/workflow/repository";

export const dynamic = "force-dynamic";

export default async function CareerWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const query = await searchParams;
  const [workflows, health] = await Promise.all([listWorkflowRuns(), getCareerWikiHealth()]);
  const selectedId = query.id ?? workflows[0]?.id ?? "";
  const detail = selectedId ? await getWorkflowRun(selectedId).catch(() => null) : null;
  const selectedWorkflow = detail?.run ?? workflows[0] ?? null;
  const events = detail?.events ?? [];

  return (
    <CareerWikiAppShell
      active="workflow"
      title="求职流程"
      description="把 JD 导入、项目匹配、证据审核、简历生成、人工批准和导出串成可审计的状态机。"
      statusItems={[
        { label: "系统健康", value: health.status === "pass" ? "通过" : health.status === "warn" ? "注意" : "失败", status: health.status, icon: Activity },
        { label: "Workflow 数量", value: String(workflows.length) },
        { label: "当前阶段", value: selectedWorkflow ? labelForWorkflowState(selectedWorkflow.currentState) : "未启动", status: selectedWorkflow?.status ?? "warn" },
        { label: "CareerVault", value: health.checks.find((check) => check.key === "vault-configured")?.status === "pass" ? "已配置" : "待配置", status: health.checks.find((check) => check.key === "vault-configured")?.status ?? "warn", icon: Database },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm" render={<Link href="/career-wiki/jd-import" />}>
            导入 JD
          </Button>
          <Button size="sm" render={<Link href="/career-wiki/project-fit" />}>
            进入项目匹配
          </Button>
        </>
      }
    >
      <WorkflowBoard workflows={workflows} selectedWorkflow={selectedWorkflow} events={events} />
    </CareerWikiAppShell>
  );
}
