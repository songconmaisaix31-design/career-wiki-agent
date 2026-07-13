import { describe, expect, it } from "vitest";

import { createTailorRunDraft, getBaselineQualityIssues, parseBaselineMarkdown } from "./resume-tailor";
import type { ProjectFitResult } from "./project-fit/types";
import type { CareerJdTestView, CareerProfileView, CareerProjectView, CareerSkillView, ResumeBaselineView } from "./types";

const baselineMarkdown = `---
type: baseline_resume
---

# Baseline

## 个人总结
AI 应用方向候选人，关注本地知识库、自动化和项目交付。

## 技能
- TypeScript
- Next.js
- RAG

## 项目经历
- Finance-Agent-Lab: 本地验证 RAG 项目素材管理流程。

## 教育背景
- 本科，信息管理相关专业
`;

const baseline: ResumeBaselineView = {
  id: "baseline-1",
  updatedAt: "2026-07-08T00:00:00.000Z",
  ...parseBaselineMarkdown(baselineMarkdown),
};

const projects: CareerProjectView[] = [
  {
    id: "project-1",
    name: "ReviewFlow AI",
    status: "WIP / prototype",
    description: "Agent workflow prototype for review automation",
    techStack: ["TypeScript", "Agent"],
    highlights: ["完成本地 MVP 验证，仍处于 prototype 阶段"],
    resumeBullets: ["围绕 review workflow 搭建 Agent 原型，并沉淀可复盘任务链路"],
    interviewStory: "Source: wiki/projects/reviewflow-ai.md",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "project-2",
    name: "Personal Agent Project",
    status: "completed / portfolio",
    description: "Agent application from the imported baseline resume",
    techStack: ["TypeScript", "Agent"],
    highlights: ["完成可验证的 Agent 应用交付"],
    resumeBullets: ["基于真实简历记录完成 Agent 应用交付。"],
    interviewStory: "Source: baseline_resume:resume.pdf",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
];

const skills: CareerSkillView[] = [
  {
    id: "skill-1",
    name: "TypeScript",
    category: "frontend",
    level: "evidence",
    evidence: "Source: wiki/projects/reviewflow-ai.md",
    learningPriority: "medium",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
  {
    id: "skill-2",
    name: "Agent",
    category: "ai",
    level: "evidence",
    evidence: "Source: wiki/projects/reviewflow-ai.md",
    learningPriority: "high",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
];

const jdTest: CareerJdTestView = {
  id: "jd-1",
  company: "Test Company",
  role: "Agent Engineer",
  source: "manual",
  targetDirection: "Agent Engineer",
  jdText: "负责 TypeScript、Agent、Python 和 SQL 相关 AI 应用交付，要求能解释项目方案。",
  updatedAt: "2026-07-08T00:00:00.000Z",
};

const profile: CareerProfileView = {
  id: "singleton",
  name: "张三",
  targetRoles: ["Agent Engineer"],
  education: "",
  currentPosition: "AI 应用开发候选人",
  summary: "具备 AI 工作流与 Web 应用实践经验",
  strengths: ["快速交付"],
  weaknesses: [],
  updatedAt: "2026-07-08T00:00:00.000Z",
};

describe("resume tailor", () => {
  it("parses baseline markdown into stable sections", () => {
    const parsed = parseBaselineMarkdown(baselineMarkdown);

    expect(parsed.skills).toContain("TypeScript");
    expect(parsed.projects[0]).toContain("Finance-Agent-Lab");
    expect(parsed.selfSummary).toContain("AI 应用方向候选人");
    expect(parsed.selfSummary).not.toContain("baseline_resume");
  });

  it("keeps WIP status visible and does not claim production readiness", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills });

    expect(draft.riskNotes.some((note) => note.includes("ReviewFlow AI"))).toBe(true);
    expect(draft.finalResumeMarkdown).toContain("WIP / prototype");
    expect(draft.finalResumeMarkdown).not.toContain("production-ready");
    expect(draft.finalResumeMarkdown).not.toContain("暂无可验证内容");
  });

  it("keeps unsupported JD skills out of final resume evidence", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills });

    expect(draft.missingEvidence).toContain("Python");
    expect(draft.missingEvidence).toContain("SQL");
    expect(draft.targetedSkills).not.toContain("Python");
    expect(draft.finalResumeMarkdown).not.toContain("Python");
    expect(draft.finalResumeMarkdown).not.toContain("Missing Evidence");
  });

  it("rejects placeholder baselines before generating a draft", () => {
    const placeholder = { ...baseline, originalResumeText: "# Baseline\n\n## 技能\n- TODO: 请填写真实技能", workExperience: [], projects: [], skills: ["TODO"] };

    expect(getBaselineQualityIssues(placeholder)).not.toHaveLength(0);
    expect(() => createTailorRunDraft({ baseline: placeholder, jdTest, projects, skills })).toThrow(/基准简历不可用于生成/);
  });

  it("uses the candidate profile and JD as the resume direction", () => {
    const detailedBaseline = {
      ...baseline,
      workExperience: ["维护内部报表", "使用 TypeScript 与 Agent 完成 AI 工作流交付"],
      originalResumeText: baseline.originalResumeText.replace(/TODO:[^\n]+/g, "本科教育经历"),
    };

    const draft = createTailorRunDraft({ baseline: detailedBaseline, jdTest, projects, skills, profile });

    expect(draft.finalResumeMarkdown).toContain("# 张三");
    expect(draft.targetedSummary).toContain("具备 AI 工作流与 Web 应用实践经验");
    expect(draft.targetedSummary).not.toContain("面向");
    expect(draft.rewrittenWorkExperience[0]).toContain("Agent");
  });

  it("keeps structured work identity fixed while ranking evidence bullets", () => {
    const detailedBaseline = {
      ...baseline,
      workExperience: [
        "Langfang Taixin｜Data Operations (AI Automation)｜2026.05-2026.07",
        "City operations service provider for six cities.",
        "Maintained internal reports.",
        "Built Agent delivery workflows with TypeScript.",
      ],
      originalResumeText: baseline.originalResumeText.replace(/TODO:[^\n]+/g, "本科教育经历"),
    };

    const draft = createTailorRunDraft({ baseline: detailedBaseline, jdTest, projects, skills, profile });

    expect(draft.rewrittenWorkExperience.slice(0, 2)).toEqual(detailedBaseline.workExperience.slice(0, 2));
    expect(draft.rewrittenWorkExperience[2]).toContain("Agent");
  });

  it("keeps JD source annotations and the target company out of the visible headline", () => {
    const draft = createTailorRunDraft({
      baseline,
      jdTest: { ...jdTest, company: "Target Company", role: "Agent Engineer（应届/在校，职位长图）" },
      projects,
      skills,
      profile,
    });
    const headline = draft.finalResumeMarkdown.split("\n").find((line) => line.startsWith("> ")) ?? "";

    expect(headline).toBe("> Agent Engineer");
    expect(headline).not.toContain("Target Company");
    expect(headline).not.toContain("职位长图");
  });

  it("prioritizes projects imported from the baseline resume", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills, profile });

    expect(draft.selectedProjects[0]).toBe("Personal Agent Project");
    expect(draft.finalResumeMarkdown).toContain("completed / portfolio");
  });

  it("uses weak-fit projects without reintroducing do-not-use projects", () => {
    const projectFitResults = [
      fitResult("project-2", "Personal Agent Project", "weak_fit", "mention_only", 44),
      fitResult("project-1", "ReviewFlow AI", "not_recommended", "do_not_use", 18),
    ];

    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills, profile, projectFitResults });

    expect(draft.selectedProjects).toEqual(["Personal Agent Project"]);
  });

  it("removes archived projects from both Wiki selection and baseline fallback", () => {
    const archivedProject = { ...projects[0], status: "archived / do_not_use" };
    const archivedBaseline = {
      ...baseline,
      projects: ["ReviewFlow AI: old baseline project bullet"],
      originalResumeText: baseline.originalResumeText.replace("Finance-Agent-Lab: 本地验证 RAG 项目素材管理流程。", "ReviewFlow AI: old baseline project bullet"),
    };
    const draft = createTailorRunDraft({ baseline: archivedBaseline, jdTest, projects: [archivedProject, projects[1]], skills, profile });

    expect(draft.selectedProjects).not.toContain("ReviewFlow AI");
    expect(draft.finalResumeMarkdown).not.toContain("old baseline project bullet");
  });

  it("uses Chinese project display names in the resume body", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills, profile });

    expect(draft.finalResumeMarkdown).toContain("智能代码审查与交付审计系统");
    expect(draft.finalResumeMarkdown).not.toContain("- ReviewFlow AI:");
  });
});

function fitResult(
  projectId: string,
  projectName: string,
  fitLevel: ProjectFitResult["fit_level"],
  usage: ProjectFitResult["recommended_resume_usage"],
  fitScore: number,
): ProjectFitResult {
  return {
    project_id: projectId,
    project_name: projectName,
    fit_level: fitLevel,
    fit_score: fitScore,
    keyword_score: fitScore,
    evidence_score: 80,
    domain_score: fitScore,
    risk_score: 10,
    matched_jd_requirements: [],
    missing_jd_requirements: [],
    supporting_evidence: [],
    risk_warnings: [],
    recommended_resume_usage: usage,
    suggested_bullets: [],
    exclusion_reason: "",
  };
}
