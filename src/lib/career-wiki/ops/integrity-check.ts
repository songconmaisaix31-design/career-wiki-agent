import { PrismaClient } from "@prisma/client";

export type CareerIntegrityIssue = {
  key: string;
  severity: "warning" | "blocking";
  detail: string;
};

export async function runCareerIntegrityCheck() {
  process.env.DATABASE_URL ||= "file:./dev.db";
  const prisma = new PrismaClient({ log: ["error"] });
  const issues: CareerIntegrityIssue[] = [];
  try {
    const counts = await Promise.all([
      countTable(prisma, "CareerProject"),
      countTable(prisma, "CareerSkill"),
      countRealVerifiedEvidence(prisma),
      countRealApprovedResumeVersions(prisma),
      countTable(prisma, "CareerEvidenceReviewItem", `"severity" = 'high' AND "status" = 'open'`),
    ]);
    const [projects, skills, verifiedEvidence, approvedVersions, openHighReview] = counts;
    if (projects === 0) issues.push({ key: "projects", severity: "warning", detail: "Project Bank is empty." });
    if (skills === 0) issues.push({ key: "skills", severity: "warning", detail: "Skill Matrix is empty." });
    if (verifiedEvidence === 0) issues.push({ key: "verified_evidence", severity: "warning", detail: "No verified evidence linked to a real JD exists." });
    if (approvedVersions === 0) issues.push({ key: "approved_versions", severity: "warning", detail: "No approved or exported resume version for a real JD exists." });
    if (openHighReview > 0) issues.push({ key: "evidence_review", severity: "blocking", detail: `${openHighReview} high-severity evidence review item(s) remain open.` });
  } catch (error) {
    issues.push({ key: "database", severity: "blocking", detail: error instanceof Error ? error.message : "Integrity query failed." });
  } finally {
    await prisma.$disconnect();
  }
  return {
    status: issues.some((issue) => issue.severity === "blocking") ? "fail" : issues.length ? "warn" : "pass",
    issues,
  };
}

async function countTable(prisma: PrismaClient, table: string, where = "") {
  const exists = await tableExists(prisma, table);
  if (!exists) return 0;
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "${table}"${where ? ` WHERE ${where}` : ""}`);
  return Number(rows[0]?.count ?? 0);
}

async function countRealVerifiedEvidence(prisma: PrismaClient) {
  const hasEvidence = await tableExists(prisma, "CareerEvidenceItem");
  const hasJd = await tableExists(prisma, "CareerJdTest");
  if (!hasEvidence || !hasJd) return 0;
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count
     FROM "CareerEvidenceItem"
     WHERE "status" = 'verified'
       AND (
        "jdTestId" = ''
        OR "jdTestId" IN (
          SELECT "id" FROM "CareerJdTest"
          WHERE "company" <> 'JD Template' AND "source" <> 'placeholder'
        )
       )`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function countRealApprovedResumeVersions(prisma: PrismaClient) {
  const hasVersions = await tableExists(prisma, "CareerResumeVersion");
  if (!hasVersions) return 0;
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count
     FROM "CareerResumeVersion"
     WHERE "status" IN ('approved', 'exported')
       AND "company" <> 'JD Template'`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = ?`,
    table,
  );
  return Number(rows[0]?.count ?? 0) > 0;
}
