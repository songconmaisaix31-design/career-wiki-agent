import { existsSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

export type CareerBackupResult = {
  backupDir: string;
  files: string[];
  warnings: string[];
};

export async function runCareerBackup(now = new Date()): Promise<CareerBackupResult> {
  const timestamp = formatTimestamp(now);
  const backupDir = path.resolve("D:\\AI-Workspace\\Archive", `career-wiki-agent-backup-${timestamp}`);
  const files: string[] = [];
  const warnings: string[] = [];
  await mkdir(backupDir, { recursive: true });

  const dbPath = path.resolve(process.cwd(), "dev.db");
  const prismaDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  const sourceDb = existsSync(dbPath) ? dbPath : existsSync(prismaDbPath) ? prismaDbPath : "";
  if (sourceDb) {
    const target = path.join(backupDir, "dev.db");
    await cp(sourceDb, target, { force: false });
    files.push(target);
  } else {
    warnings.push("Local dev.db was not found.");
  }

  const vaultPath = process.env.CAREER_VAULT_PATH?.trim() || "D:\\AI-Workspace\\CareerVault";
  if (existsSync(vaultPath)) {
    const target = path.join(backupDir, "CareerVault");
    await cp(vaultPath, target, { recursive: true, force: false });
    files.push(target);
  } else {
    warnings.push("CareerVault directory was not found.");
  }

  return { backupDir, files, warnings };
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
