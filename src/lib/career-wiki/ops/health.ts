import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export type CareerOpsCheck = {
  key: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export async function runCareerHealthcheck() {
  process.env.DATABASE_URL ||= "file:./dev.db";
  const prisma = new PrismaClient({ log: ["error"] });
  const checks: CareerOpsCheck[] = [];
  const dbPath = resolveSqlitePath(process.env.DATABASE_URL);
  checks.push({ key: "database_file", status: dbPath && existsSync(dbPath) ? "pass" : "warn", detail: dbPath || process.env.DATABASE_URL });
  try {
    await prisma.$queryRawUnsafe(`SELECT 1`);
    checks.push({ key: "database_query", status: "pass", detail: "SELECT 1 succeeded." });
  } catch (error) {
    checks.push({ key: "database_query", status: "fail", detail: error instanceof Error ? error.message : "Database query failed." });
  } finally {
    await prisma.$disconnect();
  }

  const vaultPath = process.env.CAREER_VAULT_PATH?.trim() || "D:\\AI-Workspace\\CareerVault";
  checks.push({ key: "career_vault", status: existsSync(vaultPath) ? "pass" : "warn", detail: vaultPath });
  checks.push({ key: "automation_boundary", status: "pass", detail: "No recruiting-platform automation is enabled by this command." });
  return { status: summarize(checks), checks };
}

function summarize(checks: CareerOpsCheck[]) {
  return checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
}

function resolveSqlitePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) return "";
  const rawPath = databaseUrl.replace(/^file:/, "");
  const cwdPath = path.resolve(process.cwd(), rawPath);
  const prismaPath = path.resolve(process.cwd(), "prisma", rawPath);
  return existsSync(cwdPath) ? cwdPath : prismaPath;
}
