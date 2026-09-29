import { describe, expect, it } from "vitest";

import { createTailorRunDraft, getBaselineQualityIssues, parseBaselineMarkdown } from "./resume-tailor";
import type { ProjectFitResult } from "./project-fit/types";
import type { CareerEvidenceItemView, CareerJdTestView, CareerProfileView, CareerProjectView, CareerSkillView, ResumeBaselineView } from "./types";

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
    expect(draft.finalResumeMarkdown).toContain("WIP prototype");
    expect(draft.finalResumeMarkdown).not.toContain("production-ready");
    expect(draft.finalResumeMarkdown).not.toContain("暂无可验证内容");
  });

  it("keeps unsupported JD skills out of final resume evidence", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills });

    expect(draft.missingEvidence).toContain("Python");
    expect(draft.missingEvidence).toContain("SQL");
    expect(draft.targetedSkills).not.toContain("Python");
    expect(draft.targetedSkills).toContain("Agent");
    expect(draft.targetedSkills.map((skill) => skill.toLowerCase())).not.toContain("ai");
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

  it("keeps projects imported from the baseline resume eligible as direct evidence", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills, profile });

    expect(draft.selectedProjects).toContain("Personal Agent Project");
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

  it("does not turn metadata-only projects into resume experience", () => {
    const metadataOnlyProject: CareerProjectView = {
      ...projects[0],
      id: "metadata-only",
      name: "Metadata Only AI Full-stack Project",
      status: "completed",
      description: "React Next.js TypeScript Python FastAPI Agent full-stack project metadata.",
      techStack: ["React", "Next.js", "TypeScript", "Python", "FastAPI", "Agent"],
      highlights: ["D:\\AI-Workspace\\Projects\\metadata-only", "React", "Python"],
      resumeBullets: [],
      interviewStory: "Source path only; no verified resume bullet.",
    };

    const draft = createTailorRunDraft({ baseline, jdTest, projects: [metadataOnlyProject, ...projects], skills, profile });

    expect(draft.selectedProjects).not.toContain(metadataOnlyProject.name);
    expect(draft.finalResumeMarkdown).not.toContain("D:\\AI-Workspace\\Projects\\metadata-only");
  });

  it("uses Chinese project display names in the resume body", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills, profile });

    expect(draft.finalResumeMarkdown).toContain("智能代码审查与交付审计系统");
    expect(draft.finalResumeMarkdown).not.toContain("- ReviewFlow AI:");
  });

  it("keeps verified baseline skills for ATS scanning", () => {
    const detailedBaseline = {
      ...baseline,
      skills: ["TypeScript", "FastAPI", "pytest", "SQL", "Docker"],
      originalResumeText: baseline.originalResumeText.replace(/TODO:[^\n]+/g, "本科教育经历"),
    };

    const draft = createTailorRunDraft({ baseline: detailedBaseline, jdTest, projects, skills, profile });

    expect(draft.targetedSkills).toEqual(expect.arrayContaining(["TypeScript", "FastAPI", "pytest", "SQL", "Docker"]));
  });

  it("uses two complementary projects when structured work already covers delivery systems", () => {
    const detailedBaseline = {
      ...baseline,
      workExperience: [
        "Langfang Taixin｜Data Operations｜2026.05-2026.07",
        "City operations service provider.",
        "Built Python finance and collection workflows.",
      ],
      originalResumeText: baseline.originalResumeText.replace(/TODO:[^\n]+/g, "本科教育经历"),
    };
    const careerWikiProject = {
      ...projects[1],
      id: "career-wiki",
      name: "Career Wiki Agent",
      status: "MVP / partial verification",
      resumeBullets: [
        "基于 Next.js、React、TypeScript 与 Prisma 搭建本地优先的职业证据工作台，覆盖简历导入、JD 分析、项目匹配、版本管理和多格式导出。",
        "设计 evidence validation 与人工审批流程，将缺失证据、风险提示和正式导出分离，避免无证据内容进入最终简历。",
      ],
      interviewStory: "Source: wiki/projects/career-wiki-agent.md",
    };
    const dashboardProject = {
      ...projects[1],
      id: "merchant-dashboard",
      name: "Merchant Operations Dashboard",
      status: "active / production / partial",
      description: "Merchant operations dashboard built with Python, TypeScript and Web APIs.",
      techStack: ["Python", "Flask", "SQLite", "Next.js", "TypeScript", "REST API"],
      resumeBullets: [
        "整合 7 个业务模块，并将取数、入库、异常检测、持续追踪和通知固化为 5 步日常链路。",
        "在 20260714 数据链路中处理 9,794 个商户，落库 914 个最终告警和 457 条持续追踪记录。",
      ],
      interviewStory: "Source: wiki/projects/merchant-operations-dashboard.md",
    };
    const workProject = { ...projects[1], id: "finance", name: "finance-agent-lab", interviewStory: "Source: wiki/projects/finance-agent-lab.md" };

    const draft = createTailorRunDraft({ baseline: detailedBaseline, jdTest, projects: [workProject, careerWikiProject, dashboardProject], skills, profile });

    expect(draft.selectedProjects).toHaveLength(2);
    expect(draft.selectedProjects).toEqual(expect.arrayContaining(["Career Wiki Agent", "Merchant Operations Dashboard"]));
    expect(draft.finalResumeMarkdown).toContain("职业证据管理与简历生成平台（项目状态：个人项目｜本地 MVP）");
    expect(draft.finalResumeMarkdown).toContain("商户经营分析与预警平台（项目状态：业务项目｜生产验收（部分验证））");
    expect(draft.finalResumeMarkdown).toContain("9,794 个商户");
    expect(draft.finalResumeMarkdown).not.toContain("多城市财务核算与数据治理系统");
    expect(draft.finalResumeMarkdown).not.toContain("evidence validation");
  });

  it("keeps JD skills first and includes the verified AI workflow stack", () => {
    const workflowSkills: CareerSkillView[] = [
      ...skills,
      ...["Codex", "Claude Code", "AI Coding", "视频剪辑", "AIGC 内容生产"].map((name, index) => ({
        id: `workflow-skill-${index}`,
        name,
        category: "AI Development Workflow",
        level: "verified",
        evidence: "User-confirmed AI-assisted development workflow.",
        learningPriority: "medium",
        updatedAt: "2026-07-15T00:00:00.000Z",
      })),
    ];
    const workflowEvidence: CareerEvidenceItemView[] = ["Codex", "Claude Code", "AI Coding", "视频剪辑", "AIGC 内容生产"].map((name, index) => ({
      id: `workflow-evidence-${index}`,
      targetType: "skill",
      targetId: name,
      jdTestId: "",
      evidenceType: "user_input",
      title: `User-confirmed ${name} workflow`,
      content: `User confirmed ${name} as part of the AI-assisted development workflow.`,
      sourcePath: "manual_input",
      sourceExcerpt: "User confirmation",
      confidence: 90,
      status: "verified",
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    }));

    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills: workflowSkills, profile, evidenceItems: workflowEvidence });

    expect(draft.targetedSkills[0]).toBe("TypeScript");
    expect(draft.targetedSkills).toEqual(expect.arrayContaining(["Codex", "Claude Code", "Spec Coding"]));
    expect(draft.targetedSkills).toEqual(expect.arrayContaining(["视频剪辑", "AIGC 内容生产"]));
    expect(draft.targetedSkills.join(" ")).not.toContain("User confirmed");
  });

  it("keeps planned skills out of the final resume", () => {
    const plannedSkill: CareerSkillView = {
      id: "planned-langgraph",
      name: "LangGraph",
      category: "AI Orchestration",
      level: "planned",
      evidence: "Project roadmap only; not implemented.",
      learningPriority: "high",
      updatedAt: "2026-07-15T00:00:00.000Z",
    };

    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills: [...skills, plannedSkill], profile });

    expect(draft.targetedSkills).not.toContain("LangGraph");
    expect(draft.finalResumeMarkdown).not.toContain("LangGraph");
  });

  it("produces distinct evidence ordering and project choices for different JDs", () => {
    const detailedBaseline = {
      ...baseline,
      skills: ["Python", "TypeScript", "React", "Next.js", "FastAPI", "pytest", "SQL", "Docker", "Git"],
      workExperience: [
        "Langfang Taixin｜Data Operations (AI Automation)｜2026.05-2026.07",
        "City operations service provider for six cities.",
        "Built Python rules and Excel reports for 300,000 rows of finance data.",
        "Added 11 quality checks and 83 automated tests for calculation workflows.",
        "Built CDP, ADB and uiautomator2 collection workflows for Web and Android data.",
        "Separated source adapters, rule engine, quality checks and audit modules.",
      ],
      originalResumeText: baseline.originalResumeText.replace(/TODO:[^\n]+/g, "本科教育经历"),
    };
    const jdProjects: CareerProjectView[] = [
      {
        ...projects[0],
        id: "career-wiki",
        name: "Career Wiki Agent",
        status: "MVP / partial verification",
        description: "Next.js and React resume platform with Prisma, API routes and version management.",
        techStack: ["Next.js", "React", "TypeScript", "Prisma", "Vitest"],
        resumeBullets: [
          "Built a Next.js, React, TypeScript and Prisma full-stack workflow for JD analysis and resume versions.",
          "Added Vitest, TypeScript and ESLint checks for core generation and export paths.",
        ],
        interviewStory: "Source: wiki/projects/career-wiki-agent.md",
      },
      {
        ...projects[0],
        id: "review-flow",
        name: "ReviewFlow AI",
        status: "WIP / prototype",
        description: "Python CLI for deterministic code review and security audit.",
        techStack: ["Python", "Python AST", "SARIF", "GitHub Actions", "pytest"],
        resumeBullets: [
          "Built Python AST rules and SARIF output for code review and security findings.",
          "Added nine automated tests and checks for mutable GitHub Actions references.",
        ],
        interviewStory: "Source: wiki/projects/reviewflow-ai.md",
      },
    ];
    const fullStackJd = {
      ...jdTest,
      id: "jd-full-stack",
      role: "AI Full-stack Engineer",
      targetDirection: "AI Full-stack Engineer",
      jdText: "负责 React、Next.js、TypeScript、Python、FastAPI、Prisma、REST API 和数据库全栈开发。",
    };
    const qualityJd = {
      ...jdTest,
      id: "jd-quality",
      role: "AI Code Quality Engineer",
      targetDirection: "AI Code Quality Engineer",
      jdText: "负责 Python 代码审查、安全审计、Python AST、SARIF、GitHub Actions 和 pytest 自动化测试。",
    };

    const fullStackDraft = createTailorRunDraft({ baseline: detailedBaseline, jdTest: fullStackJd, projects: jdProjects, skills, profile });
    const qualityDraft = createTailorRunDraft({ baseline: detailedBaseline, jdTest: qualityJd, projects: jdProjects, skills, profile });

    expect(fullStackDraft.selectedProjects[0]).toBe("Career Wiki Agent");
    expect(qualityDraft.selectedProjects[0]).toBe("ReviewFlow AI");
    expect(fullStackDraft.targetedSkills).not.toEqual(qualityDraft.targetedSkills);
    expect(fullStackDraft.targetedSummary).not.toBe(qualityDraft.targetedSummary);
    expect(fullStackDraft.rewrittenWorkExperience[2]).not.toBe(qualityDraft.rewrittenWorkExperience[2]);
    expect(fullStackDraft.finalResumeMarkdown).not.toBe(qualityDraft.finalResumeMarkdown);
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
