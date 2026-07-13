import Link from "next/link";
import { ScrollText, ShieldCheck } from "lucide-react";

import { AuditLogViewer } from "@/components/career-wiki/audit-log-viewer";
import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { Button } from "@/components/ui/button";
import { listAuditLogs } from "@/lib/career-wiki/audit/audit-log";
import { getCareerWikiHealth } from "@/lib/career-wiki/health";

export const dynamic = "force-dynamic";

export default async function CareerAuditPage() {
  const [auditLogs, health] = await Promise.all([listAuditLogs(150), getCareerWikiHealth()]);
  const workflowLogs = auditLogs.filter((log) => log.action.includes("workflow")).length;
  const blockedLogs = auditLogs.filter((log) => log.action.includes("blocked") || log.summary.toLowerCase().includes("block")).length;

  return (
    <CareerWikiAppShell
      active="audit"
      title="审计日志"
      description="查看关键动作、状态变化、原因和前后摘要。普通页面不提供删除审计日志能力。"
      statusItems={[
        { label: "系统健康", value: health.status === "pass" ? "通过" : health.status === "warn" ? "注意" : "失败", status: health.status },
        { label: "日志数量", value: String(auditLogs.length), icon: ScrollText },
        { label: "Workflow 事件", value: String(workflowLogs) },
        { label: "阻断相关", value: String(blockedLogs), status: blockedLogs > 0 ? "warn" : "pass" },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm" render={<Link href="/career-wiki/workflow" />}>
            查看流程
          </Button>
          <Button size="sm" render={<Link href="/career-wiki/evidence-review" />}>
            <ShieldCheck className="size-4" />
            证据审核
          </Button>
        </>
      }
    >
      <AuditLogViewer logs={auditLogs} />
    </CareerWikiAppShell>
  );
}
