import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { getEvidenceItems } from "../evidence";
import { createCareerExportLog, ensureCareerWikiSchema } from "../repository";
import { sanitizeWindowsFilename } from "../rules";
import type { CareerJdTestView, CareerProjectView } from "../types";
import { applyProjectFitOverride, classifyProjectsForJd } from "./classifier";
import { renderProjectFitReport } from "./report";
import type { ProjectFitOverrideInput, ProjectFitResult, ProjectFitRunInput } from "./types";

type ProjectFitRow = {
  id: string;
  jdTestId: string;
  projectId: string;
  targetDirection: string;
  result: unknown;
  overrideType: string;
  overrideReason: string;
  updatedAt: Date | string;
};

export async function runProjectFitClassifier(input: ProjectFitRunInput) {
  await ensureProjectFitSchema();
  const [jdTest, projects, evidenceItems] = await Promise.all([loadJdTest(input.jdTestId), loadProjects(), getEvidenceItems({ jdTestId: input.jdTestId })]);
  const targetDirection = input.targetDirection?.trim() || jdTest.targetDirection || jdTest.role;
  const results = classifyProjectsForJd({ jdTest, projects, targetDirection, evidenceItems });
  const saved: ProjectFitResult[] = [];

  for (const result of results) {
    saved.push(await upsertProjectFitResult(jdTest.id, targetDirection, result));
  }

  const exportedFile = input.exportReport ? await exportProjectFitReport(jdTest, targetDirection, saved) : undefined;
  return { jdTest, targetDirection, results: saved, exportedFile };
}

export async function getProjectFitResults(jdTestId?: string) {
  await ensureProjectFitSchema();
  const rows = jdTestId
    ? await prisma.$queryRawUnsafe<ProjectFitRow[]>(`SELECT * FROM "CareerProjectFitResult" WHERE "jdTestId" = ? ORDER BY "updatedAt" DESC`, jdTestId)
    : await prisma.$queryRawUnsafe<ProjectFitRow[]>(`SELECT * FROM "CareerProjectFitResult" ORDER BY "updatedAt" DESC`);
  return rows.map(rowToProjectFitResult);
}

export async function overrideProjectFitResult(input: ProjectFitOverrideInput) {
  await ensureProjectFitSchema();
  const rows = await prisma.$queryRawUnsafe<ProjectFitRow[]>(`SELECT * FROM "CareerProjectFitResult" WHERE "id" = ? LIMIT 1`, input.id);
  const row = rows[0];
  if (!row) throw new Error("Project fit result not found");
  const result = applyProjectFitOverride(rowToProjectFitResult(row), input);
  await prisma.$executeRawUnsafe(
    `UPDATE "CareerProjectFitResult" SET "result" = ?, "overrideType" = ?, "overrideReason" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
    JSON.stringify(stripRuntimeFields(result)),
    input.overrideType,
    input.overrideReason,
    input.id,
  );
  return { result: { ...result, id: input.id, updated_at: new Date().toISOString() } };
}

export async function exportSavedProjectFitReport(jdTestId: string) {
  await ensureProjectFitSchema();
  const jdTest = await loadJdTest(jdTestId);
  const results = await getProjectFitResults(jdTestId);
  if (!results.length) throw new Error("请先运行 Project Fit 分类。");
  const targetDirection = results[0]?.jd_test_id ? jdTest.targetDirection || jdTest.role : jdTest.targetDirection;
  const exportedFile = await exportProjectFitReport(jdTest, targetDirection, results);
  return { jdTest, targetDirection, results, exportedFile };
}

export async function ensureProjectFitSchema() {
  await ensureCareerWikiSchema();
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CareerJdTest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "company" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT '',
      "jdText" TEXT NOT NULL,
      "targetDirection" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerProjectFitResult" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "jdTestId" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      "targetDirection" TEXT NOT NULL DEFAULT '',
      "result" JSONB NOT NULL,
      "overrideType" TEXT NOT NULL DEFAULT '',
      "overrideReason" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CareerProjectFitResult_jd_project_idx" ON "CareerProjectFitResult" ("jdTestId", "projectId")`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

async function upsertProjectFitResult(jdTestId: string, targetDirection: string, result: ProjectFitResult) {
  const rows = await prisma.$queryRawUnsafe<ProjectFitRow[]>(
    `SELECT * FROM "CareerProjectFitResult" WHERE "jdTestId" = ? AND "projectId" = ? LIMIT 1`,
    jdTestId,
    result.project_id,
  );
  const existing = rows[0];
  if (existing) {
    const overrideType = existing.overrideType;
    const overrideReason = existing.overrideReason;
    const next = overrideType && isOverrideType(overrideType) && overrideReason
      ? applyProjectFitOverride(result, { overrideType, overrideReason })
      : result;
    await prisma.$executeRawUnsafe(
      `UPDATE "CareerProjectFitResult" SET "targetDirection" = ?, "result" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
      targetDirection,
      JSON.stringify(stripRuntimeFields(next)),
      existing.id,
    );
    return { ...next, id: existing.id, jd_test_id: jdTestId, updated_at: new Date().toISOString() };
  }

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerProjectFitResult" ("id", "jdTestId", "projectId", "targetDirection", "result") VALUES (?, ?, ?, ?, ?)`,
    id,
    jdTestId,
    result.project_id,
    targetDirection,
    JSON.stringify(stripRuntimeFields(result)),
  );
  return { ...result, id, jd_test_id: jdTestId, updated_at: new Date().toISOString() };
}

async function loadJdTest(id: string): Promise<CareerJdTestView> {
  const rows = await prisma.$queryRawUnsafe<Array<CareerJdTestView & { updatedAt: Date | string }>>(
    `SELECT "id", "company", "role", "source", "jdText", "targetDirection", "updatedAt" FROM "CareerJdTest" WHERE "id" = ? LIMIT 1`,
    id,
  );
  const row = rows[0];
  if (!row) throw new Error("JD test not found");
  return { ...row, updatedAt: toIso(row.updatedAt) };
}

async function loadProjects(): Promise<CareerProjectView[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      status: string;
      description: string;
      techStack: unknown;
      highlights: unknown;
      resumeBullets: unknown;
      interviewStory: string;
      updatedAt: Date | string;
    }>
  >(`SELECT "id", "name", "status", "description", "techStack", "highlights", "resumeBullets", "interviewStory", "updatedAt" FROM "CareerProject" ORDER BY "updatedAt" DESC`);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    description: row.description,
    techStack: toStringArray(row.techStack),
    highlights: toStringArray(row.highlights),
    resumeBullets: toStringArray(row.resumeBullets),
    interviewStory: row.interviewStory,
    updatedAt: toIso(row.updatedAt),
  }));
}

async function exportProjectFitReport(jdTest: CareerJdTestView, targetDirection: string, results: ProjectFitResult[]) {
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) return undefined;
  const root = path.resolve(vaultPath);
  const slug = sanitizeWindowsFilename(`${jdTest.company}-${jdTest.role}-project-fit-report`);
  const target = path.resolve(root, "08_Test_Runs", "project_fit", `${slug}.md`);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("Invalid export path");
  await mkdir(path.dirname(target), { recursive: true });
  const uniquePath = resolveUniquePath(target);
  await writeFile(uniquePath, renderProjectFitReport(jdTest, targetDirection, results), "utf8");
  await createCareerExportLog("project_fit_report", jdTest.id, uniquePath);
  return uniquePath;
}

function rowToProjectFitResult(row: ProjectFitRow): ProjectFitResult {
  const parsed = parseResult(row.result);
  const withRuntime = {
    ...parsed,
    id: row.id,
    jd_test_id: row.jdTestId,
    override_type: isOverrideType(row.overrideType) ? row.overrideType : undefined,
    override_reason: row.overrideReason || undefined,
    updated_at: toIso(row.updatedAt),
  };
  return withRuntime.override_type && withRuntime.override_reason
    ? applyProjectFitOverride(withRuntime, { overrideType: withRuntime.override_type, overrideReason: withRuntime.override_reason })
    : withRuntime;
}

function parseResult(value: unknown): ProjectFitResult {
  const record = typeof value === "string" ? safeParseJson(value) : value;
  if (!isRecord(record)) throw new Error("Invalid project fit result");
  return {
    project_id: asString(record.project_id),
    project_name: asString(record.project_name),
    fit_level: isFitLevel(record.fit_level) ? record.fit_level : "not_recommended",
    fit_score: asNumber(record.fit_score),
    keyword_score: asNumber(record.keyword_score),
    evidence_score: asNumber(record.evidence_score),
    domain_score: asNumber(record.domain_score),
    risk_score: asNumber(record.risk_score),
    matched_jd_requirements: toStringArray(record.matched_jd_requirements),
    missing_jd_requirements: toStringArray(record.missing_jd_requirements),
    supporting_evidence: toStringArray(record.supporting_evidence),
    risk_warnings: toStringArray(record.risk_warnings),
    recommended_resume_usage: isResumeUsage(record.recommended_resume_usage) ? record.recommended_resume_usage : "do_not_use",
    suggested_bullets: toStringArray(record.suggested_bullets),
    exclusion_reason: asString(record.exclusion_reason),
  };
}

function stripRuntimeFields(result: ProjectFitResult) {
  const { id, jd_test_id, updated_at, ...rest } = result;
  void id;
  void jd_test_id;
  void updated_at;
  return rest;
}

function resolveUniquePath(filePath: string) {
  if (!existsSync(filePath)) return filePath;
  const parsed = path.parse(filePath);
  const timestamp = formatTimestamp(new Date());
  let candidate = path.join(parsed.dir, `${parsed.name}-${timestamp}${parsed.ext}`);
  let index = 2;
  while (existsSync(candidate)) {
    candidate = path.join(parsed.dir, `${parsed.name}-${timestamp}-${index}${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

function isOverrideType(value: string): value is ProjectFitOverrideInput["overrideType"] {
  return value === "force_include" || value === "force_exclude" || value === "needs_review";
}

function isFitLevel(value: unknown): value is ProjectFitResult["fit_level"] {
  return value === "strong_fit" || value === "medium_fit" || value === "weak_fit" || value === "not_recommended" || value === "insufficient_evidence";
}

function isResumeUsage(value: unknown): value is ProjectFitResult["recommended_resume_usage"] {
  return value === "primary_project" || value === "supporting_project" || value === "mention_only" || value === "do_not_use" || value === "needs_manual_review";
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string") return safeParseStringArray(value);
  return [];
}

function safeParseStringArray(value: string) {
  const parsed = safeParseJson(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
