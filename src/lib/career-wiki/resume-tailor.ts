import type {
  CareerJdAnalysisView,
  CareerJdTestView,
  CareerProjectView,
  CareerSkillView,
  ResumeBaselineView,
  ResumeComparisonReport,
  ResumeTailorRunView,
} from "./types";
import { filterProjectsForResume } from "./project-fit/classifier";
import type { ProjectFitResult } from "./project-fit/types";
import { analyzeCareerJd, generateSevenDayTasks } from "./rules";

export function parseBaselineMarkdown(markdown: string, name = "baseline_resume_2025", source = "manual"): Omit<ResumeBaselineView, "id" | "updatedAt"> {
  const body = stripFrontmatter(markdown);
  const sections = splitMarkdownSections(body);
  const workExperience = sectionItems(sections, ["工作经历", "work experience", "experience"]);
  const projects = sectionItems(sections, ["项目经历", "projects", "project experience"]);
  const skills = sectionItems(sections, ["技能", "skills", "专业技能"]);
  const education = sectionItems(sections, ["教育", "education", "教育背景"]);
  const selfSummary = findSection(sections, ["自我总结", "个人总结", "summary", "profile"]) || firstParagraph(body);

  return {
    name,
    source,
    content: Object.fromEntries(sections.map((section) => [section.title, section.body])),
    workExperience,
    projects,
    skills,
    education,
    selfSummary,
    originalResumeText: markdown,
  };
}

export function createTailorRunDraft({
  baseline,
  jdTest,
  projects,
  skills,
  projectFitResults = [],
}: {
  baseline: ResumeBaselineView;
  jdTest: CareerJdTestView;
  projects: CareerProjectView[];
  skills: CareerSkillView[];
  projectFitResults?: ProjectFitResult[];
}): Omit<ResumeTailorRunView, "id" | "baselineId" | "jdTestId" | "updatedAt"> {
  const jdAnalysis = {
    id: "preview",
    updatedAt: new Date().toISOString(),
    ...analyzeCareerJd(
      {
        company: jdTest.company,
        role: jdTest.role,
        source: jdTest.source,
        jdText: jdTest.jdText,
      },
      projects,
      skills,
    ),
  };
  const selectedProjects = selectProjects(jdAnalysis, projects, projectFitResults);
  const targetedSkills = selectSkills(jdAnalysis, skills, baseline.skills);
  const missingEvidence = findMissingEvidence(jdAnalysis, targetedSkills, selectedProjects, baseline);
  const riskNotes = buildRiskNotes(selectedProjects, projectFitResults);
  const rewrittenProjectBullets = selectedProjects.flatMap((project) => rewriteProjectBullets(project, jdAnalysis));
  const rewrittenWorkExperience = rewriteWorkExperience(baseline, jdAnalysis);
  const targetedSummary = buildTargetedSummary(baseline, jdTest, targetedSkills, selectedProjects);
  const finalResumeMarkdown = renderTailoredResume({
    baseline,
    jdTest,
    targetedSummary,
    targetedSkills,
    selectedProjects,
    rewrittenProjectBullets,
    rewrittenWorkExperience,
  });
  const comparisonReport = buildComparisonReport({ baseline, jdAnalysis, selectedProjects, targetedSkills, missingEvidence, riskNotes });

  return {
    jdAnalysis,
    targetedSummary,
    targetedSkills,
    selectedProjects: selectedProjects.map((project) => project.name),
    rewrittenProjectBullets,
    rewrittenWorkExperience,
    riskNotes,
    missingEvidence,
    finalResumeMarkdown,
    comparisonReport,
  };
}

export function buildLearningTasksForJd(jdAnalysis: CareerJdAnalysisView, skills: CareerSkillView[]) {
  return generateSevenDayTasks(jdAnalysis, skills);
}

function selectProjects(analysis: CareerJdAnalysisView, projects: CareerProjectView[], projectFitResults: ProjectFitResult[] = []) {
  const fitSelected = filterProjectsForResume(projects, projectFitResults).slice(0, 4);
  if (fitSelected.length) return fitSelected;
  const terms = [...analysis.requiredSkills, ...analysis.responsibilities].join(" ").toLowerCase();
  return projects
    .filter((project) => !isLowSignalProject(project.name))
    .map((project) => ({
      project,
      score: [project.name, project.description, project.status, ...project.techStack, ...project.highlights, ...project.resumeBullets]
        .join(" ")
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => terms.includes(token)).length,
    }))
    .filter((item) => item.score > 0 || analysis.matchedProjects.includes(item.project.name))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((item) => item.project);
}

function isLowSignalProject(name: string) {
  return /^\.|^(scripts?|n8n|index|project index|workflows?)$/i.test(name.trim());
}

function selectSkills(analysis: CareerJdAnalysisView, skills: CareerSkillView[], baselineSkills: string[]) {
  const evidence = new Set([...skills.map((skill) => skill.name.toLowerCase()), ...baselineSkills.map((skill) => skill.toLowerCase())]);
  return analysis.requiredSkills.filter((skill) => hasSkillEvidence(skill, evidence));
}

function findMissingEvidence(
  analysis: CareerJdAnalysisView,
  targetedSkills: string[],
  selectedProjects: CareerProjectView[],
  baseline: ResumeBaselineView,
) {
  const known = new Set([
    ...targetedSkills.map((item) => item.toLowerCase()),
    ...selectedProjects.flatMap((project) => [project.name, ...project.techStack]).map((item) => item.toLowerCase()),
    ...baseline.skills.map((item) => item.toLowerCase()),
  ]);
  return analysis.requiredSkills.filter((skill) => !hasSkillEvidence(skill, known));
}

function buildRiskNotes(projects: CareerProjectView[], projectFitResults: ProjectFitResult[] = []) {
  const fitWarnings = projectFitResults
    .filter((result) => projects.some((project) => project.id === result.project_id))
    .flatMap((result) => result.risk_warnings);
  return [
    ...projects
    .filter((project) => /wip|prototype|mvp|semi-finished|draft/i.test(project.status))
      .map((project) => `${project.name} 当前状态为 ${project.status}，简历中只能描述已验证范围，不能写成 production-ready。`),
    ...fitWarnings,
  ];
}

function rewriteProjectBullets(project: CareerProjectView, analysis: CareerJdAnalysisView) {
  const safeStatus = /wip|prototype|mvp|semi-finished|draft/i.test(project.status)
    ? `（项目状态：${project.status}）`
    : "";
  const base = (project.resumeBullets.length ? project.resumeBullets : project.highlights).filter((item) => !hasUnconfirmedEvidenceText(item));
  if (!base.length) return [`${project.name}${safeStatus}: 基于已有 Wiki 记录，可围绕 ${analysis.role} 补充可验证项目证据。`];
  return base.slice(0, 3).map((bullet) => `${project.name}${safeStatus}: ${bullet}`);
}

function rewriteWorkExperience(baseline: ResumeBaselineView, analysis: CareerJdAnalysisView) {
  const evidenceItems = baseline.workExperience.filter((item) => !isPlaceholderText(item));
  if (!evidenceItems.length) return [];
  return evidenceItems
    .slice(0, 5)
    .map((item) => `${item}；表达重点对齐 ${analysis.role} 的职责要求。`);
}

function buildTargetedSummary(
  baseline: ResumeBaselineView,
  jdTest: CareerJdTestView,
  targetedSkills: string[],
  projects: CareerProjectView[],
) {
  const safeSummary = isPlaceholderText(baseline.selfSummary) ? "候选人" : baseline.selfSummary || "候选人";
  const skillText = targetedSkills.slice(0, 5).join("、") || "岗位相关技能";
  const projectText = projects.map((project) => `[[${project.name}]]（${project.status}）`).join("、") || "已有项目素材";
  return `${safeSummary}。针对 ${jdTest.role}，重点呈现 ${skillText} 与 ${projectText} 的可验证经验。`;
}

function buildComparisonReport({
  baseline,
  jdAnalysis,
  selectedProjects,
  targetedSkills,
  missingEvidence,
  riskNotes,
}: {
  baseline: ResumeBaselineView;
  jdAnalysis: CareerJdAnalysisView;
  selectedProjects: CareerProjectView[];
  targetedSkills: string[];
  missingEvidence: string[];
  riskNotes: string[];
}): ResumeComparisonReport {
  const baselineText = baseline.originalResumeText.toLowerCase();
  const covered = jdAnalysis.requiredSkills.filter((skill) => baselineText.includes(skill.toLowerCase()));
  const baselineScore = Math.min(80, 30 + covered.length * 8);
  const tailoredScore = Math.min(95, baselineScore + selectedProjects.length * 8 + targetedSkills.length * 4 - missingEvidence.length * 3);
  return {
    baselineScore,
    tailoredScore,
    improvementSummary: [
      `JD 技能覆盖从 ${covered.length}/${jdAnalysis.requiredSkills.length} 提升到 ${targetedSkills.length}/${jdAnalysis.requiredSkills.length}。`,
      `新增项目匹配证据 ${selectedProjects.length} 个。`,
    ],
    changedSections: ["Summary", "Skills", "Projects", "Work Experience"],
    riskWarnings: riskNotes.length ? riskNotes : ["未发现 WIP 项目夸大风险。"],
    nextActions: missingEvidence.length
      ? [`补充这些缺口证据：${missingEvidence.join("、")}`]
      : ["用真实面试问题继续验证项目叙述。"],
  };
}

function renderTailoredResume({
  baseline,
  jdTest,
  targetedSummary,
  targetedSkills,
  selectedProjects,
  rewrittenProjectBullets,
  rewrittenWorkExperience,
}: {
  baseline: ResumeBaselineView;
  jdTest: CareerJdTestView;
  targetedSummary: string;
  targetedSkills: string[];
  selectedProjects: CareerProjectView[];
  rewrittenProjectBullets: string[];
  rewrittenWorkExperience: string[];
}) {
  const safeWorkExperience = rewrittenWorkExperience.length ? rewrittenWorkExperience : baseline.workExperience.filter((item) => !isPlaceholderText(item));
  const safeEducation = baseline.education.filter((item) => !isPlaceholderText(item));
  return [
    "---",
    `type: \"tailored_resume\"`,
    `company: ${JSON.stringify(jdTest.company)}`,
    `role: ${JSON.stringify(jdTest.role)}`,
    "---",
    "",
    `# ${jdTest.company} - ${jdTest.role} 定制简历草稿`,
    "",
    "## 个人总结",
    targetedSummary,
    "",
    "## 技能",
    formatList(targetedSkills.length ? targetedSkills : baseline.skills),
    "",
    "## 项目经历",
    formatList(rewrittenProjectBullets),
    "",
    "## 工作经历",
    formatList(safeWorkExperience),
    "",
    "## 教育背景",
    formatList(safeEducation),
    "",
    "## 项目状态说明",
    formatList(selectedProjects.map((project) => `${project.name}: ${project.status}`)),
  ].join("\n");
}

function splitMarkdownSections(markdown: string) {
  const sections: Array<{ title: string; body: string }> = [];
  const lines = markdown.split(/\r?\n/);
  let current = { title: "summary", body: "" };
  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)$/)?.[1]?.trim();
    if (heading) {
      sections.push(current);
      current = { title: heading, body: "" };
    } else {
      current.body += `${line}\n`;
    }
  }
  sections.push(current);
  return sections.filter((section) => section.body.trim() || section.title !== "summary");
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

function sectionItems(sections: Array<{ title: string; body: string }>, names: string[]) {
  const body = findSection(sections, names);
  if (!body) return [];
  return body
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

function findSection(sections: Array<{ title: string; body: string }>, names: string[]) {
  const found = sections.find((section) => names.some((name) => section.title.toLowerCase().includes(name.toLowerCase())));
  return found?.body.trim() ?? "";
}

function firstParagraph(markdown: string) {
  return markdown
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#"))
    ?.slice(0, 300) ?? "";
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 暂无可验证内容";
}

function hasSkillEvidence(skill: string, evidence: Set<string>) {
  const key = skill.toLowerCase();
  if (evidence.has(key)) return true;
  const aliases: Record<string, string[]> = {
    ai: ["agent", "llm", "rag"],
    automation: ["playwright", "cdp", "adb", "python"],
    javascript: ["typescript", "next.js", "react"],
  };
  return (aliases[key] ?? []).some((alias) => evidence.has(alias));
}

function isPlaceholderText(text: string) {
  return /TODO|待填写|请替换|补充/.test(text);
}

function hasUnconfirmedEvidenceText(text: string) {
  return /证据尚需确认|入口尚需确认|unknown|not approved|not completed or verified|not found|production_ready|needs.*confirmation/i.test(text);
}
