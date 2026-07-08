import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { createCareerExportLog } from "./repository";
import { sanitizeWindowsFilename } from "./rules";
import { buildLearningTasksForJd } from "./resume-tailor";
import { ensureResumeTailorSchema } from "./test-harness-repository";
import type { CareerJdAnalysisView, CareerSkillView, ResumeTailorRunView } from "./types";

export async function exportTailorRuns(runIds: string[]) {
  await ensureResumeTailorSchema();
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) {
    return { configured: false, message: "未配置 CAREER_VAULT_PATH，请先设置 CareerVault 路径。", files: [] as string[] };
  }

  const [runs, skills] = await Promise.all([
    prisma.resumeTailorRun.findMany({ where: { id: { in: runIds } } }),
    prisma.careerSkill.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  const files: string[] = [];

  for (const run of runs) {
    const view = toRunView(run);
    const slug = sanitizeWindowsFilename(`${view.jdAnalysis.company}-${view.jdAnalysis.role}`);
    files.push(
      await writeMarkdown(vaultPath, ["05_Resume_Versions", `${slug}-tailored-resume.md`], view.finalResumeMarkdown, "tailored_resume", view.id),
    );
    files.push(
      await writeMarkdown(vaultPath, ["08_Test_Runs", "resume_tailor_tests", `${slug}-test-report.md`], renderReport(view), "tailor_report", view.id),
    );
    files.push(
      await writeMarkdown(vaultPath, ["03_JD_Library", `${slug}.md`], renderJdAnalysis(view.jdAnalysis), "tailor_jd_analysis", view.id),
    );
    files.push(
      await writeMarkdown(
        vaultPath,
        ["04_Learning_Tasks", `${slug}-learning-plan.md`],
        renderLearningPlan(view.jdAnalysis, skills.map(toSkillView)),
        "tailor_learning_tasks",
        view.id,
      ),
    );
  }

  return { configured: true, message: `已导出 ${files.length} 个测试文件。`, files };
}

export async function exportBaselineResume(markdown: string) {
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) return null;
  return writeMarkdown(vaultPath, ["05_Resume_Versions", "baseline_resume_2025.md"], markdown, "baseline_resume", "baseline");
}

async function writeMarkdown(vaultPath: string, relativePath: string[], markdown: string, entityType: string, entityId: string) {
  const root = path.resolve(vaultPath);
  const target = path.resolve(root, ...relativePath);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("Invalid export path");
  await mkdir(path.dirname(target), { recursive: true });
  const uniquePath = resolveUniquePath(target);
  await writeFile(uniquePath, markdown, "utf8");
  await createCareerExportLog(entityType, entityId, uniquePath);
  return uniquePath;
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

function renderReport(run: ResumeTailorRunView) {
  return [
    "---",
    `type: \"resume_tailor_test_report\"`,
    `company: ${JSON.stringify(run.jdAnalysis.company)}`,
    `role: ${JSON.stringify(run.jdAnalysis.role)}`,
    "---",
    "",
    `# ${run.jdAnalysis.company} - ${run.jdAnalysis.role} 简历测试报告`,
    "",
    `- Baseline score: ${run.comparisonReport.baselineScore}`,
    `- Tailored score: ${run.comparisonReport.tailoredScore}`,
    "",
    "## Improvement Summary",
    formatList(run.comparisonReport.improvementSummary),
    "",
    "## Changed Sections",
    formatList(run.comparisonReport.changedSections),
    "",
    "## Risk Warnings",
    formatList(run.comparisonReport.riskWarnings),
    "",
    "## Missing Evidence",
    formatList(run.missingEvidence),
    "",
    "## Next Actions",
    formatList(run.comparisonReport.nextActions),
  ].join("\n");
}

function renderJdAnalysis(analysis: CareerJdAnalysisView) {
  return [
    "---",
    `type: \"jd_analysis\"`,
    `company: ${JSON.stringify(analysis.company)}`,
    `role: ${JSON.stringify(analysis.role)}`,
    "---",
    "",
    `# ${analysis.company} - ${analysis.role}`,
    "",
    `Match score: ${analysis.matchScore}`,
    "",
    "## Required Skills",
    formatList(analysis.requiredSkills),
    "",
    "## Matched Projects",
    formatList(analysis.matchedProjects.map((project) => `[[${project}]]`)),
    "",
    "## Skill Gaps",
    formatList(analysis.skillGaps),
    "",
    "## Original JD",
    analysis.jdText,
  ].join("\n");
}

function renderLearningPlan(analysis: CareerJdAnalysisView, skills: CareerSkillView[]) {
  const tasks = buildLearningTasksForJd(analysis, skills);
  return [
    "---",
    `type: \"learning_tasks\"`,
    `company: ${JSON.stringify(analysis.company)}`,
    `role: ${JSON.stringify(analysis.role)}`,
    "---",
    "",
    `# ${analysis.company} - ${analysis.role} 学习任务`,
    "",
    ...tasks.flatMap((task) => [
      `## Day ${task.dayIndex}: ${task.title}`,
      "",
      `- Skill: ${task.relatedSkill}`,
      `- Priority: ${task.priority}`,
      `- Time: ${task.estimatedTime}`,
      `- Output: ${task.outputRequired}`,
      "",
      task.description,
      "",
    ]),
  ].join("\n");
}

function toRunView(run: {
  id: string;
  baselineId: string;
  jdTestId: string;
  jdAnalysis: unknown;
  targetedSummary: string;
  targetedSkills: unknown;
  selectedProjects: unknown;
  rewrittenProjectBullets: unknown;
  rewrittenWorkExperience: unknown;
  riskNotes: unknown;
  missingEvidence: unknown;
  finalResumeMarkdown: string;
  comparisonReport: unknown;
  updatedAt: Date;
}): ResumeTailorRunView {
  const analysis = isRecord(run.jdAnalysis) ? run.jdAnalysis : {};
  const report = isRecord(run.comparisonReport) ? run.comparisonReport : {};
  return {
    id: run.id,
    baselineId: run.baselineId,
    jdTestId: run.jdTestId,
    jdAnalysis: {
      id: typeof analysis.id === "string" ? analysis.id : run.id,
      company: typeof analysis.company === "string" ? analysis.company : "",
      role: typeof analysis.role === "string" ? analysis.role : "",
      source: typeof analysis.source === "string" ? analysis.source : "",
      jdText: typeof analysis.jdText === "string" ? analysis.jdText : "",
      responsibilities: toStringArray(analysis.responsibilities),
      requiredSkills: toStringArray(analysis.requiredSkills),
      bonusPoints: toStringArray(analysis.bonusPoints),
      matchedProjects: toStringArray(analysis.matchedProjects),
      skillGaps: toStringArray(analysis.skillGaps),
      matchScore: typeof analysis.matchScore === "number" ? analysis.matchScore : 0,
      resumeSuggestions: toStringArray(analysis.resumeSuggestions),
      interviewTips: toStringArray(analysis.interviewTips),
      updatedAt: typeof analysis.updatedAt === "string" ? analysis.updatedAt : run.updatedAt.toISOString(),
    },
    targetedSummary: run.targetedSummary,
    targetedSkills: toStringArray(run.targetedSkills),
    selectedProjects: toStringArray(run.selectedProjects),
    rewrittenProjectBullets: toStringArray(run.rewrittenProjectBullets),
    rewrittenWorkExperience: toStringArray(run.rewrittenWorkExperience),
    riskNotes: toStringArray(run.riskNotes),
    missingEvidence: toStringArray(run.missingEvidence),
    finalResumeMarkdown: run.finalResumeMarkdown,
    comparisonReport: {
      baselineScore: typeof report.baselineScore === "number" ? report.baselineScore : 0,
      tailoredScore: typeof report.tailoredScore === "number" ? report.tailoredScore : 0,
      improvementSummary: toStringArray(report.improvementSummary),
      changedSections: toStringArray(report.changedSections),
      riskWarnings: toStringArray(report.riskWarnings),
      nextActions: toStringArray(report.nextActions),
    },
    updatedAt: run.updatedAt.toISOString(),
  };
}

function toSkillView(skill: {
  id: string;
  name: string;
  category: string;
  level: string;
  evidence: string;
  learningPriority: string;
  updatedAt: Date;
}): CareerSkillView {
  return { ...skill, updatedAt: skill.updatedAt.toISOString() };
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- TODO";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

