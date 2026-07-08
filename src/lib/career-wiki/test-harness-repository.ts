import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import type { CareerJdTest, Prisma, ResumeBaseline, ResumeTailorRun } from "@prisma/client";

import { prisma } from "@/lib/db";
import { buildWikiImportPreview, mergeStringList } from "./wiki-importer";
import { createTailorRunDraft, parseBaselineMarkdown } from "./resume-tailor";
import type { CareerJdTestInput, ResumeBaselineInput } from "./schemas";
import type {
  CareerJdAnalysisView,
  CareerJdTestView,
  CareerProjectView,
  CareerSkillView,
  ResumeBaselineView,
  ResumeComparisonReport,
  ResumeTailorHarnessData,
  ResumeTailorRunView,
  WikiImportPreview,
} from "./types";

const DEFAULT_BASELINE_PATH = "D:\\AI-Workspace\\CareerVault\\05_Resume_Versions\\baseline_resume_2025.md";

export async function getTestHarnessData(): Promise<ResumeTailorHarnessData> {
  await ensureResumeTailorSchema();
  const [baselines, jdTests, tailorRuns] = await Promise.all([
    prisma.resumeBaseline.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerJdTest.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.resumeTailorRun.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  return {
    baselines: baselines.map(toResumeBaselineView),
    jdTests: jdTests.map(toCareerJdTestView),
    tailorRuns: tailorRuns.map(toResumeTailorRunView),
    vaultConfigured: Boolean(process.env.CAREER_VAULT_PATH?.trim()),
  };
}

export async function previewWikiImport(): Promise<WikiImportPreview> {
  await ensureResumeTailorSchema();
  return buildWikiImportPreview();
}

export async function applyWikiImport(dryRun = false) {
  await ensureResumeTailorSchema();
  const preview = await buildWikiImportPreview();
  if (dryRun) return { preview, applied: false, projectCount: 0, skillCount: 0 };

  let projectCount = 0;
  let skillCount = 0;
  for (const project of preview.projects) {
    const existing = await prisma.careerProject.findFirst({ where: { name: project.name } });
    const sourceNote = `Source: ${project.sourceFile}`;
    if (existing) {
      await prisma.careerProject.update({
        where: { id: existing.id },
        data: {
          status: mergeStatus(existing.status, project.status),
          description: existing.description || project.description,
          techStack: mergeStringList(toStringArray(existing.techStack), project.techStack),
          highlights: mergeStringList(toStringArray(existing.highlights), project.highlights),
          resumeBullets: toStringArray(existing.resumeBullets),
          interviewStory: mergeText(existing.interviewStory, sourceNote),
        },
      });
    } else {
      await prisma.careerProject.create({
        data: {
          name: project.name,
          status: project.status,
          description: project.description,
          techStack: project.techStack,
          highlights: project.highlights,
          resumeBullets: project.resumeBullets,
          interviewStory: sourceNote,
        },
      });
    }
    projectCount += 1;
  }

  for (const skill of preview.skills) {
    const existing = await prisma.careerSkill.findFirst({ where: { name: skill.name } });
    if (existing) {
      await prisma.careerSkill.update({
        where: { id: existing.id },
        data: {
          category: existing.category || skill.category,
          level: existing.level || skill.level,
          evidence: mergeText(existing.evidence, skill.evidence),
          learningPriority: existing.learningPriority || skill.learningPriority,
        },
      });
    } else {
      await prisma.careerSkill.create({
        data: {
          name: skill.name,
          category: skill.category,
          level: skill.level,
          evidence: skill.evidence,
          learningPriority: skill.learningPriority,
        },
      });
    }
    skillCount += 1;
  }

  return { preview, applied: true, projectCount, skillCount };
}

export async function importResumeBaseline(input: ResumeBaselineInput) {
  await ensureResumeTailorSchema();
  const markdown = input.markdown?.trim() || (existsSync(DEFAULT_BASELINE_PATH) ? await readFile(DEFAULT_BASELINE_PATH, "utf8") : "");
  if (!markdown.trim()) throw new Error("请先粘贴 Markdown 简历，或创建 CareerVault/05_Resume_Versions/baseline_resume_2025.md。");
  const parsed = parseBaselineMarkdown(markdown, input.name, input.source || "manual");
  const baseline = await prisma.resumeBaseline.create({
    data: {
      ...parsed,
      content: parsed.content as Prisma.InputJsonObject,
      workExperience: parsed.workExperience,
      projects: parsed.projects,
      skills: parsed.skills,
      education: parsed.education,
    },
  });
  return toResumeBaselineView(baseline);
}

export async function createJdTest(input: CareerJdTestInput) {
  await ensureResumeTailorSchema();
  const test = await prisma.careerJdTest.create({
    data: {
      company: input.company,
      role: input.role,
      source: input.source,
      jdText: input.jdText,
      targetDirection: input.targetDirection,
    },
  });
  return toCareerJdTestView(test);
}

export async function seedPlaceholderJdTests() {
  await ensureResumeTailorSchema();
  const samples: CareerJdTestInput[] = [
    {
      company: "JD Template",
      role: "AI Application Engineer",
      source: "placeholder",
      targetDirection: "AI Application Engineer",
      jdText: "占位 JD：请替换为真实 AI Application Engineer 岗位描述。需要填写职责、技能要求、加分项和业务场景。",
    },
    {
      company: "JD Template",
      role: "FDE / Solution Engineer",
      source: "placeholder",
      targetDirection: "FDE / Solution Engineer",
      jdText: "占位 JD：请替换为真实 FDE / Solution Engineer 岗位描述。需要填写客户场景、解决方案交付、技术栈和协作要求。",
    },
    {
      company: "JD Template",
      role: "Data Automation Engineer",
      source: "placeholder",
      targetDirection: "Data Automation Engineer",
      jdText: "占位 JD：请替换为真实 Data Automation Engineer 岗位描述。需要填写数据采集、自动化流程、数据治理和交付要求。",
    },
  ];
  const created: CareerJdTestView[] = [];
  for (const sample of samples) {
    const existing = await prisma.careerJdTest.findFirst({ where: { role: sample.role, source: "placeholder" } });
    created.push(existing ? toCareerJdTestView(existing) : await createJdTest(sample));
  }
  return created;
}

export async function runResumeTailorTests(input: { baselineId?: string; jdTestIds: string[] }) {
  await ensureResumeTailorSchema();
  const baseline = input.baselineId
    ? await prisma.resumeBaseline.findUnique({ where: { id: input.baselineId } })
    : await prisma.resumeBaseline.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!baseline) throw new Error("请先导入 baseline Markdown 简历。");

  const [projects, skills, jdTests] = await Promise.all([
    prisma.careerProject.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerSkill.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerJdTest.findMany({ where: { id: { in: input.jdTestIds } } }),
  ]);
  const baselineView = toResumeBaselineView(baseline);
  const projectViews = projects.map(toCareerProjectView);
  const skillViews = skills.map(toCareerSkillView);
  const runs: ResumeTailorRunView[] = [];

  for (const jdTest of jdTests) {
    const draft = createTailorRunDraft({
      baseline: baselineView,
      jdTest: toCareerJdTestView(jdTest),
      projects: projectViews,
      skills: skillViews,
    });
    const created = await prisma.resumeTailorRun.create({
      data: {
        baselineId: baseline.id,
        jdTestId: jdTest.id,
        jdAnalysis: draft.jdAnalysis,
        targetedSummary: draft.targetedSummary,
        targetedSkills: draft.targetedSkills,
        selectedProjects: draft.selectedProjects,
        rewrittenProjectBullets: draft.rewrittenProjectBullets,
        rewrittenWorkExperience: draft.rewrittenWorkExperience,
        riskNotes: draft.riskNotes,
        missingEvidence: draft.missingEvidence,
        finalResumeMarkdown: draft.finalResumeMarkdown,
        comparisonReport: draft.comparisonReport,
      },
    });
    runs.push(toResumeTailorRunView(created));
  }
  return runs;
}

export async function ensureResumeTailorSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ResumeBaseline" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT 'manual',
      "content" JSONB NOT NULL,
      "workExperience" JSONB NOT NULL,
      "projects" JSONB NOT NULL,
      "skills" JSONB NOT NULL,
      "education" JSONB NOT NULL,
      "selfSummary" TEXT NOT NULL DEFAULT '',
      "originalResumeText" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerJdTest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "company" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT '',
      "jdText" TEXT NOT NULL,
      "targetDirection" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "ResumeTailorRun" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "jdAnalysis" JSONB NOT NULL,
      "targetedSummary" TEXT NOT NULL DEFAULT '',
      "targetedSkills" JSONB NOT NULL,
      "selectedProjects" JSONB NOT NULL,
      "rewrittenProjectBullets" JSONB NOT NULL,
      "rewrittenWorkExperience" JSONB NOT NULL,
      "riskNotes" JSONB NOT NULL,
      "missingEvidence" JSONB NOT NULL,
      "finalResumeMarkdown" TEXT NOT NULL,
      "comparisonReport" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "baselineId" TEXT NOT NULL,
      "jdTestId" TEXT NOT NULL,
      CONSTRAINT "ResumeTailorRun_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "ResumeBaseline" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ResumeTailorRun_jdTestId_fkey" FOREIGN KEY ("jdTestId") REFERENCES "CareerJdTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
}

function toResumeBaselineView(baseline: ResumeBaseline): ResumeBaselineView {
  return {
    id: baseline.id,
    name: baseline.name,
    source: baseline.source,
    content: isRecord(baseline.content) ? baseline.content : {},
    workExperience: toStringArray(baseline.workExperience),
    projects: toStringArray(baseline.projects),
    skills: toStringArray(baseline.skills),
    education: toStringArray(baseline.education),
    selfSummary: baseline.selfSummary,
    originalResumeText: baseline.originalResumeText,
    updatedAt: baseline.updatedAt.toISOString(),
  };
}

function toCareerJdTestView(test: CareerJdTest): CareerJdTestView {
  return {
    id: test.id,
    company: test.company,
    role: test.role,
    source: test.source,
    jdText: test.jdText,
    targetDirection: test.targetDirection,
    updatedAt: test.updatedAt.toISOString(),
  };
}

function toResumeTailorRunView(run: ResumeTailorRun): ResumeTailorRunView {
  const jdAnalysis = isRecord(run.jdAnalysis) ? run.jdAnalysis : {};
  return {
    id: run.id,
    baselineId: run.baselineId,
    jdTestId: run.jdTestId,
    jdAnalysis: toJdAnalysisView(jdAnalysis),
    targetedSummary: run.targetedSummary,
    targetedSkills: toStringArray(run.targetedSkills),
    selectedProjects: toStringArray(run.selectedProjects),
    rewrittenProjectBullets: toStringArray(run.rewrittenProjectBullets),
    rewrittenWorkExperience: toStringArray(run.rewrittenWorkExperience),
    riskNotes: toStringArray(run.riskNotes),
    missingEvidence: toStringArray(run.missingEvidence),
    finalResumeMarkdown: run.finalResumeMarkdown,
    comparisonReport: toComparisonReport(run.comparisonReport),
    updatedAt: run.updatedAt.toISOString(),
  };
}

function toCareerProjectView(project: {
  id: string;
  name: string;
  status: string;
  description: string;
  techStack: unknown;
  highlights: unknown;
  resumeBullets: unknown;
  interviewStory: string;
  updatedAt: Date;
}): CareerProjectView {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    description: project.description,
    techStack: toStringArray(project.techStack),
    highlights: toStringArray(project.highlights),
    resumeBullets: toStringArray(project.resumeBullets),
    interviewStory: project.interviewStory,
    updatedAt: project.updatedAt.toISOString(),
  };
}

function toCareerSkillView(skill: {
  id: string;
  name: string;
  category: string;
  level: string;
  evidence: string;
  learningPriority: string;
  updatedAt: Date;
}): CareerSkillView {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    level: skill.level,
    evidence: skill.evidence,
    learningPriority: skill.learningPriority,
    updatedAt: skill.updatedAt.toISOString(),
  };
}

function toJdAnalysisView(record: Record<string, unknown>): CareerJdAnalysisView {
  return {
    id: typeof record.id === "string" ? record.id : "tailor-run",
    company: typeof record.company === "string" ? record.company : "",
    role: typeof record.role === "string" ? record.role : "",
    source: typeof record.source === "string" ? record.source : "",
    jdText: typeof record.jdText === "string" ? record.jdText : "",
    responsibilities: toStringArray(record.responsibilities),
    requiredSkills: toStringArray(record.requiredSkills),
    bonusPoints: toStringArray(record.bonusPoints),
    matchedProjects: toStringArray(record.matchedProjects),
    skillGaps: toStringArray(record.skillGaps),
    matchScore: typeof record.matchScore === "number" ? record.matchScore : 0,
    resumeSuggestions: toStringArray(record.resumeSuggestions),
    interviewTips: toStringArray(record.interviewTips),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  };
}

function toComparisonReport(value: unknown): ResumeComparisonReport {
  const record = isRecord(value) ? value : {};
  return {
    baselineScore: typeof record.baselineScore === "number" ? record.baselineScore : 0,
    tailoredScore: typeof record.tailoredScore === "number" ? record.tailoredScore : 0,
    improvementSummary: toStringArray(record.improvementSummary),
    changedSections: toStringArray(record.changedSections),
    riskWarnings: toStringArray(record.riskWarnings),
    nextActions: toStringArray(record.nextActions),
  };
}

function mergeStatus(existing: string, incoming: string) {
  if (/wip|prototype|mvp|semi-finished/i.test(existing)) return existing;
  if (/wip|prototype|mvp|semi-finished/i.test(incoming)) return incoming;
  return existing || incoming;
}

function mergeText(existing: string, incoming: string) {
  if (!existing.trim()) return incoming;
  return existing.includes(incoming) ? existing : `${existing}\n${incoming}`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
