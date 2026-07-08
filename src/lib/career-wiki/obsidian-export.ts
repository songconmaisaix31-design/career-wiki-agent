import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createCareerExportLog, getCareerWikiData } from "./repository";
import { sanitizeWindowsFilename } from "./rules";
import { assertNoSensitiveContent } from "./security/sensitive-scan";
import type {
  CareerJdAnalysisView,
  CareerLearningTaskView,
  CareerProfileView,
  CareerProjectView,
  CareerSkillView,
} from "./types";

export type CareerWikiExportResult = {
  configured: boolean;
  message: string;
  files: string[];
};

export async function exportCareerWikiToObsidian(): Promise<CareerWikiExportResult> {
  const vaultPath = process.env.CAREER_VAULT_PATH?.trim();
  if (!vaultPath) {
    return {
      configured: false,
      message: "未配置 CAREER_VAULT_PATH，请在环境变量中设置 Obsidian Vault 路径。",
      files: [],
    };
  }

  const data = await getCareerWikiData();
  const writtenFiles: string[] = [];

  writtenFiles.push(
    await writeMarkdown({
      vaultPath,
      relativePath: ["00_Profile", "profile.md"],
      markdown: renderProfile(data.profile),
      entityType: "profile",
      entityId: data.profile.id,
    }),
  );

  for (const project of data.projects) {
    writtenFiles.push(
      await writeMarkdown({
        vaultPath,
        relativePath: ["01_Project_Bank", `${sanitizeWindowsFilename(project.name)}.md`],
        markdown: renderProject(project),
        entityType: "project",
        entityId: project.id,
      }),
    );
  }

  writtenFiles.push(
    await writeMarkdown({
      vaultPath,
      relativePath: ["02_Skill_Matrix", "skill_matrix.md"],
      markdown: renderSkillMatrix(data.skills),
      entityType: "skill_matrix",
      entityId: "all",
    }),
  );

  for (const analysis of data.jdAnalyses) {
    writtenFiles.push(
      await writeMarkdown({
        vaultPath,
        relativePath: ["03_JD_Library", `${sanitizeWindowsFilename(`${analysis.company}-${analysis.role}`)}.md`],
        markdown: renderJdAnalysis(analysis),
        entityType: "jd_analysis",
        entityId: analysis.id,
      }),
    );

    const tasks = data.learningTasks.filter((task) => task.jdAnalysisId === analysis.id);
    if (tasks.length) {
      writtenFiles.push(
        await writeMarkdown({
          vaultPath,
          relativePath: [
            "04_Learning_Tasks",
            `${sanitizeWindowsFilename(`${analysis.company}-${analysis.role}-learning-plan`)}.md`,
          ],
          markdown: renderLearningTasks(analysis, tasks),
          entityType: "learning_tasks",
          entityId: analysis.id,
        }),
      );
    }
  }

  return {
    configured: true,
    message: `已导出 ${writtenFiles.length} 个 Markdown 文件。`,
    files: writtenFiles,
  };
}

export function resolveUniqueMarkdownPath(filePath: string, now = new Date()) {
  if (!existsSync(filePath)) return filePath;
  const parsed = path.parse(filePath);
  const timestamp = formatTimestamp(now);
  let candidate = path.join(parsed.dir, `${parsed.name}-${timestamp}${parsed.ext}`);
  let index = 2;
  while (existsSync(candidate)) {
    candidate = path.join(parsed.dir, `${parsed.name}-${timestamp}-${index}${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

async function writeMarkdown({
  vaultPath,
  relativePath,
  markdown,
  entityType,
  entityId,
}: {
  vaultPath: string;
  relativePath: string[];
  markdown: string;
  entityType: string;
  entityId: string;
}) {
  const targetPath = resolveInsideVault(vaultPath, relativePath);
  assertNoSensitiveContent(markdown, entityType);
  await mkdir(path.dirname(targetPath), { recursive: true });
  const uniquePath = resolveUniqueMarkdownPath(targetPath);
  await writeFile(uniquePath, markdown, "utf8");
  await createCareerExportLog(entityType, entityId, uniquePath);
  return uniquePath;
}

function resolveInsideVault(vaultPath: string, relativePath: string[]) {
  const root = path.resolve(vaultPath);
  const targetPath = path.resolve(root, ...relativePath);
  if (targetPath !== root && !targetPath.startsWith(root + path.sep)) {
    throw new Error("Invalid export path");
  }
  return targetPath;
}

function renderProfile(profile: CareerProfileView) {
  return [
    frontmatter({ type: "career_profile", name: profile.name || "Career Profile", updated: profile.updatedAt }),
    `# ${profile.name || "Career Profile"}`,
    "",
    `- Target roles: ${formatInlineList(profile.targetRoles)}`,
    `- Education: ${profile.education || "未填写"}`,
    `- Current position: ${profile.currentPosition || "未填写"}`,
    "",
    "## Summary",
    profile.summary || "未填写",
    "",
    "## Strengths",
    formatList(profile.strengths),
    "",
    "## Weaknesses",
    formatList(profile.weaknesses),
  ].join("\n");
}

function renderProject(project: CareerProjectView) {
  return [
    frontmatter({ type: "career_project", name: project.name, status: project.status, updated: project.updatedAt }),
    `# ${project.name}`,
    "",
    `Status: ${project.status}`,
    "",
    "## Description",
    project.description || "未填写",
    "",
    "## Tech Stack",
    formatList(project.techStack),
    "",
    "## Highlights",
    formatList(project.highlights),
    "",
    "## Resume Bullets",
    formatList(project.resumeBullets),
    "",
    "## Interview Story",
    project.interviewStory || "未填写",
  ].join("\n");
}

function renderSkillMatrix(skills: CareerSkillView[]) {
  const rows = skills.map((skill) =>
    `| ${escapeTable(skill.name)} | ${escapeTable(skill.category)} | ${escapeTable(skill.level)} | ${escapeTable(skill.learningPriority)} | ${escapeTable(skill.evidence)} |`,
  );
  return [
    frontmatter({ type: "skill_matrix", updated: new Date().toISOString() }),
    "# Skill Matrix",
    "",
    "| Skill | Category | Level | Priority | Evidence |",
    "| --- | --- | --- | --- | --- |",
    rows.length ? rows.join("\n") : "| 未填写 | 未填写 | 未填写 | 未填写 | 未填写 |",
  ].join("\n");
}

function renderJdAnalysis(analysis: CareerJdAnalysisView) {
  return [
    frontmatter({
      type: "jd_analysis",
      company: analysis.company,
      role: analysis.role,
      source: analysis.source,
      match_score: String(analysis.matchScore),
      updated: analysis.updatedAt,
    }),
    `# ${analysis.company} - ${analysis.role}`,
    "",
    `Match score: ${analysis.matchScore}`,
    "",
    "## Responsibilities",
    formatList(analysis.responsibilities),
    "",
    "## Required Skills",
    formatList(analysis.requiredSkills),
    "",
    "## Bonus Points",
    formatList(analysis.bonusPoints),
    "",
    "## Matched Projects",
    formatList(analysis.matchedProjects.map((name) => `[[${name}]]`)),
    "",
    "## Skill Gaps",
    formatList(analysis.skillGaps),
    "",
    "## Resume Suggestions",
    formatList(analysis.resumeSuggestions),
    "",
    "## Interview Tips",
    formatList(analysis.interviewTips),
    "",
    "## Original JD",
    analysis.jdText,
  ].join("\n");
}

function renderLearningTasks(analysis: CareerJdAnalysisView, tasks: CareerLearningTaskView[]) {
  return [
    frontmatter({ type: "learning_tasks", company: analysis.company, role: analysis.role, updated: new Date().toISOString() }),
    `# ${analysis.company} - ${analysis.role} Learning Plan`,
    "",
    ...tasks
      .sort((left, right) => left.dayIndex - right.dayIndex)
      .flatMap((task) => [
        `## Day ${task.dayIndex}: ${task.title}`,
        "",
        `- Related skill: ${task.relatedSkill}`,
        `- Priority: ${task.priority}`,
        `- Estimated time: ${task.estimatedTime}`,
        `- Status: ${task.status}`,
        `- Output required: ${task.outputRequired}`,
        "",
        task.description,
        "",
      ]),
  ].join("\n");
}

function frontmatter(fields: Record<string, string>) {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${yamlString(value)}`);
  return ["---", ...lines, "---", ""].join("\n");
}

function yamlString(value: string) {
  return JSON.stringify(value.replace(/\r?\n/g, " "));
}

function formatInlineList(items: string[]) {
  return items.length ? items.join(", ") : "未填写";
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 未填写";
}

function escapeTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
