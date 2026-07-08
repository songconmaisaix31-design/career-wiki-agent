import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { getEvidenceItems } from "../evidence";
import { getProjectFitResults } from "../project-fit/repository";
import { createCareerExportLog, ensureCareerWikiSchema } from "../repository";
import { sanitizeWindowsFilename } from "../rules";
import type { CareerEvidenceItemView } from "../types";
import type { EvidenceDuplicateGroupView, EvidenceReviewItemView, EvidenceReviewSeverity, EvidenceReviewStatus } from "./types";

type ReviewRow = {
  id: string;
  jdTestId: string;
  targetType: string;
  targetId: string;
  evidenceItemId: string;
  issueType: string;
  severity: string;
  title: string;
  detail: string;
  recommendedAction: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type DuplicateGroupRow = {
  id: string;
  jdTestId: string;
  itemIds: unknown;
  reason: string;
  status: string;
  createdAt: Date | string;
};

type JdRow = {
  id: string;
  company: string;
  role: string;
};

export async function listEvidenceReviewItems(jdTestId = "") {
  await ensureEvidenceReviewSchema();
  const rows = jdTestId
    ? await prisma.$queryRawUnsafe<ReviewRow[]>(`SELECT * FROM "CareerEvidenceReviewItem" WHERE "jdTestId" = ? ORDER BY "updatedAt" DESC`, jdTestId)
    : await prisma.$queryRawUnsafe<ReviewRow[]>(`SELECT * FROM "CareerEvidenceReviewItem" ORDER BY "updatedAt" DESC`);
  return rows.map(toReviewItemView);
}

export async function runEvidenceQualityReview(jdTestId = "") {
  await ensureEvidenceReviewSchema();
  const [evidenceItems, projectFitResults] = await Promise.all([getEvidenceItems(jdTestId ? { jdTestId } : {}), jdTestId ? getProjectFitResults(jdTestId) : getProjectFitResults()]);
  if (jdTestId) {
    await prisma.$executeRawUnsafe(`DELETE FROM "CareerEvidenceReviewItem" WHERE "jdTestId" = ? AND "status" = 'open'`, jdTestId);
    await prisma.$executeRawUnsafe(`DELETE FROM "CareerEvidenceDuplicateGroup" WHERE "jdTestId" = ? AND "status" = 'open'`, jdTestId);
  }

  const findings: Array<Omit<EvidenceReviewItemView, "id" | "createdAt" | "updatedAt" | "status">> = [];
  for (const item of evidenceItems) {
    if (item.status === "draft") {
      findings.push(reviewFinding(item, "draft_evidence", "medium", "Draft evidence needs verification.", "Mark as verified only after source review, or reject it."));
    }
    if (item.status === "verified" && (!item.sourcePath.trim() || !item.sourceExcerpt.trim())) {
      findings.push(reviewFinding(item, "weak_source", "high", "Verified evidence has weak source context.", "Add source path and source excerpt before approval."));
    }
    if (item.content.trim().length < 40) {
      findings.push(reviewFinding(item, "short_content", "medium", "Evidence content is too short to support a resume bullet.", "Add measurable context, implementation detail, or reviewed source excerpt."));
    }
  }

  const duplicateGroups = findDuplicateEvidenceGroups(evidenceItems, jdTestId);
  for (const group of duplicateGroups) {
    for (const id of group.itemIds) {
      const item = evidenceItems.find((candidate) => candidate.id === id);
      if (item) findings.push(reviewFinding(item, "duplicate_evidence", "low", "Evidence appears duplicated.", group.reason));
    }
  }

  for (const result of projectFitResults) {
    if (result.fit_level === "insufficient_evidence" || result.recommended_resume_usage === "do_not_use") {
      findings.push({
        jdTestId: result.jd_test_id || jdTestId,
        targetType: "project",
        targetId: result.project_id,
        evidenceItemId: "",
        issueType: "project_fit_insufficient",
        severity: "high",
        title: `${result.project_name}: insufficient evidence for JD fit`,
        detail: result.exclusion_reason || "Project Fit does not have enough verified evidence for this JD.",
        recommendedAction: "Add verified project evidence or keep this project out of the final resume.",
      });
    }
  }

  for (const finding of findings) await insertReviewItem(finding);
  for (const group of duplicateGroups) await insertDuplicateGroup(group);

  const items = await listEvidenceReviewItems(jdTestId);
  return {
    items,
    duplicateGroups,
    summary: buildReviewSummary(items),
  };
}

export async function updateEvidenceReviewItemStatus(id: string, status: EvidenceReviewStatus) {
  await ensureEvidenceReviewSchema();
  await prisma.$executeRawUnsafe(`UPDATE "CareerEvidenceReviewItem" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, status, id);
  const rows = await prisma.$queryRawUnsafe<ReviewRow[]>(`SELECT * FROM "CareerEvidenceReviewItem" WHERE "id" = ? LIMIT 1`, id);
  if (!rows[0]) throw new Error("Evidence review item not found");
  return toReviewItemView(rows[0]);
}

export async function assertNoBlockingEvidenceReview(jdTestId: string) {
  await ensureEvidenceReviewSchema();
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM "CareerEvidenceReviewItem" WHERE "jdTestId" = ? AND "severity" = 'high' AND "status" = 'open'`,
    jdTestId,
  );
  if (Number(rows[0]?.count ?? 0) > 0) {
    throw new Error("Evidence quality review has unresolved high-severity items.");
  }
}

export async function exportEvidenceQualityReview(jdTestId = "") {
  await ensureEvidenceReviewSchema();
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) return { configured: false, message: "未配置 CAREER_VAULT_PATH，请先设置 CareerVault 路径。", files: [] as string[] };
  const [items, jd] = await Promise.all([listEvidenceReviewItems(jdTestId), jdTestId ? loadJd(jdTestId) : null]);
  const slug = sanitizeWindowsFilename(jd ? `${jd.company}-${jd.role}-evidence-quality-review` : "career-wiki-evidence-quality-review");
  const root = path.resolve(vaultPath);
  const target = path.resolve(root, "08_Test_Runs", "evidence", `${slug}.md`);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("Invalid export path");
  await mkdir(path.dirname(target), { recursive: true });
  const uniquePath = resolveUniquePath(target);
  await writeFile(uniquePath, renderEvidenceQualityReport(jd, items), "utf8");
  await createCareerExportLog("evidence_quality_review", jdTestId || "all", uniquePath);
  return { configured: true, message: `已导出 Evidence Quality Review：${uniquePath}`, files: [uniquePath] };
}

export async function ensureEvidenceReviewSchema() {
  await ensureCareerWikiSchema();
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CareerEvidenceReviewItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "jdTestId" TEXT NOT NULL DEFAULT '',
      "targetType" TEXT NOT NULL DEFAULT '',
      "targetId" TEXT NOT NULL DEFAULT '',
      "evidenceItemId" TEXT NOT NULL DEFAULT '',
      "issueType" TEXT NOT NULL,
      "severity" TEXT NOT NULL DEFAULT 'medium',
      "title" TEXT NOT NULL,
      "detail" TEXT NOT NULL DEFAULT '',
      "recommendedAction" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'open',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerEvidenceDuplicateGroup" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "jdTestId" TEXT NOT NULL DEFAULT '',
      "itemIds" JSONB NOT NULL,
      "reason" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'open',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CareerEvidenceReviewItem_jd_idx" ON "CareerEvidenceReviewItem" ("jdTestId")`,
    `CREATE INDEX IF NOT EXISTS "CareerEvidenceReviewItem_status_idx" ON "CareerEvidenceReviewItem" ("status", "severity")`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

function reviewFinding(item: CareerEvidenceItemView, issueType: string, severity: EvidenceReviewSeverity, detail: string, recommendedAction: string) {
  return {
    jdTestId: item.jdTestId,
    targetType: item.targetType,
    targetId: item.targetId,
    evidenceItemId: item.id,
    issueType,
    severity,
    title: `${item.title}: ${issueType}`,
    detail,
    recommendedAction,
  };
}

async function insertReviewItem(input: Omit<EvidenceReviewItemView, "id" | "createdAt" | "updatedAt" | "status">) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerEvidenceReviewItem" ("id", "jdTestId", "targetType", "targetId", "evidenceItemId", "issueType", "severity", "title", "detail", "recommendedAction", "status") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    randomUUID(),
    input.jdTestId,
    input.targetType,
    input.targetId,
    input.evidenceItemId,
    input.issueType,
    input.severity,
    input.title,
    input.detail,
    input.recommendedAction,
  );
}

async function insertDuplicateGroup(group: EvidenceDuplicateGroupView) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerEvidenceDuplicateGroup" ("id", "jdTestId", "itemIds", "reason", "status") VALUES (?, ?, ?, ?, ?)`,
    group.id,
    group.jdTestId,
    JSON.stringify(group.itemIds),
    group.reason,
    group.status,
  );
}

function findDuplicateEvidenceGroups(items: CareerEvidenceItemView[], jdTestId: string): EvidenceDuplicateGroupView[] {
  const groups = new Map<string, CareerEvidenceItemView[]>();
  for (const item of items) {
    const key = normalizeEvidence(item.content || item.sourceExcerpt);
    if (key.length < 20) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      id: randomUUID(),
      jdTestId,
      itemIds: group.map((item) => item.id),
      reason: "Same normalized evidence content appears more than once.",
      status: "open",
      createdAt: new Date().toISOString(),
    }));
}

function buildReviewSummary(items: EvidenceReviewItemView[]) {
  return {
    total: items.length,
    open: items.filter((item) => item.status === "open").length,
    high: items.filter((item) => item.status === "open" && item.severity === "high").length,
    medium: items.filter((item) => item.status === "open" && item.severity === "medium").length,
    low: items.filter((item) => item.status === "open" && item.severity === "low").length,
  };
}

function renderEvidenceQualityReport(jd: JdRow | null, items: EvidenceReviewItemView[]) {
  return [
    "---",
    `type: ${JSON.stringify("evidence_quality_review")}`,
    `company: ${JSON.stringify(jd?.company ?? "Career Wiki")}`,
    `role: ${JSON.stringify(jd?.role ?? "All Evidence")}`,
    `generated_at: ${JSON.stringify(new Date().toISOString())}`,
    "---",
    "",
    `# ${jd ? `${jd.company} - ${jd.role}` : "Career Wiki"} Evidence Quality Review`,
    "",
    ...items.flatMap((item) => [
      `## ${item.title}`,
      "",
      `- Severity: ${item.severity}`,
      `- Status: ${item.status}`,
      `- Issue: ${item.issueType}`,
      `- Target: ${item.targetType} / ${item.targetId}`,
      `- Evidence item: ${item.evidenceItemId || "none"}`,
      `- Recommended action: ${item.recommendedAction}`,
      "",
      item.detail,
      "",
    ]),
  ].join("\n");
}

async function loadJd(id: string) {
  const rows = await prisma.$queryRawUnsafe<JdRow[]>(`SELECT "id", "company", "role" FROM "CareerJdTest" WHERE "id" = ? LIMIT 1`, id);
  return rows[0] ?? null;
}

function toReviewItemView(row: ReviewRow): EvidenceReviewItemView {
  return {
    id: row.id,
    jdTestId: row.jdTestId,
    targetType: row.targetType,
    targetId: row.targetId,
    evidenceItemId: row.evidenceItemId,
    issueType: row.issueType,
    severity: isSeverity(row.severity) ? row.severity : "medium",
    title: row.title,
    detail: row.detail,
    recommendedAction: row.recommendedAction,
    status: isStatus(row.status) ? row.status : "open",
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function normalizeEvidence(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[^\p{Letter}\p{Number} ]/gu, "").trim();
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

function isSeverity(value: string): value is EvidenceReviewSeverity {
  return value === "low" || value === "medium" || value === "high";
}

function isStatus(value: string): value is EvidenceReviewStatus {
  return value === "open" || value === "resolved" || value === "accepted_risk" || value === "ignored";
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
