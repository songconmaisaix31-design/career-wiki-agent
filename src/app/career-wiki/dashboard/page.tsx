import Link from "next/link";
import {
  Activity,
  ClipboardCheck,
  Download,
  FileText,
  GitMerge,
  ListChecks,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { labelForWorkflowState } from "@/components/career-wiki/navigation";
import { ActionCard } from "@/components/career-wiki/ui/action-card";
import { EmptyState } from "@/components/career-wiki/ui/empty-state";
import { StatusBadge } from "@/components/career-wiki/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getCareerWikiDashboard } from "@/lib/career-wiki/dashboard";

export const dynamic = "force-dynamic";

export default async function CareerWikiDashboardPage() {
  const dashboard = await getCareerWikiDashboard();
  const workflowState = dashboard.workflow?.currentState ?? "profile_ready";
  const healthStatus = dashboard.health.status;
  const hasRealFlow = dashboard.counts.jdTests > 0 && dashboard.counts.verifiedEvidence > 0;
  const nextAction = getNextAction(dashboard);
  const risks = buildRiskItems(dashboard);

  const flowSteps = [
    {
      title: "JD 导入",
      href: "/career-wiki/jd-import",
      icon: Upload,
      count: dashboard.counts.jdTests,
      status: dashboard.counts.jdTests > 0 ? "pass" : "warn",
      reason: dashboard.counts.jdTests > 0 ? "已有可用于匹配的 JD" : "还没有真实 JD，先导入或粘贴一个岗位描述。",
    },
    {
      title: "项目匹配",
      href: "/career-wiki/project-fit",
      icon: GitMerge,
      count: dashboard.counts.fitResults,
      status: dashboard.counts.fitResults > 0 ? "pass" : "warn",
      reason: dashboard.counts.fitResults > 0 ? "已有项目匹配结果" : "导入 JD 后运行 Project Fit，确认哪些项目可用于简历。",
    },
    {
      title: "证据审核",
      href: "/career-wiki/evidence-review",
      icon: ShieldCheck,
      count: dashboard.evidenceReview.total,
      status: dashboard.evidenceReview.openHigh > 0 ? "blocked" : dashboard.counts.verifiedEvidence > 0 ? "pass" : "warn",
      reason:
        dashboard.evidenceReview.openHigh > 0
          ? "存在高风险证据问题，会阻断简历批准。"
          : dashboard.counts.verifiedEvidence > 0
            ? "已有 verified evidence 可支撑简历内容。"
            : "还缺少 verified evidence，先补充或审核证据。",
    },
    {
      title: "简历生成",
      href: "/career-wiki/resume-tailor",
      icon: Sparkles,
      count: dashboard.counts.resumeVersions,
      status: dashboard.counts.resumeVersions > 0 ? "pass" : "warn",
      reason: dashboard.counts.resumeVersions > 0 ? "已有简历版本" : "完成项目匹配和证据审核后生成草稿。",
    },
    {
      title: "审批导出",
      href: "/career-wiki/resume-versions",
      icon: Download,
      count: dashboard.counts.exportedVersions,
      status: dashboard.counts.exportedVersions > 0 ? "pass" : dashboard.counts.approvedVersions > 0 ? "info" : "warn",
      reason:
        dashboard.counts.exportedVersions > 0
          ? "已有正式导出版本。"
          : dashboard.counts.approvedVersions > 0
            ? "已有 approved 版本，可以导出。"
            : "草稿不能导出 final，需要先通过 checklist 并人工批准。",
    },
  ];

  const metrics = [
    ["JD", dashboard.counts.jdTests],
    ["项目", dashboard.counts.projects],
    ["技能", dashboard.counts.skills],
    ["已验证证据", dashboard.counts.verifiedEvidence],
    ["待处理证据", dashboard.counts.openMissingEvidence],
    ["已批准简历", dashboard.counts.approvedVersions],
    ["已导出简历", dashboard.counts.exportedVersions],
    ["审计日志", dashboard.auditLogs.length],
  ];

  return (
    <CareerWikiAppShell
      active="dashboard"
      title="Career Wiki 总览"
      description="从 JD 导入、项目匹配、证据审核到简历批准导出，按真实投递前审核流程推进。"
      statusItems={[
        { label: "系统健康", value: healthStatus === "pass" ? "通过" : healthStatus === "warn" ? "注意" : "失败", status: healthStatus, icon: Activity },
        { label: "CareerVault", value: dashboard.health.checks.find((check) => check.key === "vault-configured")?.status === "pass" ? "已配置" : "待配置", status: dashboard.health.checks.find((check) => check.key === "vault-configured")?.status ?? "warn" },
        { label: "最近流程", value: labelForWorkflowState(workflowState), status: dashboard.workflow?.status ?? "active", icon: ListChecks },
        { label: "下一步", value: nextAction.label, status: nextAction.status },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm" render={<Link href="/career-wiki/workflow" />}>
            查看流程
          </Button>
          <Button size="sm" render={<Link href={nextAction.href} />}>
            {nextAction.label}
          </Button>
        </>
      }
    >
      <section className="rounded-xl border border-line bg-surface p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={healthStatus} label={healthStatus === "pass" ? "系统可用" : healthStatus === "warn" ? "需要注意" : "需要处理"} />
              <StatusBadge value={dashboard.evidenceReview.openHigh > 0 ? "blocked" : "pass"} label={dashboard.evidenceReview.openHigh > 0 ? "证据阻断" : "证据未阻断"} />
            </div>
            <h2 className="mt-4 text-xl font-semibold">下一步：{nextAction.label}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{nextAction.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button render={<Link href={nextAction.href} />}>{nextAction.label}</Button>
              <Button variant="outline" render={<Link href="/career-wiki/audit" />}>查看审计日志</Button>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-background p-4">
            <h3 className="font-semibold">当前流程</h3>
            {dashboard.workflow ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium">{dashboard.workflow.name}</p>
                <p className="text-muted-foreground">阶段：{labelForWorkflowState(dashboard.workflow.currentState)}</p>
                <p className="text-muted-foreground">更新时间：{dashboard.workflow.updatedAt}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">还没有 workflow。导入 JD 后可以启动完整审核流程。</p>
            )}
          </div>
        </div>
      </section>

      {!hasRealFlow ? (
        <EmptyState
          title="还没有完整的真实投递流程"
          description="建议先导入一个真实 JD，再运行项目匹配并补充 verified evidence。没有证据的内容不会进入 final resume。"
          action={<Button render={<Link href="/career-wiki/jd-import" />}>导入第一个 JD</Button>}
        />
      ) : null}

      <section className="grid gap-3 lg:grid-cols-5">
        {flowSteps.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.title} href={step.href} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-low">
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-muted text-brand">
                  <Icon className="size-4" />
                </span>
                <StatusBadge value={step.status} />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-2xl font-semibold">{step.count}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.reason}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value]) => (
              <article key={label} className="rounded-lg border border-line bg-surface p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </article>
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">快捷操作</h2>
                <p className="mt-1 text-sm text-muted-foreground">从这里进入日常使用最常见的动作。</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ActionCard title="导入 JD" description="上传或粘贴岗位描述，进入后续匹配流程。" href="/career-wiki/jd-import" icon={Upload} />
              <ActionCard title="运行 Project Fit" description="查看哪些项目适合当前 JD，并解释原因。" href="/career-wiki/project-fit" icon={GitMerge} />
              <ActionCard title="补充证据" description="为项目、技能或 bullet 添加可审核证据。" href="/career-wiki/evidence-editor" icon={ShieldCheck} />
              <ActionCard title="审核证据" description="处理高风险、重复、草稿和证据不足问题。" href="/career-wiki/evidence-review" icon={ClipboardCheck} />
              <ActionCard title="生成简历" description="按证据和 checklist 生成定制简历草稿。" href="/career-wiki/resume-tailor" icon={Sparkles} />
              <ActionCard title="查看版本" description="预览模板、导出 Markdown / HTML / JSON / DOCX。" href="/career-wiki/resume-versions" icon={FileText} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section id="health" className="rounded-xl border border-line bg-surface p-4">
            <h2 className="font-semibold">风险与阻断</h2>
            <div className="mt-3 space-y-2">
              {risks.map((risk) => (
                <div key={risk.label} className="rounded-lg border border-line bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{risk.label}</p>
                    <StatusBadge value={risk.status} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{risk.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">最近审计</h2>
              <Link href="/career-wiki/audit" className="text-sm text-primary hover:underline">
                查看全部
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {dashboard.auditLogs.length ? (
                dashboard.auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="rounded-lg border border-line bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{log.action}</span>
                      <ScrollText className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{log.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">暂无审计日志。执行证据编辑、审批或导出后会自动记录。</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </CareerWikiAppShell>
  );
}

type DashboardData = Awaited<ReturnType<typeof getCareerWikiDashboard>>;

function getNextAction(dashboard: DashboardData) {
  if (dashboard.counts.jdTests === 0) {
    return { label: "导入 JD", href: "/career-wiki/jd-import", status: "warning", description: "没有真实 JD 时，项目匹配和简历定制都缺少目标。" };
  }
  if (dashboard.counts.fitResults === 0) {
    return { label: "运行项目匹配", href: "/career-wiki/project-fit", status: "warning", description: "先确认哪些项目能支撑当前岗位要求，避免把不匹配项目写入简历。" };
  }
  if (dashboard.evidenceReview.openHigh > 0 || dashboard.counts.verifiedEvidence === 0) {
    return { label: "处理证据", href: "/career-wiki/evidence-review", status: "blocked", description: "高风险证据问题会阻断 approved，缺少 verified evidence 的内容不能进入 final resume。" };
  }
  if (dashboard.counts.approvedVersions === 0 && dashboard.counts.exportedVersions === 0) {
    return { label: "生成简历", href: "/career-wiki/resume-tailor", status: "info", description: "证据就绪后生成草稿，查看 diff 和 checklist，再人工批准。" };
  }
  return { label: "导出简历", href: "/career-wiki/resume-versions", status: "success", description: "选择 approved/exported 版本和模板，导出正式投递文件。" };
}

function buildRiskItems(dashboard: DashboardData) {
  return [
    {
      label: "高风险证据",
      status: dashboard.evidenceReview.openHigh > 0 ? "blocked" : "pass",
      description: dashboard.evidenceReview.openHigh > 0 ? `${dashboard.evidenceReview.openHigh} 项高风险问题需要先处理。` : "没有打开的高风险证据问题。",
    },
    {
      label: "草稿未批准",
      status: dashboard.counts.resumeVersions > dashboard.counts.approvedVersions + dashboard.counts.exportedVersions ? "warning" : "pass",
      description: "draft 版本不能导出 final，必须通过 checklist 并人工批准。",
    },
    {
      label: "完整性检查",
      status: dashboard.health.status,
      description: dashboard.health.status === "pass" ? "当前健康检查通过。" : "请查看健康检查输出并处理 warn/fail 项。",
    },
  ];
}
