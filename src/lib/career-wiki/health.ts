import { constants, existsSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";

export type CareerHealthCheck = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export async function getCareerWikiHealth() {
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = databaseUrl.startsWith("file:") ? path.resolve(process.cwd(), databaseUrl.replace(/^file:/, "")) : "";
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim() || "";
  const checks: CareerHealthCheck[] = [];

  checks.push({
    key: "database-url",
    label: "Database URL",
    status: databaseUrl ? "pass" : "fail",
    detail: databaseUrl.startsWith("file:") ? "Using local SQLite database." : "Using configured DATABASE_URL.",
  });

  checks.push({
    key: "database-file",
    label: "Database file",
    status: dbPath && existsSync(dbPath) ? "pass" : "warn",
    detail: dbPath && existsSync(dbPath) ? dbPath : "Local database file not found yet.",
  });

  checks.push(await checkDatabaseQuery());

  if (vaultPath) {
    const root = path.resolve(vaultPath);
    checks.push({
      key: "vault-configured",
      label: "Career Vault path",
      status: existsSync(root) ? "pass" : "warn",
      detail: root,
    });
    checks.push(await checkWritable(root));
  } else {
    checks.push({
      key: "vault-configured",
      label: "Career Vault path",
      status: "warn",
      detail: "CAREER_VAULT_PATH is not configured.",
    });
  }

  checks.push({
    key: "automation-boundary",
    label: "Automation boundary",
    status: "pass",
    detail: "No auto-apply, login automation, crawler, cookie, proxy, captcha, or HR messaging workflow is enabled.",
  });

  return {
    status: checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass",
    checks,
  };
}

async function checkDatabaseQuery(): Promise<CareerHealthCheck> {
  try {
    await prisma.$queryRawUnsafe(`SELECT 1`);
    return { key: "database-query", label: "Database query", status: "pass", detail: "SQLite query succeeded." };
  } catch (error) {
    return { key: "database-query", label: "Database query", status: "fail", detail: error instanceof Error ? error.message : "Database query failed." };
  }
}

async function checkWritable(root: string): Promise<CareerHealthCheck> {
  try {
    await access(root, constants.W_OK);
    return { key: "vault-writable", label: "Career Vault writable", status: "pass", detail: "Vault directory is writable." };
  } catch {
    return { key: "vault-writable", label: "Career Vault writable", status: "warn", detail: "Vault directory is not writable or does not exist." };
  }
}
