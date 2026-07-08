import { describe, expect, it } from "vitest";

import { createTailorRunDraft, parseBaselineMarkdown } from "./resume-tailor";
import type { CareerJdTestView, CareerProjectView, CareerSkillView, ResumeBaselineView } from "./types";

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
- TODO: 填写真实教育经历
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

    expect(draft.riskNotes[0]).toContain("ReviewFlow AI");
    expect(draft.finalResumeMarkdown).toContain("WIP / prototype");
    expect(draft.finalResumeMarkdown).not.toContain("production-ready");
  });

  it("keeps unsupported JD skills out of final resume evidence", () => {
    const draft = createTailorRunDraft({ baseline, jdTest, projects, skills });

    expect(draft.missingEvidence).toContain("Python");
    expect(draft.missingEvidence).toContain("SQL");
    expect(draft.targetedSkills).not.toContain("Python");
    expect(draft.finalResumeMarkdown).not.toContain("Python");
    expect(draft.finalResumeMarkdown).not.toContain("Missing Evidence");
  });
});
