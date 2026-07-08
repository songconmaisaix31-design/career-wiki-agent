import type {
  CareerExportLog,
  CareerJdAnalysis,
  CareerLearningTask,
  CareerProfile,
  CareerProject,
  CareerSkill,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { analyzeCareerJd, generateSevenDayTasks } from "./rules";
import type { CareerJdInput, CareerProfileInput, CareerProjectInput, CareerSkillInput } from "./schemas";
import type {
  CareerExportLogView,
  CareerJdAnalysisView,
  CareerLearningTaskStatus,
  CareerLearningTaskView,
  CareerProfileView,
  CareerProjectView,
  CareerSkillView,
  CareerWikiData,
} from "./types";

export async function getCareerWikiData(): Promise<CareerWikiData> {
  await ensureCareerWikiSchema();
  const [profile, projects, skills, jdAnalyses, learningTasks, exportLogs] = await Promise.all([
    getCareerProfile(),
    prisma.careerProject.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerSkill.findMany({ orderBy: [{ learningPriority: "asc" }, { updatedAt: "desc" }] }),
    prisma.careerJdAnalysis.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerLearningTask.findMany({ orderBy: [{ dayIndex: "asc" }, { updatedAt: "desc" }] }),
    prisma.careerExportLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return {
    profile,
    projects: projects.map(toCareerProjectView),
    skills: skills.map(toCareerSkillView),
    jdAnalyses: jdAnalyses.map(toCareerJdAnalysisView),
    learningTasks: learningTasks.map(toCareerLearningTaskView),
    exportLogs: exportLogs.map(toCareerExportLogView),
    vaultConfigured: Boolean(process.env.CAREER_VAULT_PATH?.trim()),
  };
}

export async function getCareerProfile() {
  await ensureCareerWikiSchema();
  const profile = await prisma.careerProfile.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: "",
      targetRoles: [],
      education: "",
      currentPosition: "",
      summary: "",
      strengths: [],
      weaknesses: [],
    },
    update: {},
  });
  return toCareerProfileView(profile);
}

export async function updateCareerProfile(input: CareerProfileInput) {
  await ensureCareerWikiSchema();
  const profile = await prisma.careerProfile.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...input },
    update: input,
  });
  return toCareerProfileView(profile);
}

export async function saveCareerProject(input: CareerProjectInput) {
  await ensureCareerWikiSchema();
  const data = {
    name: input.name,
    status: input.status,
    description: input.description,
    techStack: input.techStack,
    highlights: input.highlights,
    resumeBullets: input.resumeBullets,
    interviewStory: input.interviewStory,
  };
  const project = input.id
    ? await prisma.careerProject.update({ where: { id: input.id }, data })
    : await prisma.careerProject.create({ data });
  return toCareerProjectView(project);
}

export async function saveCareerSkill(input: CareerSkillInput) {
  await ensureCareerWikiSchema();
  const data = {
    name: input.name,
    category: input.category,
    level: input.level,
    evidence: input.evidence,
    learningPriority: input.learningPriority,
  };
  const skill = input.id
    ? await prisma.careerSkill.update({ where: { id: input.id }, data })
    : await prisma.careerSkill.create({ data });
  return toCareerSkillView(skill);
}

export async function createCareerJdAnalysis(input: CareerJdInput) {
  await ensureCareerWikiSchema();
  const [projects, skills] = await Promise.all([
    prisma.careerProject.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.careerSkill.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  const analysis = analyzeCareerJd(input, projects.map(toCareerProjectView), skills.map(toCareerSkillView));
  const created = await prisma.careerJdAnalysis.create({
    data: {
      company: analysis.company,
      role: analysis.role,
      source: analysis.source,
      jdText: analysis.jdText,
      responsibilities: analysis.responsibilities,
      requiredSkills: analysis.requiredSkills,
      bonusPoints: analysis.bonusPoints,
      matchedProjects: analysis.matchedProjects,
      skillGaps: analysis.skillGaps,
      matchScore: analysis.matchScore,
      resumeSuggestions: analysis.resumeSuggestions,
      interviewTips: analysis.interviewTips,
    },
  });
  return toCareerJdAnalysisView(created);
}

export async function generateLearningTasksForAnalysis(jdAnalysisId: string) {
  await ensureCareerWikiSchema();
  const [analysis, skills] = await Promise.all([
    prisma.careerJdAnalysis.findUnique({ where: { id: jdAnalysisId } }),
    prisma.careerSkill.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  if (!analysis) throw new Error("JD analysis not found");

  const taskInputs = generateSevenDayTasks(toCareerJdAnalysisView(analysis), skills.map(toCareerSkillView));
  await prisma.careerLearningTask.deleteMany({ where: { jdAnalysisId } });
  await prisma.careerLearningTask.createMany({
    data: taskInputs.map((task) => ({ ...task, jdAnalysisId })),
  });
  const tasks = await prisma.careerLearningTask.findMany({
    where: { jdAnalysisId },
    orderBy: { dayIndex: "asc" },
  });
  return tasks.map(toCareerLearningTaskView);
}

export async function updateLearningTaskStatus(id: string, status: CareerLearningTaskStatus) {
  await ensureCareerWikiSchema();
  const task = await prisma.careerLearningTask.update({ where: { id }, data: { status } });
  return toCareerLearningTaskView(task);
}

export async function createCareerExportLog(entityType: string, entityId: string, filePath: string) {
  await ensureCareerWikiSchema();
  const log = await prisma.careerExportLog.create({ data: { entityType, entityId, filePath } });
  return toCareerExportLogView(log);
}

export async function ensureCareerWikiSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "CareerProfile" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
      "name" TEXT NOT NULL DEFAULT '',
      "targetRoles" JSONB NOT NULL,
      "education" TEXT NOT NULL DEFAULT '',
      "currentPosition" TEXT NOT NULL DEFAULT '',
      "summary" TEXT NOT NULL DEFAULT '',
      "strengths" JSONB NOT NULL,
      "weaknesses" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerProject" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "description" TEXT NOT NULL DEFAULT '',
      "techStack" JSONB NOT NULL,
      "highlights" JSONB NOT NULL,
      "resumeBullets" JSONB NOT NULL,
      "interviewStory" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerSkill" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'general',
      "level" TEXT NOT NULL DEFAULT 'learning',
      "evidence" TEXT NOT NULL DEFAULT '',
      "learningPriority" TEXT NOT NULL DEFAULT 'medium',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerJdAnalysis" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "company" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT '',
      "jdText" TEXT NOT NULL,
      "responsibilities" JSONB NOT NULL,
      "requiredSkills" JSONB NOT NULL,
      "bonusPoints" JSONB NOT NULL,
      "matchedProjects" JSONB NOT NULL,
      "skillGaps" JSONB NOT NULL,
      "matchScore" INTEGER NOT NULL DEFAULT 0,
      "resumeSuggestions" JSONB NOT NULL,
      "interviewTips" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerLearningTask" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "relatedSkill" TEXT NOT NULL DEFAULT '',
      "priority" TEXT NOT NULL DEFAULT 'medium',
      "dayIndex" INTEGER NOT NULL,
      "estimatedTime" TEXT NOT NULL DEFAULT '60 min',
      "outputRequired" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'todo',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "jdAnalysisId" TEXT NOT NULL,
      CONSTRAINT "CareerLearningTask_jdAnalysisId_fkey" FOREIGN KEY ("jdAnalysisId") REFERENCES "CareerJdAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "CareerExportLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "filePath" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

function toCareerProfileView(profile: CareerProfile): CareerProfileView {
  return {
    id: profile.id,
    name: profile.name,
    targetRoles: toStringArray(profile.targetRoles),
    education: profile.education,
    currentPosition: profile.currentPosition,
    summary: profile.summary,
    strengths: toStringArray(profile.strengths),
    weaknesses: toStringArray(profile.weaknesses),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toCareerProjectView(project: CareerProject): CareerProjectView {
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

function toCareerSkillView(skill: CareerSkill): CareerSkillView {
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

function toCareerJdAnalysisView(analysis: CareerJdAnalysis): CareerJdAnalysisView {
  return {
    id: analysis.id,
    company: analysis.company,
    role: analysis.role,
    source: analysis.source,
    jdText: analysis.jdText,
    responsibilities: toStringArray(analysis.responsibilities),
    requiredSkills: toStringArray(analysis.requiredSkills),
    bonusPoints: toStringArray(analysis.bonusPoints),
    matchedProjects: toStringArray(analysis.matchedProjects),
    skillGaps: toStringArray(analysis.skillGaps),
    matchScore: analysis.matchScore,
    resumeSuggestions: toStringArray(analysis.resumeSuggestions),
    interviewTips: toStringArray(analysis.interviewTips),
    updatedAt: analysis.updatedAt.toISOString(),
  };
}

function toCareerLearningTaskView(task: CareerLearningTask): CareerLearningTaskView {
  return {
    id: task.id,
    jdAnalysisId: task.jdAnalysisId,
    title: task.title,
    description: task.description,
    relatedSkill: task.relatedSkill,
    priority: task.priority,
    dayIndex: task.dayIndex,
    estimatedTime: task.estimatedTime,
    outputRequired: task.outputRequired,
    status: isCareerLearningTaskStatus(task.status) ? task.status : "todo",
    updatedAt: task.updatedAt.toISOString(),
  };
}

function toCareerExportLogView(log: CareerExportLog): CareerExportLogView {
  return {
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    filePath: log.filePath,
    createdAt: log.createdAt.toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function isCareerLearningTaskStatus(value: string): value is CareerLearningTaskStatus {
  return value === "todo" || value === "doing" || value === "done";
}

