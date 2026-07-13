import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { WikiImportPreview, WikiImportProjectPreview, WikiImportSkillPreview } from "./types";

const WIKI_ROOT = "D:\\AI-Workspace\\Wiki";
const WIKI_INPUTS = [
  "wiki\\index.md",
  "indexes\\project-index.md",
  "wiki\\projects",
  "wiki\\workflows",
  "logs\\changelog.md",
];

const SKILL_KEYWORDS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "SQL",
  "Prisma",
  "Docker",
  "Vercel",
  "RAG",
  "LLM",
  "Agent",
  "ADB",
  "CDP",
  "Playwright",
  "DingTalk",
  "Data Governance",
];

export async function buildWikiImportPreview(): Promise<WikiImportPreview> {
  const files = await collectWikiFiles();
  const projects = new Map<string, WikiImportProjectPreview>();
  const skills = new Map<string, WikiImportSkillPreview>();
  const warnings: string[] = [];

  for (const file of files) {
    const text = await readFile(file, "utf8").catch(() => "");
    if (!text.trim()) continue;
    const project = projectFromMarkdown(file, text);
    if (project) projects.set(project.name.toLowerCase(), project);
    for (const skill of skillsFromMarkdown(file, text)) {
      skills.set(skill.name.toLowerCase(), skill);
    }
    if (/secret|token|cookie|api[_-]?key/i.test(text)) {
      warnings.push(`跳过敏感字段内容检查，仅记录来源文件：${relativeWikiPath(file)}`);
    }
  }

  return {
    projects: [...projects.values()].sort((left, right) => left.name.localeCompare(right.name)),
    skills: [...skills.values()].sort((left, right) => left.name.localeCompare(right.name)),
    warnings,
  };
}

export function mergeStringList(left: string[], right: string[]) {
  const seen = new Set<string>();
  return [...left, ...right]
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function projectFromMarkdown(file: string, text: string): WikiImportProjectPreview | null {
  const name = extractTitle(file, text);
  if (!name || isIndexFile(file)) return null;
  const sourceFile = relativeWikiPath(file);
  const status = inferStatus(text);
  const summary = firstMeaningfulParagraph(text) || "TODO: 补充已验证项目摘要。";
  const techStack = SKILL_KEYWORDS.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
  const highlights = extractBullets(text).slice(0, 8);

  return {
    name,
    status,
    description: summary,
    techStack,
    highlights,
    resumeBullets: [],
    sourceFile,
  };
}

function skillsFromMarkdown(file: string, text: string): WikiImportSkillPreview[] {
  const sourceFile = relativeWikiPath(file);
  return SKILL_KEYWORDS.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase())).map((keyword) => ({
    name: keyword,
    category: inferSkillCategory(keyword),
    level: "evidence",
    evidence: `Source: ${sourceFile}`,
    learningPriority: "medium",
    sourceFile,
  }));
}

async function collectWikiFiles() {
  const files: string[] = [];
  for (const input of WIKI_INPUTS) {
    const target = path.join(WIKI_ROOT, input);
    if (!existsSync(target)) continue;
    const entry = await stat(target);
    if (entry.isFile() && target.endsWith(".md")) files.push(target);
    if (entry.isDirectory()) files.push(...(await collectMarkdownFiles(target)));
  }
  return files;
}

async function collectMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdownFiles(fullPath)));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files;
}

function extractTitle(file: string, text: string) {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && !/^projects?|index|catalog$/i.test(heading)) return heading;
  return path.basename(file, ".md").replace(/-/g, " ");
}

function isIndexFile(file: string) {
  const basename = path.basename(file).toLowerCase();
  return basename === "index.md" || basename.includes("catalog") || basename.includes("template");
}

function inferStatus(text: string) {
  if (/semi[-\s]?finished|半成品/i.test(text)) return "semi-finished";
  if (/\bWIP\b|进行中|开发中/i.test(text)) return "WIP";
  if (/prototype|原型/i.test(text)) return "prototype";
  if (/\bMVP\b/i.test(text)) return "MVP";
  if (/completed|已完成/i.test(text)) return "completed";
  return "draft";
}

function firstMeaningfulParagraph(text: string) {
  return text
    .split(/\r?\n\r?\n/)
    .map((part) => part.replace(/^---[\s\S]*?---/, "").trim())
    .find((part) => part && !part.startsWith("#") && !part.startsWith("|"))
    ?.slice(0, 500);
}

function extractBullets(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => !/token|cookie|api[_-]?key/i.test(line));
}

function inferSkillCategory(skill: string) {
  if (/React|Next|JavaScript|TypeScript/.test(skill)) return "frontend";
  if (/Python|Node|Prisma|SQL/.test(skill)) return "backend";
  if (/RAG|LLM|Agent/.test(skill)) return "ai";
  if (/ADB|CDP|Playwright/.test(skill)) return "automation";
  return "general";
}

function relativeWikiPath(file: string) {
  return path.relative(WIKI_ROOT, file).replace(/\\/g, "/");
}

