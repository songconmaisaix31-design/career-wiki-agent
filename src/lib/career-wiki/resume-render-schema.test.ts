import { describe, expect, it } from "vitest";

import { assertSafeRenderSchema, buildResumeRenderSchema } from "./resume-render-schema";
import type { CareerResumeVersionView } from "./types";

describe("resume render schema", () => {
  it("filters unsafe final resume content before rendering", () => {
    const schema = buildResumeRenderSchema({
      ...baseVersion,
      finalResumeMarkdown: [
        "# 张三",
        "> 求职方向：AI Engineer · 目标公司：Acme",
        "",
        "## 个人总结",
        "面向 AI Engineer 的候选人。",
        "",
        "## 技能",
        "- TypeScript",
        "- Missing Evidence: Kubernetes",
        "",
        "## 项目经历",
        "- ReviewFlow AI（项目状态：WIP / prototype）: 完成原型验证。",
        "- Unsafe Project: production-ready platform",
      ].join("\n"),
    });

    expect(JSON.stringify(schema.skills)).not.toMatch(/Missing Evidence/i);
    expect(JSON.stringify(schema.projects)).not.toMatch(/production-ready/i);
    expect(schema.projects[0]?.status).toContain("WIP");
    expect(schema.profile.name).toBe("张三");
    expect(schema.profile.headline).toContain("AI Engineer");
    expect(() => assertSafeRenderSchema(schema)).not.toThrow();
  });

  it("does not treat an old target heading as the candidate name", () => {
    const schema = buildResumeRenderSchema({
      ...baseVersion,
      finalResumeMarkdown: [
        "# Acme - AI Engineer 定制简历草稿",
        "> 求职方向：AI Engineer",
        "",
        "## 个人总结",
        "具备真实的 AI 应用项目经验。",
        "",
        "## 项目经历",
        "- tests: local control-plane files",
      ].join("\n"),
    });

    expect(schema.profile.name).toBe("候选人");
    expect(schema.summary).toBe("具备真实的 AI 应用项目经验。");
    expect(schema.projects).toHaveLength(0);
  });

  it("groups Chinese-colon bullets under one project entry", () => {
    const schema = buildResumeRenderSchema({
      ...baseVersion,
      finalResumeMarkdown: [
        "# 王聪锐",
        "> AI 应用开发",
        "",
        "## 职业概述",
        "具备可验证的 AI 应用项目经验。",
        "",
        "## 项目经历",
        "- 职业证据与简历智能体：设计证据校验流程。",
        "- 职业证据与简历智能体：实现人工审批状态机。",
        "- 职业证据与简历智能体：建立自动化测试链路。",
      ].join("\n"),
    });

    expect(schema.projects).toHaveLength(1);
    expect(schema.projects[0]?.name).toBe("职业证据与简历智能体");
    expect(schema.projects[0]?.bullets).toHaveLength(3);
  });
});

const baseVersion: CareerResumeVersionView = {
  id: "version-1",
  baselineId: "baseline-1",
  jdTestId: "jd-1",
  tailorRunId: "run-1",
  company: "Acme",
  role: "AI Engineer",
  versionName: "v1",
  status: "approved",
  finalResumeMarkdown: "",
  diffSummary: {
    summary: [],
    skills: [],
    projectBullets: [],
    workExperience: [],
    education: [],
    addedKeywords: [],
    removedContent: [],
    rewrittenContent: [],
    riskContent: [],
    unsupportedContent: [],
  },
  evidenceSummary: [],
  riskNotes: ["ReviewFlow AI 只能按 WIP / prototype 表述，不能夸大。"],
  writingQuality: { score: 100, passed: true, blockingCount: 0, warningCount: 0, findings: [] },
  exportPath: "",
  checklist: [],
  updatedAt: new Date("2026-07-08T00:00:00Z").toISOString(),
};
