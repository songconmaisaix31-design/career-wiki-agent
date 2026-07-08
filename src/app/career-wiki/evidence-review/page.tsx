import Link from "next/link";
import { GitMerge, ShieldCheck } from "lucide-react";

import { CareerWikiAppShell } from "@/components/career-wiki/app-shell";
import { EvidenceReviewExportButton } from "@/components/career-wiki/evidence-review-export-button";
import { EvidenceReviewQueue } from "@/components/career-wiki/evidence-review-queue";
import { Button } from "@/components/ui/button";
import { listEvidenceReviewItems } from "@/lib/career-wiki/evidence-review/repository";
import { getCareerWikiHealth } from "@/lib/career-wiki/health";

export const dynamic = "force-dynamic";

export default async function EvidenceReviewPage() {
  const [items, health] = await Promise.all([listEvidenceReviewItems(), getCareerWikiHealth()]);
  const openHigh = items.filter((item) => item.status === "open" && item.severity === "high").length;
  const openItems = items.filter((item) => item.status === "open").length;

  return (
    <CareerWikiAppShell
      active="evidence-review"
      title="证据审核"
      description="把缺证据、草稿证据、重复证据和弱来源问题整理成可处理队列；高风险问题会阻断简历批准。"
      statusItems={[
        { label: "系统健康", value: health.status === "pass" ? "通过" : health.status === "warn" ? "注意" : "失败", status: health.status },
        { label: "待处理", value: String(openItems), status: openItems > 0 ? "warn" : "pass" },
        { label: "高风险", value: String(openHigh), status: openHigh > 0 ? "blocked" : "pass" },
        { label: "总审核项", value: String(items.length) },
      ]}
      actions={
        <>
          <Button variant="outline" size="sm" render={<Link href="/career-wiki/project-fit" />}>
            <GitMerge className="size-4" />
            重新运行 Project Fit
          </Button>
          <EvidenceReviewExportButton />
          <Button size="sm" render={<Link href="/career-wiki/evidence-editor" />}>
            <ShieldCheck className="size-4" />
            补充证据
          </Button>
        </>
      }
    >
      <EvidenceReviewQueue items={items} />
    </CareerWikiAppShell>
  );
}
