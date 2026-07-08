import { describe, expect, it } from "vitest";

import { assertSafeRenderSchema, buildResumeRenderSchema } from "./resume-render-schema";
import type { CareerResumeVersionView } from "./types";

describe("resume render schema", () => {
  it("filters unsafe final resume content before rendering", () => {
    const schema = buildResumeRenderSchema({
      ...baseVersion,
      finalResumeMarkdown: [
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
    expect(() => assertSafeRenderSchema(schema)).not.toThrow();
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
  exportPath: "",
  checklist: [],
  updatedAt: new Date("2026-07-08T00:00:00Z").toISOString(),
};
