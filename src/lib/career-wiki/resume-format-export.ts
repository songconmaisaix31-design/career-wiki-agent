import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createCareerExportLog } from "./repository";
import { assertChecklistPassed, buildExportChecklist, versionNumberFromName } from "./resume-version";
import { assertSafeRenderSchema, buildResumeRenderSchema } from "./resume-render-schema";
import { getCareerResumeVersionById, updateCareerResumeVersionStatus } from "./test-harness-repository";
import { sanitizeWindowsFilename } from "./rules";
import { renderResumeDocx } from "./renderers/docx-renderer";
import { renderResumeHtml } from "./renderers/html-renderer";
import { renderResumeJson } from "./renderers/json-renderer";
import { renderResumeMarkdown } from "./renderers/markdown-renderer";
import { renderResumePdfFallback } from "./renderers/pdf-renderer";
import type { ResumePageSize, ResumeTemplateId } from "./resume-templates/templates";

export type ResumeExportFormat = "markdown" | "json" | "html" | "docx" | "pdf";

export async function renderResumeVersion(versionId: string, format: "markdown" | "json" | "html", template: ResumeTemplateId = "modern") {
  const version = await getCareerResumeVersionById(versionId);
  const schema = buildResumeRenderSchema(version);
  assertSafeRenderSchema(schema);
  if (format === "markdown") return { format, content: renderResumeMarkdown(schema) };
  if (format === "json") return { format, content: renderResumeJson(schema, template) };
  return { format, content: renderResumeHtml(schema, template) };
}

export async function exportResumeVersionFormat({
  versionId,
  format,
  template = "modern",
}: {
  versionId: string;
  format: ResumeExportFormat;
  template?: ResumeTemplateId;
  pageSize?: ResumePageSize;
  includeInternalReports?: boolean;
}) {
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) return { configured: false, message: "未配置 CAREER_VAULT_PATH，请先设置 CareerVault 路径。", files: [] as string[] };

  const version = await getCareerResumeVersionById(versionId);
  const checklist = buildExportChecklist({
    baselineId: version.baselineId,
    jdTestId: version.jdTestId,
    finalResumeMarkdown: version.finalResumeMarkdown,
    diffSummary: version.diffSummary,
    evidenceSummary: version.evidenceSummary,
    riskNotes: version.riskNotes,
    status: version.status,
    requireApproved: true,
  });
  assertChecklistPassed(checklist);

  const schema = buildResumeRenderSchema(version);
  assertSafeRenderSchema(schema);

  const slug = sanitizeWindowsFilename(`${version.company}-${version.role}-v${versionNumberFromName(version.versionName)}`);
  const files: string[] = [];
  const baseName = `${slug}-${template}-final-resume`;

  if (format === "markdown") {
    files.push(await writeText(vaultPath, `${baseName}.md`, renderResumeMarkdown(schema), "final_resume_markdown", version.id));
  } else if (format === "json") {
    files.push(await writeText(vaultPath, `${slug}-${template}-render-schema.json`, renderResumeJson(schema, template), "final_resume_json", version.id));
  } else if (format === "html") {
    files.push(await writeText(vaultPath, `${baseName}.html`, renderResumeHtml(schema, template), "final_resume_html", version.id));
  } else if (format === "docx") {
    files.push(await writeBinary(vaultPath, `${baseName}.docx`, await renderResumeDocx(schema, template), "final_resume_docx", version.id));
  } else {
    const fallback = renderResumePdfFallback(schema, template);
    files.push(await writeText(vaultPath, `${baseName}-pdf-fallback.html`, fallback.html, "final_resume_pdf_fallback", version.id));
    files.push(await writeText(vaultPath, `${slug}-${template}-pdf-fallback-note.md`, fallback.message, "final_resume_pdf_fallback_note", version.id));
  }

  files.push(await writeText(vaultPath, `${slug}-evidence-report.md`, renderEvidenceReport(schema), "resume_evidence_report", version.id));
  files.push(await writeText(vaultPath, `${slug}-risk-report.md`, renderRiskReport(schema), "resume_risk_report", version.id));
  await updateCareerResumeVersionStatus(version.id, "exported");

  return {
    configured: true,
    message: format === "pdf" ? "PDF 暂以 HTML print fallback 导出。" : `已导出 ${format} final resume。`,
    files,
  };
}

async function writeText(vaultPath: string, fileName: string, content: string, entityType: string, entityId: string) {
  const filePath = resolveVaultFile(vaultPath, fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  const uniquePath = resolveUniquePath(filePath);
  await writeFile(uniquePath, content, "utf8");
  await createCareerExportLog(entityType, entityId, uniquePath);
  return uniquePath;
}

async function writeBinary(vaultPath: string, fileName: string, content: Buffer, entityType: string, entityId: string) {
  const filePath = resolveVaultFile(vaultPath, fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  const uniquePath = resolveUniquePath(filePath);
  await writeFile(uniquePath, content);
  await createCareerExportLog(entityType, entityId, uniquePath);
  return uniquePath;
}

function resolveVaultFile(vaultPath: string, fileName: string) {
  const root = path.resolve(vaultPath);
  const target = path.resolve(root, "05_Resume_Versions", fileName);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("Invalid export path");
  return target;
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

function renderEvidenceReport(schema: ReturnType<typeof buildResumeRenderSchema>) {
  return [
    "---",
    `type: "resume_evidence_report"`,
    `company: ${JSON.stringify(schema.profile.company)}`,
    `role: ${JSON.stringify(schema.profile.role)}`,
    "---",
    "",
    `# ${schema.profile.company} - ${schema.profile.role} Evidence Report`,
    "",
    ...schema.evidence_summary.flatMap((item) => [
      `## ${item.section}`,
      "",
      `- Source: ${item.evidenceSource}`,
      `- Source label: ${item.sourceLabel}`,
      "",
      item.content,
      "",
    ]),
  ].join("\n");
}

function renderRiskReport(schema: ReturnType<typeof buildResumeRenderSchema>) {
  return [
    "---",
    `type: "resume_risk_report"`,
    `company: ${JSON.stringify(schema.profile.company)}`,
    `role: ${JSON.stringify(schema.profile.role)}`,
    "---",
    "",
    `# ${schema.profile.company} - ${schema.profile.role} Risk Report`,
    "",
    schema.risk_notes.length ? schema.risk_notes.map((item) => `- ${item}`).join("\n") : "- 未发现额外风险备注。",
  ].join("\n");
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
