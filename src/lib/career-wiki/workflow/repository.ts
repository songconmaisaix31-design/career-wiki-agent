import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { ensureCareerWikiSchema } from "../repository";
import { canTransitionWorkflow } from "./state-machine";
import { evaluateWorkflowGuard } from "./guards";
import type {
  CareerWorkflowEventView,
  CareerWorkflowRunView,
  CareerWorkflowStartInput,
  CareerWorkflowState,
  CareerWorkflowTransitionInput,
} from "./types";

type WorkflowRunRow = {
  id: string;
  name: string;
  jdTestId: string;
  resumeVersionId: string;
  currentState: string;
  status: string;
  checklist: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type WorkflowEventRow = {
  id: string;
  workflowRunId: string;
  fromState: string;
  toState: string;
  action: string;
  reason: string;
  guardResult: unknown;
  createdAt: Date | string;
};

export async function listWorkflowRuns() {
  await ensureWorkflowSchema();
  const rows = await prisma.$queryRawUnsafe<WorkflowRunRow[]>(`SELECT * FROM "CareerWorkflowRun" ORDER BY "updatedAt" DESC`);
  return rows.map(toWorkflowRunView);
}

export async function getWorkflowRun(id: string) {
  await ensureWorkflowSchema();
  const rows = await prisma.$queryRawUnsafe<WorkflowRunRow[]>(`SELECT * FROM "CareerWorkflowRun" WHERE "id" = ? LIMIT 1`, id);
  const run = rows[0];
  if (!run) throw new Error("Workflow run not found");
  const events = await prisma.$queryRawUnsafe<WorkflowEventRow[]>(`SELECT * FROM "CareerWorkflowEvent" WHERE "workflowRunId" = ? ORDER BY "createdAt" DESC`, id);
  return { run: toWorkflowRunView(run), events: events.map(toWorkflowEventView) };
}

export async function startWorkflowRun(input: CareerWorkflowStartInput) {
  await ensureWorkflowSchema();
  const id = randomUUID();
  const guardResult = await evaluateWorkflowGuard("profile_ready", input);
  const name = input.name?.trim() || "Career workflow";
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerWorkflowRun" ("id", "name", "jdTestId", "resumeVersionId", "currentState", "status", "checklist") VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    name,
    input.jdTestId || "",
    input.resumeVersionId || "",
    "profile_ready",
    "active",
    JSON.stringify(guardResult.checks),
  );
  await insertWorkflowEvent(id, "", "profile_ready", "start", input.name || "workflow started", guardResult);
  return getWorkflowRun(id);
}

export async function transitionWorkflowRun(input: CareerWorkflowTransitionInput) {
  await ensureWorkflowSchema();
  const { run } = await getWorkflowRun(input.workflowRunId);
  if (run.status === "archived") throw new Error("Archived workflow cannot transition.");
  if (!canTransitionWorkflow(run.currentState, input.toState)) {
    throw new Error(`Invalid workflow transition: ${run.currentState} -> ${input.toState}`);
  }

  const guardResult = await evaluateWorkflowGuard(input.toState, { jdTestId: run.jdTestId, resumeVersionId: run.resumeVersionId });
  if (!guardResult.allowed && !input.reason?.trim()) {
    throw new Error(`Workflow guard failed: ${guardResult.checks.filter((item) => !item.passed).map((item) => item.reason).join("; ")}`);
  }

  const nextStatus = input.toState === "archived" ? "archived" : input.toState === "exported" ? "completed" : "active";
  await prisma.$executeRawUnsafe(
    `UPDATE "CareerWorkflowRun" SET "currentState" = ?, "status" = ?, "checklist" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
    input.toState,
    nextStatus,
    JSON.stringify(guardResult.checks),
    input.workflowRunId,
  );
  await insertWorkflowEvent(input.workflowRunId, run.currentState, input.toState, "transition", input.reason || "", guardResult);
  return getWorkflowRun(input.workflowRunId);
}

export async function ensureWorkflowSchema() {
  await ensureCareerWikiSchema();
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CareerWorkflowRun" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "jdTestId" TEXT NOT NULL DEFAULT '',
      "resumeVersionId" TEXT NOT NULL DEFAULT '',
      "currentState" TEXT NOT NULL DEFAULT 'profile_ready',
      "status" TEXT NOT NULL DEFAULT 'active',
      "checklist" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerWorkflowEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "workflowRunId" TEXT NOT NULL,
      "fromState" TEXT NOT NULL DEFAULT '',
      "toState" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "reason" TEXT NOT NULL DEFAULT '',
      "guardResult" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "CareerWorkflowEvent_run_idx" ON "CareerWorkflowEvent" ("workflowRunId")`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

async function insertWorkflowEvent(
  workflowRunId: string,
  fromState: CareerWorkflowState | "",
  toState: CareerWorkflowState,
  action: string,
  reason: string,
  guardResult: unknown,
) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CareerWorkflowEvent" ("id", "workflowRunId", "fromState", "toState", "action", "reason", "guardResult") VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    workflowRunId,
    fromState,
    toState,
    action,
    reason,
    JSON.stringify(guardResult),
  );
}

function toWorkflowRunView(row: WorkflowRunRow): CareerWorkflowRunView {
  return {
    id: row.id,
    name: row.name,
    jdTestId: row.jdTestId,
    resumeVersionId: row.resumeVersionId,
    currentState: isWorkflowState(row.currentState) ? row.currentState : "profile_ready",
    status: isWorkflowStatus(row.status) ? row.status : "active",
    checklist: Array.isArray(row.checklist) ? row.checklist.filter(isWorkflowCheck) : [],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toWorkflowEventView(row: WorkflowEventRow): CareerWorkflowEventView {
  return {
    id: row.id,
    workflowRunId: row.workflowRunId,
    fromState: isWorkflowState(row.fromState) ? row.fromState : "",
    toState: isWorkflowState(row.toState) ? row.toState : "profile_ready",
    action: row.action,
    reason: row.reason,
    guardResult: isRecord(row.guardResult) && "allowed" in row.guardResult ? row.guardResult as CareerWorkflowEventView["guardResult"] : { allowed: false, checks: [], overrideRequired: false },
    createdAt: toIso(row.createdAt),
  };
}

function isWorkflowState(value: string): value is CareerWorkflowState {
  return [
    "profile_ready",
    "projects_ready",
    "skills_ready",
    "jd_imported",
    "project_fit_reviewed",
    "evidence_reviewed",
    "resume_drafted",
    "diff_reviewed",
    "resume_approved",
    "exported",
    "archived",
  ].includes(value);
}

function isWorkflowStatus(value: string): value is CareerWorkflowRunView["status"] {
  return value === "active" || value === "completed" || value === "archived";
}

function isWorkflowCheck(value: unknown): value is CareerWorkflowRunView["checklist"][number] {
  return Boolean(value && typeof value === "object" && "key" in value && "label" in value && "passed" in value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
