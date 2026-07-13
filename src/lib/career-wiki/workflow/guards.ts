import { prisma } from "@/lib/db";
import { getEvidenceItems } from "../evidence";
import { ensureCareerWikiSchema } from "../repository";
import { ensureResumeTailorSchema } from "../test-harness-repository";
import type { CareerWorkflowCheck, CareerWorkflowGuardResult, CareerWorkflowState } from "./types";

type GuardContext = {
  jdTestId?: string;
  resumeVersionId?: string;
};

export async function buildWorkflowChecklist(toState: CareerWorkflowState, context: GuardContext): Promise<CareerWorkflowCheck[]> {
  await ensureResumeTailorSchema();
  await ensureCareerWikiSchema();
  const [profileRows, projectCountRows, skillCountRows, jdCountRows, projectFitCountRows, draftCountRows, approvedCountRows, exportCountRows, evidenceItems] =
    await Promise.all([
      prisma.$queryRawUnsafe<Array<{ name: string; summary: string }>>(`SELECT "name", "summary" FROM "CareerProfile" WHERE "id" = 'singleton' LIMIT 1`),
      prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerProject"`),
      prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerSkill"`),
      context.jdTestId
        ? prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerJdTest" WHERE "id" = ?`, context.jdTestId)
        : prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerJdTest"`),
      context.jdTestId
        ? prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerProjectFitResult" WHERE "jdTestId" = ?`, context.jdTestId)
        : prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerProjectFitResult"`),
      context.jdTestId
        ? prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "ResumeTailorRun" WHERE "jdTestId" = ?`, context.jdTestId)
        : prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "ResumeTailorRun"`),
      context.resumeVersionId
        ? prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerResumeVersion" WHERE "id" = ? AND "status" IN ('approved', 'exported')`, context.resumeVersionId)
        : prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerResumeVersion" WHERE "status" IN ('approved', 'exported')`),
      context.resumeVersionId
        ? prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerExportLog" WHERE "entityId" = ?`, context.resumeVersionId)
        : prisma.$queryRawUnsafe<Array<{ count: number }>>(`SELECT COUNT(*) AS count FROM "CareerExportLog" WHERE "entityType" LIKE '%resume%'`),
      getEvidenceItems(context.jdTestId ? { jdTestId: context.jdTestId } : {}),
    ]);

  const profile = profileRows[0];
  const hasProfile = Boolean(profile && (profile.name.trim() || profile.summary.trim()));
  const projectCount = Number(projectCountRows[0]?.count ?? 0);
  const skillCount = Number(skillCountRows[0]?.count ?? 0);
  const jdCount = Number(jdCountRows[0]?.count ?? 0);
  const projectFitCount = Number(projectFitCountRows[0]?.count ?? 0);
  const draftCount = Number(draftCountRows[0]?.count ?? 0);
  const approvedCount = Number(approvedCountRows[0]?.count ?? 0);
  const exportCount = Number(exportCountRows[0]?.count ?? 0);
  const verifiedEvidenceCount = evidenceItems.filter((item) => item.status === "verified").length;

  const checks: CareerWorkflowCheck[] = [
    check("profile", "Career Profile is ready", hasProfile, "Profile name or summary is missing."),
    check("projects", "Project Bank has materials", projectCount > 0, "Project Bank is empty."),
    check("skills", "Skill Matrix has skills", skillCount > 0, "Skill Matrix is empty."),
    check("jd", "JD test is imported", jdCount > 0, "No JD test is available."),
    check("project-fit", "Project Fit has been reviewed", projectFitCount > 0, "Project Fit result is missing."),
    check("evidence", "Verified evidence is available", verifiedEvidenceCount > 0, "No verified evidence is available."),
    check("draft", "Resume draft exists", draftCount > 0, "Resume draft is missing."),
    check("approved", "Resume version is approved", approvedCount > 0, "No approved resume version is available."),
    check("export", "Final resume export exists", exportCount > 0, "No final resume export log is available."),
  ];

  return checks.slice(0, requiredCheckCount(toState));
}

export async function evaluateWorkflowGuard(toState: CareerWorkflowState, context: GuardContext): Promise<CareerWorkflowGuardResult> {
  const checks = await buildWorkflowChecklist(toState, context);
  const blocking = checks.filter((item) => item.severity === "blocking" && !item.passed);
  return {
    allowed: blocking.length === 0,
    checks,
    overrideRequired: blocking.length > 0,
  };
}

function requiredCheckCount(state: CareerWorkflowState) {
  switch (state) {
    case "profile_ready":
      return 1;
    case "projects_ready":
      return 2;
    case "skills_ready":
      return 3;
    case "jd_imported":
      return 4;
    case "project_fit_reviewed":
      return 5;
    case "evidence_reviewed":
      return 6;
    case "resume_drafted":
    case "diff_reviewed":
      return 7;
    case "resume_approved":
      return 8;
    case "exported":
    case "archived":
      return 9;
  }
}

function check(key: string, label: string, passed: boolean, reason: string): CareerWorkflowCheck {
  return { key, label, passed, reason: passed ? "" : reason, severity: passed ? "info" : "blocking" };
}
