import type {
  CareerEvidenceItemView,
  CareerProjectView,
  ResumeBaselineView,
  ResumeDiffSummary,
  ResumeEvidenceItem,
  ResumeExportChecklistItem,
  ResumeTailorRunView,
} from "./types";
import { findSensitiveContentIssues } from "./security/sensitive-scan";

const rejectedEvidenceSources = new Set(["inferred_without_evidence", "missing_evidence", "llm_guess", "unknown"]);

export function buildResumeDiff(baseline: ResumeBaselineView, run: ResumeTailorRunView): ResumeDiffSummary {
  const tailoredSections = splitMarkdownSections(run.finalResumeMarkdown);
  const baselineSkills = new Set(baseline.skills.map(normalize));
  const tailoredSkills = extractList(tailoredSections["技能"]);
  const projectBullets = extractList(tailoredSections["项目经历"]);
  const workExperience = extractList(tailoredSections["工作经历"]);
  const education = extractList(tailoredSections["教育背景"]);
  const addedKeywords = run.jdAnalysis.requiredSkills.filter((skill) => !baselineSkills.has(normalize(skill)) && run.targetedSkills.includes(skill));

  return {
    summary: [firstNonEmpty(tailoredSections["个人总结"])].filter((item): item is string => Boolean(item)),
    skills: tailoredSkills.filter((skill) => !baselineSkills.has(normalize(skill))),
    projectBullets,
    workExperience: diffList(workExperience, baseline.workExperience),
    education: diffList(education, baseline.education),
    addedKeywords,
    removedContent: baseline.projects.filter((item) => !run.finalResumeMarkdown.includes(item)),
    rewrittenContent: [...projectBullets, ...workExperience].filter((item) => item.includes("表达重点对齐") || item.includes(":")),
    riskContent: run.riskNotes,
    unsupportedContent: run.missingEvidence,
  };
}

export function buildEvidenceSummary(run: ResumeTailorRunView, projects: CareerProjectView[], evidenceItems: CareerEvidenceItemView[] = []): ResumeEvidenceItem[] {
  const projectMap = new Map(projects.map((project) => [normalize(project.name), project]));
  const verifiedEvidence = evidenceItems.filter((item) => item.status === "verified");
  const items: ResumeEvidenceItem[] = [];

  items.push({
    section: "summary",
    content: run.targetedSummary,
    evidenceSource: "baseline_resume",
    sourceLabel: "baseline resume + selected projects",
    valid: !hasUnsafeText(run.targetedSummary),
    blockingReason: hasUnsafeText(run.targetedSummary) ? "summary contains unsafe or unsupported wording" : "",
  });

  for (const skill of run.targetedSkills) {
    items.push({
      section: "skills",
      content: skill,
      evidenceSource: "baseline_resume",
      sourceLabel: "baseline resume or CareerSkill evidence",
      valid: Boolean(skill.trim()),
      blockingReason: skill.trim() ? "" : "empty skill",
    });
  }

  for (const bullet of run.rewrittenProjectBullets) {
    const project = findProjectForBullet(bullet, projectMap);
    const manualEvidence = project ? findVerifiedEvidenceForProject(project, verifiedEvidence) : undefined;
    const inferredSource = project ? inferProjectEvidenceSource(project) : "missing_evidence";
    const evidenceSource = manualEvidence?.evidenceType ?? inferredSource;
    const hasVerifiedEvidence = Boolean(manualEvidence) || evidenceSource !== "user_input";
    const valid = Boolean(project) && hasVerifiedEvidence && !hasUnsafeText(bullet) && !isEmptyBullet(bullet);
    items.push({
      section: "project_bullets",
      content: bullet,
      evidenceSource,
      sourceLabel: manualEvidence ? `${manualEvidence.title} - ${manualEvidence.sourcePath || manualEvidence.sourceExcerpt}` : project ? project.interviewStory || `CareerProject:${project.name}` : "",
      valid,
      blockingReason: valid ? "" : buildBulletBlockingReason(bullet, project?.name, hasVerifiedEvidence),
    });
  }

  for (const item of run.rewrittenWorkExperience) {
    items.push({
      section: "work_experience",
      content: item,
      evidenceSource: "baseline_resume",
      sourceLabel: "baseline resume work_experience",
      valid: !hasUnsafeText(item) && !isEmptyBullet(item),
      blockingReason: hasUnsafeText(item) ? "work experience contains unsafe wording" : isEmptyBullet(item) ? "empty work experience bullet" : "",
    });
  }

  return items.map((item) => ({
    ...item,
    valid: item.valid && !rejectedEvidenceSources.has(item.evidenceSource),
  }));
}

export function buildExportChecklist(input: {
  baselineId: string;
  jdTestId: string;
  finalResumeMarkdown: string;
  diffSummary: ResumeDiffSummary;
  evidenceSummary: ResumeEvidenceItem[];
  riskNotes: string[];
  status?: string;
  requireApproved?: boolean;
}): ResumeExportChecklistItem[] {
  const markdown = input.finalResumeMarkdown;
  const evidenceFailures = input.evidenceSummary.filter((item) => !item.valid);
  const checklist: ResumeExportChecklistItem[] = [
    item("baseline", "已选择 baseline resume", Boolean(input.baselineId), "缺少 baseline resume"),
    item("jd", "已选择 JD", Boolean(input.jdTestId), "缺少 JD"),
    item("markdown", "已生成 final resume markdown", Boolean(markdown.trim()), "final resume 为空"),
    item("evidence", "已通过 evidence validation", evidenceFailures.length === 0, evidenceFailures.map((failure) => failure.blockingReason).join("；")),
    item(
      "unsupported",
      "没有无证据内容等待补充",
      input.diffSummary.unsupportedContent.length === 0,
      `仍有无证据内容：${input.diffSummary.unsupportedContent.join("、")}`,
    ),
    item("missing", "没有 missing evidence", !/missing evidence|missing_evidence/i.test(markdown), "final resume 包含 missing evidence"),
    item("overclaim", "没有 production-ready 误写", !/production-ready/i.test(markdown), "final resume 包含 production-ready"),
    item("secret", "没有 API Key / Cookie / token", !/api[_ -]?key|cookie|token/i.test(markdown), "final resume 可能包含敏感信息"),
    item("account", "没有招聘平台账号信息", !/boss|linkedin|智联.*账号|招聘平台账号/i.test(markdown), "final resume 可能包含招聘平台账号信息"),
    item("empty-bullets", "没有空项目 bullet", !/\n-\s*(TODO)?\s*$/im.test(markdown), "final resume 包含空 bullet"),
    item("diff", "已生成 diff report", hasDiff(input.diffSummary), "diff report 为空"),
  ];
  if (input.requireApproved) {
    checklist.unshift(item("approved", "版本已 approved", input.status === "approved" || input.status === "exported", "只有 approved 版本可以导出 final resume"));
  }
  return checklist;
}

export function assertChecklistPassed(checklist: ResumeExportChecklistItem[]) {
  const failures = checklist.filter((entry) => !entry.passed);
  if (failures.length) throw new Error(`导出前检查未通过：${failures.map((failure) => failure.reason || failure.label).join("；")}`);
}

export function versionNumberFromName(versionName: string) {
  const match = versionName.match(/v(\d+)/i);
  return match?.[1] ?? "1";
}

function item(key: string, label: string, passed: boolean, reason: string): ResumeExportChecklistItem {
  return { key, label, passed, reason: passed ? "" : reason };
}

function splitMarkdownSections(markdown: string) {
  const sections: Record<string, string> = {};
  const lines = markdown.split(/\r?\n/);
  let title = "summary";
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/)?.[1]?.trim();
    if (heading) {
      title = heading;
      sections[title] = "";
    } else {
      sections[title] = `${sections[title] ?? ""}${line}\n`;
    }
  }
  return sections;
}

function extractList(section = "") {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

function firstNonEmpty(section = "") {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("---"));
}

function diffList(next: string[], previous: string[]) {
  const previousSet = new Set(previous.map(normalize));
  return next.filter((item) => !previousSet.has(normalize(item)));
}

function findProjectForBullet(bullet: string, projectMap: Map<string, CareerProjectView>) {
  const normalizedBullet = normalize(bullet);
  return [...projectMap.values()].find((project) => normalizedBullet.includes(normalize(project.name)));
}

function inferProjectEvidenceSource(project: CareerProjectView): ResumeEvidenceItem["evidenceSource"] {
  const source = project.interviewStory.toLowerCase();
  if (source.includes("wiki/workflows")) return "wiki_workflow";
  if (source.includes("logs/changelog")) return "wiki_changelog";
  if (source.includes("source:")) return "wiki_project";
  return "user_input";
}

function findVerifiedEvidenceForProject(project: CareerProjectView, evidenceItems: CareerEvidenceItemView[]) {
  return evidenceItems.find((item) => item.targetId === project.id || item.targetId === project.name);
}

function buildBulletBlockingReason(bullet: string, projectName?: string, hasVerifiedEvidence = false) {
  if (!projectName) return "project bullet has no matching CareerProject evidence";
  if (!hasVerifiedEvidence) return "project bullet needs verified evidence";
  if (hasUnsafeText(bullet)) return "project bullet contains unsafe or unsupported wording";
  if (isEmptyBullet(bullet)) return "project bullet is empty or asks for future evidence";
  return "";
}

function isEmptyBullet(text: string) {
  return !text.trim() || /TODO|补充可验证项目证据/.test(text);
}

function hasUnsafeText(text: string) {
  if (findSensitiveContentIssues(text, { includeUnsupportedClaims: true }).length) return true;
  if (/证据尚需确认|入口尚需确认|unknown|not approved|not completed or verified|not found|production_ready|needs.*confirmation/i.test(text)) return true;
  if (hasUnsafeReviewFlowLine(text)) return true;
  return false;
}

function hasUnsafeReviewFlowLine(text: string) {
  return text
    .split(/\r?\n/)
    .some((line) => /ReviewFlow AI/i.test(line) && !/wip|prototype|semi-finished|项目状态/i.test(line));
}

function hasDiff(diff: ResumeDiffSummary) {
  return Object.values(diff).some((value) => Array.isArray(value) && value.length > 0);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
