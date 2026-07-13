import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { ensureCareerWikiSchema } from "../repository";
import { sanitizeAuditValue } from "./sanitize";
import type { CareerAuditLogInput, CareerAuditLogView } from "./types";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  summary: string;
  beforeJson: unknown;
  afterJson: unknown;
  metadata: unknown;
  createdAt: Date | string;
};

export async function logCareerAudit(input: CareerAuditLogInput) {
  await ensureAuditSchema();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerAuditLog" ("id", "action", "entityType", "entityId", "actor", "summary", "beforeJson", "afterJson", "metadata") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.action,
    input.entityType,
    input.entityId,
    input.actor || "local_user",
    String(sanitizeAuditValue(input.summary)),
    JSON.stringify(sanitizeAuditValue(input.before ?? null)),
    JSON.stringify(sanitizeAuditValue(input.after ?? null)),
    JSON.stringify(sanitizeAuditValue(input.metadata ?? null)),
  );
  return getAuditLog(id);
}

export async function listAuditLogs(limit = 100) {
  await ensureAuditSchema();
  const rows = await prisma.$queryRawUnsafe<AuditRow[]>(
    `SELECT * FROM "CareerAuditLog" ORDER BY "createdAt" DESC LIMIT ?`,
    Math.max(1, Math.min(limit, 500)),
  );
  return rows.map(toAuditLogView);
}

export async function getAuditLog(id: string) {
  await ensureAuditSchema();
  const rows = await prisma.$queryRawUnsafe<AuditRow[]>(`SELECT * FROM "CareerAuditLog" WHERE "id" = ? LIMIT 1`, id);
  const row = rows[0];
  if (!row) throw new Error("Audit log not found");
  return toAuditLogView(row);
}

export async function ensureAuditSchema() {
  await ensureCareerWikiSchema();
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CareerAuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "actor" TEXT NOT NULL DEFAULT 'local_user',
      "summary" TEXT NOT NULL DEFAULT '',
      "beforeJson" JSONB NOT NULL,
      "afterJson" JSONB NOT NULL,
      "metadata" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CareerAuditLog_entity_idx" ON "CareerAuditLog" ("entityType", "entityId")`,
    `CREATE INDEX IF NOT EXISTS "CareerAuditLog_action_idx" ON "CareerAuditLog" ("action")`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

function toAuditLogView(row: AuditRow): CareerAuditLogView {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actor: row.actor,
    summary: row.summary,
    beforeJson: parseJsonValue(row.beforeJson),
    afterJson: parseJsonValue(row.afterJson),
    metadata: parseJsonValue(row.metadata),
    createdAt: toIso(row.createdAt),
  };
}

function parseJsonValue(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
