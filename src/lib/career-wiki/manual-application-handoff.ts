import { existsSync } from "node:fs";

import { prisma } from "@/lib/db";
import { logCareerAudit } from "./audit/audit-log";
import { ensureResumeTailorSchema } from "./test-harness-repository";

export type ManualApplicationHandoffAction = "ready_for_manual_send" | "manually_sent";

export type ManualApplicationHandoffView = {
  versionId: string;
  action: ManualApplicationHandoffAction;
  company: string;
  role: string;
  sourceUrl: string;
  resumePath: string;
  recordedAt: string;
};

export async function recordManualApplicationHandoff(input: {
  versionId: string;
  action: ManualApplicationHandoffAction;
  confirmed: boolean;
}) {
  await ensureResumeTailorSchema();
  const version = await prisma.careerResumeVersion.findUnique({ where: { id: input.versionId } });
  if (!version) throw new Error("Resume version not found");
  const jdTest = await prisma.careerJdTest.findUnique({ where: { id: version.jdTestId } });
  if (!jdTest) throw new Error("JD test not found");

  const handoff = validateManualApplicationHandoff({
    versionId: version.id,
    action: input.action,
    confirmed: input.confirmed,
    status: version.status,
    company: version.company,
    role: version.role,
    source: jdTest.source,
    exportPath: version.exportPath,
    exportFileExists: Boolean(version.exportPath.trim()) && existsSync(version.exportPath),
  });

  await logCareerAudit({
    action: `application_handoff.${input.action}`,
    entityType: "career_resume_version",
    entityId: version.id,
    summary: input.action === "manually_sent" ? `Marked application as manually sent for ${version.company} - ${version.role}` : `Prepared manual application handoff for ${version.company} - ${version.role}`,
    after: handoff,
    metadata: { sourceUrl: handoff.sourceUrl, resumePath: handoff.resumePath, userConfirmed: input.confirmed },
  });
  return handoff;
}

export function validateManualApplicationHandoff(input: {
  versionId: string;
  action: ManualApplicationHandoffAction;
  confirmed: boolean;
  status: string;
  company: string;
  role: string;
  source: string;
  exportPath: string;
  exportFileExists: boolean;
}): ManualApplicationHandoffView {
  if (input.status !== "exported") throw new Error("请先批准并导出正式简历，再准备手动投递");
  if (!input.exportPath.trim() || !input.exportFileExists) throw new Error("找不到已导出的正式简历文件");
  const sourceUrl = parseHttpUrl(input.source);
  if (!sourceUrl) throw new Error("当前 JD 没有有效的 HTTP(S) 岗位来源链接，请先在 JD 来源字段中保存岗位 URL");
  if (input.action === "manually_sent" && !input.confirmed) throw new Error("标记为已手动投递前需要明确确认");
  return {
    versionId: input.versionId,
    action: input.action,
    company: input.company,
    role: input.role,
    sourceUrl,
    resumePath: input.exportPath,
    recordedAt: new Date().toISOString(),
  };
}

export function parseHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
