import { describe, expect, it } from "vitest";

import { buildEvidenceSummary, buildExportChecklist, buildResumeDiff } from "./resume-version";
import type { CareerEvidenceItemView, CareerProjectView, ResumeBaselineView, ResumeTailorRunView } from "./types";

const baseline: ResumeBaselineView = {
  id: "baseline-1",
  name: "baseline",
  source: "manual",
  content: {},
  workExperience: ["负责内部自动化流程"],
  projects: ["ReviewFlow AI"],
  skills: ["TypeScript", "Agent"],
  education: ["TODO: real education"],
  selfSummary: "AI 应用方向候选人",
  originalResumeText: "TypeScript Agent ReviewFlow AI",
  updatedAt: "2026-07-08T00:00:00.000Z",
};

const projects: CareerProjectView[] = [
  {
    id: "project-1",
    name: "ReviewFlow AI",
    status: "WIP / prototype",
    description: "review agent workflow",
    techStack: ["TypeScript", "Agent"],
    highlights: ["完成本地 prototype 验证"],
    resumeBullets: ["ReviewFlow AI（项目状态：WIP / prototype）: 完成本地 prototype 验证"],
    interviewStory: "Source: wiki/projects/reviewflow-ai.md",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
];

function run(overrides: Partial<ResumeTailorRunView> = {}): ResumeTailorRunView {
  return {
    id: "run-1",
    baselineId: baseline.id,
    jdTestId: "jd-1",
    jdAnalysis: {
      id: "analysis-1",
      company: "Acme",
      role: "Agent Engineer",
      source: "manual",
      jdText: "Agent TypeScript",
      responsibilities: ["build agent"],
      requiredSkills: ["TypeScript", "Agent"],
      bonusPoints: [],
      matchedProjects: ["ReviewFlow AI"],
      skillGaps: [],
      matchScore: 80,
      resumeSuggestions: [],
      interviewTips: [],
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    targetedSummary: "AI 应用方向候选人。针对 Agent Engineer，重点呈现 Agent 与 [[ReviewFlow AI]] 的可验证经验。",
    targetedSkills: ["TypeScript", "Agent"],
    selectedProjects: ["ReviewFlow AI"],
    rewrittenProjectBullets: ["ReviewFlow AI（项目状态：WIP / prototype）: 完成本地 prototype 验证"],
    rewrittenWorkExperience: ["负责内部自动化流程；表达重点对齐 Agent Engineer 的职责要求。"],
    riskNotes: ["ReviewFlow AI 当前状态为 WIP / prototype，简历中只能描述已验证范围，不能写成 production-ready。"],
    missingEvidence: [],
    finalResumeMarkdown: [
      "# Acme - Agent Engineer 定制简历草稿",
      "## 个人总结",
      "AI 应用方向候选人。",
      "## 技能",
      "- TypeScript",
      "- Agent",
      "## 项目经历",
      "- ReviewFlow AI（项目状态：WIP / prototype）: 完成本地 prototype 验证",
      "## 工作经历",
      "- 负责内部自动化流程；表达重点对齐 Agent Engineer 的职责要求。",
      "## 教育背景",
      "- TODO: real education",
    ].join("\n"),
    comparisonReport: {
      baselineScore: 50,
      tailoredScore: 80,
      improvementSummary: [],
      changedSections: [],
      riskWarnings: [],
      nextActions: [],
    },
    updatedAt: "2026-07-08T00:00:00.000Z",
    ...overrides,
  };
}

describe("resume version validation", () => {
  it("builds section-level diff and valid wiki project evidence", () => {
    const draft = run();
    const diff = buildResumeDiff(baseline, draft);
    const evidence = buildEvidenceSummary(draft, projects);

    expect(diff.projectBullets[0]).toContain("ReviewFlow AI");
    expect(evidence.some((item) => item.section === "project_bullets" && item.evidenceSource === "wiki_project" && item.valid)).toBe(true);
  });

  it("matches localized project display names to source project evidence", () => {
    const careerWikiProject: CareerProjectView = {
      ...projects[0],
      id: "career-wiki-project",
      name: "Career Wiki Agent",
      resumeBullets: ["Career Wiki Agent: built evidence-backed resume generation"],
    };
    const draft = run({
      selectedProjects: [careerWikiProject.name],
      rewrittenProjectBullets: ["职业证据管理与简历生成平台: built evidence-backed resume generation"],
    });

    const evidence = buildEvidenceSummary(draft, [careerWikiProject]);

    expect(evidence.find((item) => item.section === "project_bullets")?.valid).toBe(true);
  });

  it("allows unresolved JD gaps when they are absent from final resume content", () => {
    const draft = run({ missingEvidence: ["Python"] });
    const diff = buildResumeDiff(baseline, draft);
    const evidence = buildEvidenceSummary(draft, projects);
    const checklist = buildExportChecklist({
      baselineId: draft.baselineId,
      jdTestId: draft.jdTestId,
      finalResumeMarkdown: draft.finalResumeMarkdown,
      diffSummary: diff,
      evidenceSummary: evidence,
      riskNotes: draft.riskNotes,
    });

    expect(checklist.find((item) => item.key === "unsupported")?.passed).toBe(true);
  });

  it("blocks final export when missing evidence exists", () => {
    const draft = run({ missingEvidence: ["Python"] });
    const diff = buildResumeDiff(baseline, draft);
    const evidence = buildEvidenceSummary(draft, projects);
    const checklist = buildExportChecklist({
      baselineId: draft.baselineId,
      jdTestId: draft.jdTestId,
      finalResumeMarkdown: `${draft.finalResumeMarkdown}\nmissing_evidence`,
      diffSummary: diff,
      evidenceSummary: evidence,
      riskNotes: draft.riskNotes,
    });

    expect(checklist.find((item) => item.key === "missing")?.passed).toBe(false);
  });

  it("blocks unsafe project overclaiming", () => {
    const draft = run({
      rewrittenProjectBullets: ["ReviewFlow AI: production-ready review automation platform"],
      finalResumeMarkdown: "ReviewFlow AI: production-ready review automation platform",
    });
    const evidence = buildEvidenceSummary(draft, projects);

    expect(evidence.find((item) => item.section === "project_bullets")?.valid).toBe(false);
  });

  it("requires verified evidence for manual project bullets", () => {
    const manualProject: CareerProjectView = { ...projects[0], interviewStory: "", resumeBullets: [] };
    const draft = run();
    const withoutEvidence = buildEvidenceSummary(draft, [manualProject]);
    const withVerifiedEvidence = buildEvidenceSummary(draft, [manualProject], [
      {
        id: "evidence-1",
        targetType: "project",
        targetId: manualProject.id,
        jdTestId: draft.jdTestId,
        evidenceType: "user_input",
        title: "Manual prototype validation",
        content: "Verified local prototype validation notes for ReviewFlow AI.",
        sourcePath: "manual_input",
        sourceExcerpt: "local note",
        confidence: 80,
        status: "verified",
        createdAt: "2026-07-08T00:00:00.000Z",
        updatedAt: "2026-07-08T00:00:00.000Z",
      } satisfies CareerEvidenceItemView,
    ]);

    expect(withoutEvidence.find((item) => item.section === "project_bullets")?.valid).toBe(false);
    expect(withVerifiedEvidence.find((item) => item.section === "project_bullets")?.evidenceSource).toBe("user_input");
    expect(withVerifiedEvidence.find((item) => item.section === "project_bullets")?.valid).toBe(true);
  });
});
