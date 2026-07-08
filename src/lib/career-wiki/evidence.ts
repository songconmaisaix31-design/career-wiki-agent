import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { logCareerAudit } from "./audit/audit-log";
import { createCareerExportLog, ensureCareerWikiSchema } from "./repository";
import { sanitizeWindowsFilename } from "./rules";
import { assertNoSensitiveContent } from "./security/sensitive-scan";
import type { EvidenceExportInput, EvidenceInput, EvidenceUpdateInput } from "./schemas";
import type { CareerEvidenceItemView, CareerEvidenceStatus, CareerEvidenceTargetType, CareerEvidenceType, CareerJdTestView } from "./types";

type EvidenceRow = {
  id: string;
  targetType: string;
  targetId: string;
  jdTestId: string;
  evidenceType: string;
  title: string;
  content: string;
  sourcePath: string;
  sourceExcerpt: string;
  confidence: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type EvidenceFilter = {
  targetType?: string;
  targetId?: string;
  jdTestId?: string;
  status?: string;
};

export async function getEvidenceItems(filter: EvidenceFilter = {}) {
  await ensureEvidenceSchema();
  const clauses: string[] = [];
  const values: string[] = [];
  if (filter.targetType) {
    clauses.push(`"targetType" = ?`);
    values.push(filter.targetType);
  }
  if (filter.targetId) {
    clauses.push(`"targetId" = ?`);
    values.push(filter.targetId);
  }
  if (filter.jdTestId) {
    clauses.push(`("jdTestId" = ? OR "jdTestId" = '')`);
    values.push(filter.jdTestId);
  }
  if (filter.status) {
    clauses.push(`"status" = ?`);
    values.push(filter.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await prisma.$queryRawUnsafe<EvidenceRow[]>(
    `SELECT * FROM "CareerEvidenceItem" ${where} ORDER BY "updatedAt" DESC`,
    ...values,
  );
  return rows.map(toEvidenceView);
}

export async function saveEvidenceItem(input: EvidenceInput | EvidenceUpdateInput) {
  await ensureEvidenceSchema();
  assertSafeEvidence(input);
  const id = "id" in input && input.id ? input.id : randomUUID();
  const existing = await prisma.$queryRawUnsafe<EvidenceRow[]>(`SELECT * FROM "CareerEvidenceItem" WHERE "id" = ? LIMIT 1`, id);
  if (existing[0]) {
    await prisma.$executeRawUnsafe(
      `UPDATE "CareerEvidenceItem" SET "targetType" = ?, "targetId" = ?, "jdTestId" = ?, "evidenceType" = ?, "title" = ?, "content" = ?, "sourcePath" = ?, "sourceExcerpt" = ?, "confidence" = ?, "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
      input.targetType,
      input.targetId,
      input.jdTestId,
      input.evidenceType,
      input.title,
      input.content,
      input.sourcePath,
      input.sourceExcerpt,
      input.confidence,
      input.status,
      id,
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CareerEvidenceItem" ("id", "targetType", "targetId", "jdTestId", "evidenceType", "title", "content", "sourcePath", "sourceExcerpt", "confidence", "status") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.targetType,
      input.targetId,
      input.jdTestId,
      input.evidenceType,
      input.title,
      input.content,
      input.sourcePath,
      input.sourceExcerpt,
      input.confidence,
      input.status,
    );
  }
  const rows = await prisma.$queryRawUnsafe<EvidenceRow[]>(`SELECT * FROM "CareerEvidenceItem" WHERE "id" = ? LIMIT 1`, id);
  const evidenceItem = toEvidenceView(rows[0]);
  await logCareerAudit({
    action: existing[0] ? "evidence.update" : "evidence.create",
    entityType: "career_evidence_item",
    entityId: id,
    summary: `${existing[0] ? "Updated" : "Created"} evidence: ${evidenceItem.title}`,
    before: existing[0] ? toEvidenceView(existing[0]) : null,
    after: evidenceItem,
    metadata: { targetType: evidenceItem.targetType, jdTestId: evidenceItem.jdTestId, status: evidenceItem.status },
  });
  return evidenceItem;
}

export async function deleteEvidenceItem(id: string) {
  await ensureEvidenceSchema();
  const existing = await prisma.$queryRawUnsafe<EvidenceRow[]>(`SELECT * FROM "CareerEvidenceItem" WHERE "id" = ? LIMIT 1`, id);
  await prisma.$executeRawUnsafe(`DELETE FROM "CareerEvidenceItem" WHERE "id" = ?`, id);
  await logCareerAudit({
    action: "evidence.delete",
    entityType: "career_evidence_item",
    entityId: id,
    summary: existing[0] ? `Deleted evidence: ${existing[0].title}` : "Deleted evidence",
    before: existing[0] ? toEvidenceView(existing[0]) : null,
    after: null,
  });
  return { deleted: true };
}

export async function exportEvidenceReport(input: EvidenceExportInput) {
  await ensureEvidenceSchema();
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) return { configured: false, message: "未配置 CAREER_VAULT_PATH，请先设置 CareerVault 路径。", files: [] as string[] };

  const jdTest = input.jdTestId ? await loadJdTest(input.jdTestId) : null;
  const [items, targetLabels] = await Promise.all([getEvidenceItems(input.jdTestId ? { jdTestId: input.jdTestId } : {}), loadTargetLabels()]);
  const slug = sanitizeWindowsFilename(jdTest ? `${jdTest.company}-${jdTest.role}-evidence-report` : "career-wiki-evidence-report");
  const root = path.resolve(vaultPath);
  const target = path.resolve(root, "08_Test_Runs", "evidence", `${slug}.md`);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("Invalid export path");
  await mkdir(path.dirname(target), { recursive: true });
  const uniquePath = resolveUniquePath(target);
  const markdown = renderEvidenceReport(jdTest, items, targetLabels);
  assertNoSensitiveContent(markdown, "Evidence report");
  await writeFile(uniquePath, markdown, "utf8");
  await createCareerExportLog("evidence_report", input.jdTestId || "all", uniquePath);
  return { configured: true, message: `已导出 Evidence Report：${uniquePath}`, files: [uniquePath] };
}

export async function ensureEvidenceSchema() {
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
    `CREATE TABLE IF NOT EXISTS "CareerEvidenceItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "jdTestId" TEXT NOT NULL DEFAULT '',
      "evidenceType" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "sourcePath" TEXT NOT NULL DEFAULT '',
      "sourceExcerpt" TEXT NOT NULL DEFAULT '',
      "confidence" INTEGER NOT NULL DEFAULT 70,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CareerEvidenceItem_target_idx" ON "CareerEvidenceItem" ("targetType", "targetId")`,
    `CREATE INDEX IF NOT EXISTS "CareerEvidenceItem_jd_idx" ON "CareerEvidenceItem" ("jdTestId")`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
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

async function loadTargetLabels() {
  const [projects, skills] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ id: string; name: string }>>(`SELECT "id", "name" FROM "CareerProject"`),
    prisma.$queryRawUnsafe<Array<{ id: string; name: string }>>(`SELECT "id", "name" FROM "CareerSkill"`),
  ]);
  return new Map([...projects, ...skills].map((item) => [item.id, item.name]));
}

function renderEvidenceReport(jdTest: CareerJdTestView | null, items: CareerEvidenceItemView[], targetLabels: Map<string, string>) {
  return [
    "---",
    `type: ${JSON.stringify("evidence_report")}`,
    `company: ${JSON.stringify(jdTest?.company ?? "Career Wiki")}`,
    `role: ${JSON.stringify(jdTest?.role ?? "All Evidence")}`,
    `generated_at: ${JSON.stringify(new Date().toISOString())}`,
    "---",
    "",
    `# ${jdTest ? `${jdTest.company} - ${jdTest.role}` : "Career Wiki"} Evidence Report`,
    "",
    ...items.flatMap((item) => [
      `## ${item.title}`,
      "",
      `- Target: ${item.targetType} / ${targetLabels.get(item.targetId) ?? item.targetId}`,
      `- Project/Skill link: [[${targetLabels.get(item.targetId) ?? item.targetId}]]`,
      `- JD: ${jdTest ? `${jdTest.company} - ${jdTest.role}` : item.jdTestId || "global"}`,
      `- Evidence type: ${item.evidenceType}`,
      `- Evidence status: ${item.status}`,
      `- Source path: ${item.sourcePath || "manual_input"}`,
      `- Source excerpt: ${item.sourceExcerpt || "None"}`,
      `- Manual input: ${item.evidenceType === "user_input" || item.evidenceType === "external_note" ? "yes" : "no"}`,
      `- Enters resume: ${item.status === "verified" ? "yes" : "no"}`,
      `- Risk: ${item.status === "draft" ? "pending review" : item.status === "rejected" ? "rejected evidence" : "verified evidence"}`,
      "",
      item.content,
      "",
    ]),
  ].join("\n");
}

function assertSafeEvidence(input: EvidenceInput | EvidenceUpdateInput) {
  const text = [input.title, input.content, input.sourcePath, input.sourceExcerpt].join("\n");
  assertNoSensitiveContent(text, "Evidence content");
  if (!input.sourcePath.trim() && !input.sourceExcerpt.trim()) throw new Error("每条证据必须保留来源说明。");
}

function toEvidenceView(row: EvidenceRow): CareerEvidenceItemView {
  return {
    id: row.id,
    targetType: isTargetType(row.targetType) ? row.targetType : "project",
    targetId: row.targetId,
    jdTestId: row.jdTestId,
    evidenceType: isEvidenceType(row.evidenceType) ? row.evidenceType : "user_input",
    title: row.title,
    content: row.content,
    sourcePath: row.sourcePath,
    sourceExcerpt: row.sourceExcerpt,
    confidence: Number(row.confidence) || 0,
    status: isEvidenceStatus(row.status) ? row.status : "draft",
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
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

function isTargetType(value: string): value is CareerEvidenceTargetType {
  return value === "project" || value === "skill" || value === "bullet" || value === "work_experience" || value === "education";
}

function isEvidenceType(value: string): value is CareerEvidenceType {
  return value === "wiki_project" || value === "wiki_workflow" || value === "wiki_changelog" || value === "baseline_resume" || value === "user_input" || value === "external_note";
}

function isEvidenceStatus(value: string): value is CareerEvidenceStatus {
  return value === "draft" || value === "verified" || value === "rejected";
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
