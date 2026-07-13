import type {
  CareerProfileView,
  CareerJdAnalysisView,
  CareerEvidenceItemView,
  CareerJdTestView,
  CareerProjectView,
  CareerSkillView,
  ResumeBaselineView,
  ResumeComparisonReport,
  ResumeTailorRunView,
} from "./types";
import { filterProjectsForResume } from "./project-fit/classifier";
import type { ProjectFitResult } from "./project-fit/types";
import { analyzeCareerJd, generateSevenDayTasks, sanitizeResumeRoleLabel } from "./rules";

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
  profile,
  projectFitResults = [],
  evidenceItems = [],
}: {
  baseline: ResumeBaselineView;
  jdTest: CareerJdTestView;
  projects: CareerProjectView[];
  skills: CareerSkillView[];
  profile?: CareerProfileView;
  projectFitResults?: ProjectFitResult[];
  evidenceItems?: CareerEvidenceItemView[];
}): Omit<ResumeTailorRunView, "id" | "baselineId" | "jdTestId" | "updatedAt"> {
  assertUsableBaseline(baseline);
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
  const targetedSkills = selectSkills(jdAnalysis, skills, baseline.skills, evidenceItems);
  const missingEvidence = findMissingEvidence(jdAnalysis, targetedSkills, selectedProjects, baseline, evidenceItems);
  const riskNotes = buildRiskNotes(selectedProjects, projectFitResults, evidenceItems, profile);
  const selectedProjectNames = selectedProjects.map((project) => project.name.toLowerCase());
  const excludedProjectNames = projects.filter(isExplicitlyExcludedProject).map((project) => project.name.toLowerCase());
  const rewrittenProjectBullets = unique([
    ...selectedProjects.flatMap((project) => rewriteProjectBullets(project, evidenceItems)),
    ...rankByJdRelevance(baseline.projects, jdAnalysis)
      .filter((item) => !selectedProjectNames.some((name) => item.toLowerCase().includes(name)))
      .filter((item) => !excludedProjectNames.some((name) => item.toLowerCase().includes(name)))
      .map(translateBaselineProjectBullet)
      .slice(0, 4),
  ]);
  const rewrittenWorkExperience = prioritizeWorkExperience(baseline.workExperience, jdAnalysis);
  const targetedSummary = buildTargetedSummary(baseline, targetedSkills, selectedProjects, profile);
  const finalResumeMarkdown = renderTailoredResume({
    baseline,
    jdTest,
    candidateName: candidateNameFrom(profile, baseline),
    candidateHeadline: candidateHeadlineFrom(profile, jdTest),
    targetedSummary,
    targetedSkills,
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
  const fitSelected = dedupeProjectFamilies(
    filterProjectsForResume(projects, projectFitResults)
      .filter(isResumeReadyProject)
      .sort((left, right) => Number(isBaselineProject(right)) - Number(isBaselineProject(left))),
  )
    .slice(0, 3);
  if (fitSelected.length) return fitSelected;
  const weakFitScores = new Map(
    projectFitResults
      .filter((result) => result.recommended_resume_usage === "mention_only")
      .map((result) => [result.project_id, result.fit_score]),
  );
  const weakFitSelected = dedupeProjectFamilies(
    projects
      .filter((project) => weakFitScores.has(project.id) && isResumeReadyProject(project))
      .sort(
        (left, right) =>
          Number(isBaselineProject(right)) - Number(isBaselineProject(left)) ||
          (weakFitScores.get(right.id) ?? 0) - (weakFitScores.get(left.id) ?? 0),
      ),
  )
    .slice(0, 3);
  if (weakFitSelected.length) return weakFitSelected;
  const terms = [...analysis.requiredSkills, ...analysis.responsibilities].join(" ").toLowerCase();
  return dedupeProjectFamilies(
    projects
      .filter(isResumeReadyProject)
      .map((project) => ({
        project,
        score: [project.name, project.description, project.status, ...project.techStack, ...project.highlights, ...project.resumeBullets]
          .join(" ")
          .toLowerCase()
          .split(/\s+/)
          .filter((token) => terms.includes(token)).length,
      }))
      .filter((item) => item.score > 0 || analysis.matchedProjects.includes(item.project.name))
      .sort((left, right) => Number(isBaselineProject(right.project)) - Number(isBaselineProject(left.project)) || right.score - left.score)
      .map((item) => item.project),
  ).slice(0, 3);
}

function isLowSignalProject(name: string) {
  return /^\.|^(tests?|scripts?|n8n|index|project index|workflows?|\d{2}-.+)$/i.test(name.trim());
}

function isResumeReadyProject(project: CareerProjectView) {
  const evidence = [...project.resumeBullets, ...project.highlights].filter((item) => !isPlaceholderText(item));
  return !isExplicitlyExcludedProject(project) && !isLowSignalProject(project.name) && evidence.length > 0 && !/namespace|directory|control-plane|目录|索引/i.test(project.description);
}

function isExplicitlyExcludedProject(project: CareerProjectView) {
  return /archived|do[_ -]?not[_ -]?use|excluded/i.test(project.status);
}

function isBaselineProject(project: CareerProjectView) {
  return /baseline_resume/i.test(project.interviewStory);
}

function dedupeProjectFamilies(projects: CareerProjectView[]) {
  const seen = new Set<string>();
  return projects.filter((project) => {
    const family = projectFamily(project.name);
    if (seen.has(family)) return false;
    seen.add(family);
    return true;
  });
}

function projectFamily(name: string) {
  if (/xuanyuan-web-collector|app web collection workflow/i.test(name)) return "cross-platform-data-collection";
  if (/^n8n$|finance-agent-lab/i.test(name)) return "finance-agent-platform";
  return name.trim().toLowerCase();
}

function selectSkills(analysis: CareerJdAnalysisView, skills: CareerSkillView[], baselineSkills: string[], evidenceItems: CareerEvidenceItemView[] = []) {
  const verifiedEvidenceText = verifiedEvidence(evidenceItems)
    .filter((item) => item.targetType === "skill")
    .flatMap((item) => [item.title, item.content, item.targetId]);
  const evidence = new Set([...skills.map((skill) => skill.name.toLowerCase()), ...baselineSkills.map((skill) => skill.toLowerCase()), ...verifiedEvidenceText.map((item) => item.toLowerCase())]);
  const selected = uniqueCaseInsensitive(analysis.requiredSkills.filter((skill) => hasSkillEvidence(skill, evidence)));
  const hasSpecificAiSkill = selected.some((skill) => /agent|llm|rag|aigc|模型|智能体/i.test(skill));
  return selected.filter((skill) => !(skill.toLowerCase() === "ai" && hasSpecificAiSkill));
}

function findMissingEvidence(
  analysis: CareerJdAnalysisView,
  targetedSkills: string[],
  selectedProjects: CareerProjectView[],
  baseline: ResumeBaselineView,
  evidenceItems: CareerEvidenceItemView[] = [],
) {
  const verifiedEvidenceText = verifiedEvidence(evidenceItems).flatMap((item) => [item.title, item.content, item.targetId]);
  const known = new Set([
    ...targetedSkills.map((item) => item.toLowerCase()),
    ...selectedProjects.flatMap((project) => [project.name, ...project.techStack]).map((item) => item.toLowerCase()),
    ...baseline.skills.map((item) => item.toLowerCase()),
    ...verifiedEvidenceText.map((item) => item.toLowerCase()),
  ]);
  return analysis.requiredSkills.filter((skill) => !hasSkillEvidence(skill, known));
}

function buildRiskNotes(
  projects: CareerProjectView[],
  projectFitResults: ProjectFitResult[] = [],
  evidenceItems: CareerEvidenceItemView[] = [],
  profile?: CareerProfileView,
) {
  const fitWarnings = projectFitResults
    .filter((result) => projects.some((project) => project.id === result.project_id))
    .flatMap((result) => result.risk_warnings);
  const manualEvidenceWarnings = verifiedEvidence(evidenceItems)
    .filter((item) => projects.some((project) => project.id === item.targetId || project.name === item.targetId))
    .filter((item) => item.evidenceType === "user_input" || item.evidenceType === "external_note")
    .map((item) => `${item.title} 为人工补充证据，审批前需要保留来源说明：${item.sourcePath || item.sourceExcerpt}`);
  return [
    ...(!profile?.name.trim() ? ["个人资料未填写姓名，正式导出前需要补充。"] : []),
    ...projects
    .filter((project) => /wip|prototype|mvp|semi-finished|draft/i.test(project.status))
      .map((project) => `${project.name} 当前状态为 ${project.status}，简历中只能描述已验证范围，不能写成 production-ready。`),
    ...fitWarnings,
    ...manualEvidenceWarnings,
  ];
}

function rewriteProjectBullets(project: CareerProjectView, evidenceItems: CareerEvidenceItemView[] = []) {
  const shouldShowStatus = isBaselineProject(project) || /wip|prototype|mvp|semi-finished|draft/i.test(project.status);
  const safeStatus = shouldShowStatus
    ? `（项目状态：${project.status}）`
    : "";
  const evidenceBullets = verifiedEvidence(evidenceItems)
    .filter((item) => item.targetId === project.id || item.targetId === project.name)
    .filter((item) => item.targetType === "project" || item.targetType === "bullet")
    .map((item) => item.content);
  const base = (project.resumeBullets.length ? project.resumeBullets : project.highlights.length ? project.highlights : evidenceBullets).filter((item) => !hasUnconfirmedEvidenceText(item));
  if (!base.length) return [];
  return base.slice(0, 3).map((bullet) => `${projectDisplayName(project.name)}${safeStatus}: ${bullet}`);
}

function verifiedEvidence(evidenceItems: CareerEvidenceItemView[]) {
  return evidenceItems.filter((item) => item.status === "verified");
}

function buildTargetedSummary(
  baseline: ResumeBaselineView,
  targetedSkills: string[],
  projects: CareerProjectView[],
  profile?: CareerProfileView,
) {
  const profileSummary = [profile?.summary, profile?.currentPosition, ...(profile?.strengths ?? [])]
    .find((item) => item && !isPlaceholderText(item));
  const baselineSummary = isPlaceholderText(baseline.selfSummary) ? "" : baseline.selfSummary;
  const base = (profileSummary || baselineSummary || "具备可验证项目与实践经历").replace(/[。；;\s]+$/u, "");
  const skillText = targetedSkills.slice(0, 5).join("、");
  const projectText = projects
    .slice(0, 3)
    .map((project) => `${projectDisplayName(project.name)}${/wip|prototype|mvp|semi-finished|draft/i.test(project.status) ? `（${project.status}）` : ""}`)
    .join("、");
  const skillSentence = skillText ? `熟悉 ${skillText}` : "具备 AI 应用与数据处理实践";
  const projectSentence = projectText ? `相关实践覆盖 ${projectText}` : "项目内容均保留可验证边界";
  return `${base}。${skillSentence}，${projectSentence}。`;
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
  candidateName,
  candidateHeadline,
  targetedSummary,
  targetedSkills,
  rewrittenProjectBullets,
  rewrittenWorkExperience,
}: {
  baseline: ResumeBaselineView;
  jdTest: CareerJdTestView;
  candidateName: string;
  candidateHeadline: string;
  targetedSummary: string;
  targetedSkills: string[];
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
    `# ${candidateName}`,
    "",
    `> ${candidateHeadline}`,
    "",
    "## 职业概述",
    targetedSummary,
    "",
    "## 核心技能",
    formatList(targetedSkills.length ? targetedSkills : baseline.skills),
    "",
    ...(safeWorkExperience.length ? ["## 工作经历", formatList(safeWorkExperience), ""] : []),
    "## 项目经历",
    formatList(rewrittenProjectBullets),
    "",
    "## 教育背景",
    formatList(safeEducation),
  ].join("\n");
}

export function getBaselineQualityIssues(baseline: ResumeBaselineView) {
  const substantive = [baseline.selfSummary, ...baseline.workExperience, ...baseline.projects, ...baseline.skills, ...baseline.education]
    .filter((item) => item.trim() && !isPlaceholderText(item));
  const issues: string[] = [];
  if (/TODO|请填写|待填写|placeholder/i.test(baseline.originalResumeText)) issues.push("简历仍包含模板占位内容");
  if (substantive.length < 3) issues.push("简历缺少足够的真实经历、项目或技能");
  if (!baseline.workExperience.some((item) => !isPlaceholderText(item)) && !baseline.projects.some((item) => !isPlaceholderText(item))) {
    issues.push("简历缺少可用于定制的工作或项目经历");
  }
  return issues;
}

export function assertUsableBaseline(baseline: ResumeBaselineView) {
  const issues = getBaselineQualityIssues(baseline);
  if (issues.length) throw new Error(`当前基准简历不可用于生成：${issues.join("；")}。请重新上传或粘贴真实简历。`);
}

function rankByJdRelevance(items: string[], analysis: CareerJdAnalysisView) {
  const keywords = unique([...analysis.requiredSkills, ...analysis.responsibilities, ...analysis.bonusPoints])
    .flatMap((item) => item.toLowerCase().split(/[^\p{L}\p{N}+#.]+/u))
    .filter((item) => item.length >= 2);
  return items
    .filter((item) => !isPlaceholderText(item))
    .map((item, index) => ({ item, index, score: keywords.filter((keyword) => item.toLowerCase().includes(keyword)).length }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ item }) => item);
}

function prioritizeWorkExperience(items: string[], analysis: CareerJdAnalysisView) {
  const safeItems = items.filter((item) => !isPlaceholderText(item));
  if (!isStructuredWorkHeading(safeItems[0] ?? "")) return rankByJdRelevance(safeItems, analysis).slice(0, 8);

  const entries: string[][] = [];
  for (const item of safeItems) {
    if (isStructuredWorkHeading(item)) entries.push([item]);
    else entries.at(-1)?.push(item);
  }
  return entries.flatMap(([heading, context, ...highlights]) => [heading, context, ...rankByJdRelevance(highlights, analysis).slice(0, 5)].filter(Boolean));
}

function isStructuredWorkHeading(value: string) {
  const parts = value.split(/[|｜]/).map((part) => part.trim()).filter(Boolean);
  return parts.length >= 3 && /\d{4}[./-]\d{2}/.test(parts.at(-1) ?? "");
}

function candidateNameFrom(profile: CareerProfileView | undefined, baseline: ResumeBaselineView) {
  if (profile?.name.trim()) return profile.name.trim();
  const heading = stripFrontmatter(baseline.originalResumeText).match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && !/baseline|resume|简历|模板/i.test(heading)) return heading;
  return "候选人";
}

function candidateHeadlineFrom(profile: CareerProfileView | undefined, jdTest: CareerJdTestView) {
  const roles = uniqueCaseInsensitive((profile?.targetRoles ?? []).map(sanitizeResumeRoleLabel)).slice(0, 3);
  return roles.join(" · ") || sanitizeResumeRoleLabel(jdTest.role) || "AI 应用开发";
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function uniqueCaseInsensitive(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function projectDisplayName(name: string) {
  const names: Record<string, string> = {
    "Career Wiki Agent": "职业证据与简历智能体",
    "finance-agent-lab": "多城市财务治理智能体",
    n8n: "财务流程编排平台",
    "xuanyuan-web-collector": "跨端业务数据采集与播报系统",
    "App Web Collection Workflow": "跨端业务数据采集与播报系统",
    "ReviewFlow AI": "智能代码审查与交付审计系统",
    "Vercel Blob URL server": "云端文件链接服务",
  };
  return names[name] ?? name;
}

function translateBaselineProjectBullet(bullet: string) {
  const separator = bullet.search(/[：:]/);
  if (separator < 0) return bullet;
  const sourceName = bullet.slice(0, separator).trim();
  return `${projectDisplayName(sourceName)}: ${bullet.slice(separator + 1).trim()}`;
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
  return items.map((item) => `- ${item}`).join("\n");
}

function hasSkillEvidence(skill: string, evidence: Set<string>) {
  const key = skill.toLowerCase();
  if (evidence.has(key)) return true;
  if (key.length >= 2 && [...evidence].some((item) => item.includes(key))) return true;
  const aliases: Record<string, string[]> = {
    ai: ["agent", "llm", "rag"],
    automation: ["playwright", "cdp", "adb", "python"],
    javascript: ["typescript", "next.js", "react"],
  };
  return (aliases[key] ?? []).some((alias) => evidence.has(alias));
}

function isPlaceholderText(text: string) {
  return /TODO|待填写|请填写|请替换|补充真实|placeholder/i.test(text);
}

function hasUnconfirmedEvidenceText(text: string) {
  return /证据尚需确认|入口尚需确认|unknown|not approved|not completed or verified|not found|production_ready|needs.*confirmation/i.test(text);
}
