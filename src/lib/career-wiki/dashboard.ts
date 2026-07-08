import { prisma } from "@/lib/db";
import { listAuditLogs } from "./audit/audit-log";
import { listEvidenceReviewItems } from "./evidence-review/repository";
import { getCareerWikiHealth } from "./health";
import { ensureResumeTailorSchema } from "./test-harness-repository";
import { listWorkflowRuns } from "./workflow/repository";

type CountRow = { count: number };

export async function getCareerWikiDashboard() {
  await ensureResumeTailorSchema();
  const [counts, workflows, reviewItems, auditLogs, health] = await Promise.all([
    getCounts(),
    listWorkflowRuns(),
    listEvidenceReviewItems(),
    listAuditLogs(10),
    getCareerWikiHealth(),
  ]);

  return {
    counts,
    workflow: workflows[0] ?? null,
    evidenceReview: {
      total: reviewItems.length,
      openHigh: reviewItems.filter((item) => item.status === "open" && item.severity === "high").length,
      openMedium: reviewItems.filter((item) => item.status === "open" && item.severity === "medium").length,
      openLow: reviewItems.filter((item) => item.status === "open" && item.severity === "low").length,
    },
    auditLogs,
    health,
  };
}

async function getCounts() {
  const [
    profiles,
    projects,
    skills,
    jdTests,
    fitResults,
    evidenceItems,
    resumeVersions,
    approvedVersions,
    exportedVersions,
    exportLogs,
  ] = await Promise.all([
    count(`SELECT COUNT(*) AS count FROM "CareerProfile"`),
    count(`SELECT COUNT(*) AS count FROM "CareerProject"`),
    count(`SELECT COUNT(*) AS count FROM "CareerSkill"`),
    count(`SELECT COUNT(*) AS count FROM "CareerJdTest"`),
    count(`SELECT COUNT(*) AS count FROM "CareerProjectFitResult"`),
    count(`SELECT COUNT(*) AS count FROM "CareerEvidenceItem"`),
    count(`SELECT COUNT(*) AS count FROM "CareerResumeVersion"`),
    count(`SELECT COUNT(*) AS count FROM "CareerResumeVersion" WHERE "status" = 'approved'`),
    count(`SELECT COUNT(*) AS count FROM "CareerResumeVersion" WHERE "status" = 'exported'`),
    count(`SELECT COUNT(*) AS count FROM "CareerExportLog"`),
  ]);

  return {
    profiles,
    projects,
    skills,
    jdTests,
    fitResults,
    evidenceItems,
    resumeVersions,
    approvedVersions,
    exportedVersions,
    exportLogs,
  };
}

async function count(sql: string) {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return Number(rows[0]?.count ?? 0);
}
