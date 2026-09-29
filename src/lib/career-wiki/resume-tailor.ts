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
  const selectedProjects = compactProjectsForStructuredWork(
    selectProjects(jdAnalysis, projects, projectFitResults),
    projects,
    baseline,
    jdAnalysis,
    projectFitResults,
  );
  const targetedSkills = selectSkills(jdAnalysis, skills, baseline.skills, selectedProjects, evidenceItems);
  const missingEvidence = findMissingEvidence(jdAnalysis, targetedSkills, selectedProjects, baseline, evidenceItems);
  const riskNotes = buildRiskNotes(selectedProjects, projectFitResults, evidenceItems, profile);
  const selectedProjectNames = selectedProjects.map((project) => project.name.toLowerCase());
  const excludedProjectNames = projects.filter(isExplicitlyExcludedProject).map((project) => project.name.toLowerCase());
  const rewrittenProjectBullets = unique([
    ...selectedProjects.flatMap((project) => rewriteProjectBullets(project, jdAnalysis, evidenceItems)),
    ...rankByJdRelevance(baseline.projects, jdAnalysis)
      .filter((item) => !selectedProjectNames.some((name) => item.toLowerCase().includes(name)))
      .filter((item) => !excludedProjectNames.some((name) => item.toLowerCase().includes(name)))
      .filter((item) => !baseline.workExperience.some(isStructuredWorkHeading) || !isWorkDerivedBaselineProject(item))
      .map(translateBaselineProjectBullet)
      .slice(0, selectedProjects.length ? 0 : 4),
  ]);
  const rewrittenWorkExperience = prioritizeWorkExperience(baseline.workExperience, jdAnalysis);
  const targetedSummary = buildTargetedSummary(baseline, targetedSkills, selectedProjects, jdAnalysis, profile);
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
  return rankProjectsForJd(projects, analysis, projectFitResults).slice(0, 3);
}

function rankProjectsForJd(projects: CareerProjectView[], analysis: CareerJdAnalysisView, projectFitResults: ProjectFitResult[]) {
  const fitByProject = new Map(projectFitResults.map((result) => [result.project_id, result]));
  return dedupeProjectFamilies(
    projects
      .filter(isResumeReadyProject)
      .filter((project) => !isProjectFitExcluded(fitByProject.get(project.id)))
      .map((project) => {
        const fit = fitByProject.get(project.id);
        const relevance = projectJdRelevance(project, analysis);
        return {
          project,
          relevance,
          score: relevance * 10 + (fit?.fit_score ?? 0) + Number(isBaselineProject(project)) * 4,
        };
      })
      .filter(({ project, relevance }) => relevance > 0 || analysis.matchedProjects.includes(project.name))
      .sort((left, right) => right.score - left.score || right.relevance - left.relevance)
      .map(({ project }) => project),
  );
}

function isProjectFitExcluded(result?: ProjectFitResult) {
  return result?.override_type === "force_exclude" || result?.recommended_resume_usage === "do_not_use";
}

function projectJdRelevance(project: CareerProjectView, analysis: CareerJdAnalysisView) {
  return scoreTextForJd(
    [project.name, project.description, project.status, project.interviewStory, ...project.techStack, ...project.highlights, ...project.resumeBullets].join(" "),
    analysis,
  );
}

function isLowSignalProject(name: string) {
  return /^\.|^(tests?|scripts?|n8n|index|project index|workflows?|changelog|memory|readme|context|project overview|\d{2}-.+)$/i.test(name.trim());
}

function isResumeReadyProject(project: CareerProjectView) {
  const resumeBullets = project.resumeBullets.filter((item) => !isPlaceholderText(item) && !hasUnconfirmedEvidenceText(item));
  return !isExplicitlyExcludedProject(project) && !isLowSignalProject(project.name) && resumeBullets.length > 0 && !/namespace|directory|control-plane|目录|索引/i.test(project.description);
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

function compactProjectsForStructuredWork(
  selected: CareerProjectView[],
  projects: CareerProjectView[],
  baseline: ResumeBaselineView,
  analysis: CareerJdAnalysisView,
  projectFitResults: ProjectFitResult[],
) {
  if (!baseline.workExperience.some(isStructuredWorkHeading)) return selected;
  const personalProjects = selected.filter((project) => !isWorkDerivedProject(project));
  const selectedIds = new Set(personalProjects.map((project) => project.id));
  const fallback = rankProjectsForJd(projects.filter((project) => !isWorkDerivedProject(project)), analysis, projectFitResults)
    .filter((project) => !selectedIds.has(project.id));
  return dedupeProjectFamilies([...personalProjects, ...fallback]).slice(0, 2);
}

function isCareerWikiProject(project: CareerProjectView) {
  return /career wiki agent/i.test(project.name);
}

function isWorkDerivedProject(project: CareerProjectView) {
  const family = projectFamily(project.name);
  return family === "finance-agent-platform" || family === "cross-platform-data-collection";
}

function selectSkills(
  analysis: CareerJdAnalysisView,
  skills: CareerSkillView[],
  baselineSkills: string[],
  selectedProjects: CareerProjectView[],
  evidenceItems: CareerEvidenceItemView[] = [],
) {
  const verifiedSkillEvidence = verifiedEvidence(evidenceItems)
    .filter((item) => item.targetType === "skill");
  const verifiedEvidenceSkills = verifiedSkillEvidence.map((item) => item.targetId);
  const verifiedEvidenceText = verifiedSkillEvidence.flatMap((item) => [item.title, item.content, item.targetId]);
  const projectSkills = selectedProjects.flatMap((project) => project.techStack);
  const resumeReadySkills = skills.filter(isResumeReadySkill).map((skill) => skill.name);
  const evidenceCandidates = uniqueCaseInsensitive(
    [...baselineSkills, ...resumeReadySkills, ...projectSkills, ...verifiedEvidenceSkills].map(normalizeResumeSkill),
  );
  const evidence = new Set(evidenceCandidates.map((item) => item.toLowerCase()));
  const directEvidence = new Set([
    ...baselineSkills.map(normalizeResumeSkill),
    ...selectedProjects.filter(isBaselineProject).flatMap((project) => project.techStack),
    ...verifiedEvidenceText,
  ].map((item) => item.toLowerCase()));
  const required = analysis.requiredSkills.map(normalizeResumeSkill).filter((skill) =>
    isHighRiskAiSkill(skill) ? hasSkillEvidence(skill, directEvidence) : hasSkillEvidence(skill, evidence),
  );
  const supporting = evidenceCandidates
    .filter((skill) => skill.trim().toLowerCase() !== "ai")
    .filter((skill) => !isHighRiskAiSkill(skill) || hasSkillEvidence(skill, directEvidence))
    .map((skill, index) => ({ skill, index, score: scoreTextForJd(skill, analysis) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ skill }) => skill);
  const baselineSupporting = baselineSkills.map(normalizeResumeSkill)
    .map((skill, index) => ({ skill, index, score: scoreTextForJd(skill, analysis) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ skill }) => skill);
  const aiWorkflowSkills = supporting.filter(isAiWorkflowSkill);
  const contentProductionSkills = supporting.filter(isContentProductionSkill);
  const jdMatchedSkills = uniqueCaseInsensitive([
    ...required,
    ...supporting.filter((skill) => scoreTextForJd(skill, analysis) > 0),
  ]);
  const selected = uniqueCaseInsensitive([
    ...jdMatchedSkills.slice(0, 9),
    ...aiWorkflowSkills.slice(0, 3),
    ...contentProductionSkills.slice(0, 2),
    ...baselineSupporting,
  ]).slice(0, 14);
  return selected.filter((skill) => skill.trim().toLowerCase() !== "ai");
}

function isAiWorkflowSkill(skill: string) {
  return /^(codex|claude code|spec coding)$/i.test(skill.trim());
}

function normalizeResumeSkill(skill: string) {
  return /^ai coding$/i.test(skill.trim()) ? "Spec Coding" : skill;
}

function isContentProductionSkill(skill: string) {
  return /^(视频剪辑|aigc 内容生产|video editing|aigc content production)$/i.test(skill.trim());
}

function isResumeReadySkill(skill: CareerSkillView) {
  return !/planned|learning|draft|rejected/i.test(skill.level);
}

function isHighRiskAiSkill(skill: string) {
  return /^(agent|llm|rag|mcp|tool calling|function calling|prompt engineering)$/i.test(skill.trim());
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

function rewriteProjectBullets(project: CareerProjectView, analysis: CareerJdAnalysisView, evidenceItems: CareerEvidenceItemView[] = []) {
  const status = resumeProjectStatus(project);
  const safeStatus = status ? `（项目状态：${status}）` : "";
  const evidenceBullets = verifiedEvidence(evidenceItems)
    .filter((item) => item.targetId === project.id || item.targetId === project.name)
    .filter((item) => item.targetType === "project" || item.targetType === "bullet")
    .map((item) => item.content);
  const base = rankByJdRelevance(
    (project.resumeBullets.length ? project.resumeBullets : project.highlights.length ? project.highlights : evidenceBullets)
      .filter((item) => !hasUnconfirmedEvidenceText(item)),
    analysis,
  );
  if (!base.length) return [];
  return base.slice(0, 3).map((bullet) => `${projectDisplayName(project.name)}${safeStatus}: ${naturalizeResumeBullet(bullet)}`);
}

function resumeProjectStatus(project: CareerProjectView) {
  if (isCareerWikiProject(project)) return "个人项目｜本地 MVP";
  if (/merchant operations dashboard/i.test(project.name)) return "业务项目｜生产验收（部分验证）";
  if (/reviewflow ai/i.test(project.name)) return "个人项目｜WIP prototype";
  if (isBaselineProject(project) || /wip|prototype|mvp|semi-finished|draft/i.test(project.status)) return project.status;
  return "";
}

function naturalizeResumeBullet(bullet: string) {
  if (/^基于 Next\.js、React、TypeScript 与 Prisma 搭建本地优先的职业证据工作台/.test(bullet)) {
    return "使用 Next.js、React、TypeScript 与 Prisma 搭建本地简历生成平台，支持简历导入、JD 分析、项目匹配、版本管理和多格式导出。";
  }
  if (/^设计 evidence validation 与人工审批流程/.test(bullet)) {
    return "增加简历内容校验和人工审核，缺少来源的内容不会进入正式版本。";
  }
  if (/^构建 Vitest、TypeScript、ESLint、healthcheck、integrity 与 backup 验证链路/.test(bullet)) {
    return "使用 Vitest、TypeScript 和 ESLint 覆盖核心生成与导出流程，并完成本地 MVP 验证。";
  }
  return bullet
    .replace(/受治理规则集/g, "版本化财务规则配置")
    .replace(/FastAPI adapter/gi, "自建 FastAPI 服务")
    .replace(/财务数据仅由内网 API 访问，n8n 容器不直接挂载数据目录/g, "将人工下载的财务文件接入自建 FastAPI 服务，n8n 仅通过内部接口调用")
    .replace(/fail-closed 处理/gi, "遇到未知类型时阻断计算并提示人工检查")
    .replace(/真实外部发送保留人工确认边界/g, "钉钉发送前保留人工确认")
    .replace(/partial verification/gi, "已验证范围")
    .replace(/evidence validation/gi, "简历内容校验");
}

function verifiedEvidence(evidenceItems: CareerEvidenceItemView[]) {
  return evidenceItems.filter((item) => item.status === "verified");
}

function buildTargetedSummary(
  baseline: ResumeBaselineView,
  targetedSkills: string[],
  projects: CareerProjectView[],
  analysis: CareerJdAnalysisView,
  profile?: CareerProfileView,
) {
  const profileSummary = profile?.summary && !isPlaceholderText(profile.summary) ? profile.summary.trim() : "";
  const profilePosition = [profile?.currentPosition, ...(profile?.strengths ?? [])]
    .find((item) => item && !isPlaceholderText(item));
  const baselineSummary = isPlaceholderText(baseline.selfSummary) ? "" : baseline.selfSummary;
  const base = (profileSummary || profilePosition || baselineSummary || "具备可验证项目与实践经历").replace(/[。；;\s]+$/u, "");
  const skillText = targetedSkills
    .filter((skill) => scoreTextForJd(skill, analysis) > 0)
    .slice(0, 5)
    .join("、");
  const projectText = projects
    .slice(0, 2)
    .map((project) => projectDisplayName(project.name))
    .join("、");
  const focus = [skillText ? `技术实践覆盖 ${skillText}` : "", projectText ? `项目经历重点呈现 ${projectText}` : ""]
    .filter(Boolean)
    .join("；");
  return `${base}。${focus ? `${focus}。` : ""}`;
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
  return items
    .filter((item) => !isPlaceholderText(item))
    .map((item, index) => ({ item, index, score: scoreTextForJd(item, analysis) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ item }) => item);
}

const JD_RELEVANCE_CONCEPTS: Array<{ jd: RegExp; evidence: RegExp; weight?: number }> = [
  {
    jd: /react|next\.?js|vue|typescript|javascript|前端|全栈|full.?stack/i,
    evidence: /react|next\.?js|vue|typescript|javascript|web|前端|全栈/i,
  },
  {
    jd: /python|fastapi|node\.?js|hono|trpc|后端|backend|api|数据库|database/i,
    evidence: /python|fastapi|node\.?js|api|prisma|sqlite|mysql|json|服务|接口|后端/i,
  },
  {
    jd: /sql|bi|ecpm|roi|ltv|留存|数据分析|数据运营|财务|指标|experiment|a\/b/i,
    evidence: /sql|excel|json|30\s*万|300,?000|财务|核算|补贴|经营|数据|报告|规则/i,
  },
  {
    jd: /test|pytest|vitest|测试|质量|审查|review|audit|security|安全|稳定性/i,
    evidence: /test|pytest|vitest|eslint|检查|测试|质量|审查|audit|安全|异常|阻断/i,
    weight: 7,
  },
  {
    jd: /workflow|n8n|automation|自动化|编排|任务链|tool calling|function calling/i,
    evidence: /workflow|n8n|automation|自动化|编排|任务|流程|tool|adapter|适配/i,
  },
  {
    jd: /采集|collection|cdp|adb|uiautomator|集成|integration|受限数据/i,
    evidence: /采集|collection|cdp|adb|uiautomator|浏览器|web|app|钉钉|集成/i,
  },
  {
    jd: /产品|需求|prd|prototype|原型|用户|运营|上线|交付|反馈/i,
    evidence: /产品|需求|版本|工作台|平台|导出|交付|用户|流程|模块|反馈/i,
  },
  {
    jd: /agent|llm|rag|prompt|model|模型|大模型|智能体|mcp|aigc|comfyui/i,
    evidence: /agent|llm|rag|langgraph|prompt|model|模型|大模型|智能体|mcp|aigc|代码审查|简历生成/i,
  },
  {
    jd: /docker|linux|nginx|ci\/cd|github actions|容器|部署/i,
    evidence: /docker|linux|nginx|ci\/cd|github actions|容器|部署|healthcheck/i,
  },
];

function scoreTextForJd(text: string, analysis: CareerJdAnalysisView) {
  const haystack = text.toLowerCase();
  const jdText = [analysis.role, analysis.jdText, ...analysis.requiredSkills, ...analysis.responsibilities, ...analysis.bonusPoints]
    .join(" ")
    .toLowerCase();
  const requiredScore = analysis.requiredSkills.reduce(
    (score, skill) => score + (haystack.includes(skill.toLowerCase()) ? 5 : 0),
    0,
  );
  const keywords = jdText
    .split(/[^\p{L}\p{N}+#./]+/u)
    .filter((keyword) => keyword.length >= 2 && keyword.length <= 24)
    .filter((keyword) => !/^(负责|要求|熟悉|具备|以及|相关|能力|岗位|工作|使用|进行|通过|the|and|with|for|from)$/.test(keyword));
  const keywordScore = unique(keywords).reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
  const conceptScore = JD_RELEVANCE_CONCEPTS.reduce(
    (score, concept) => score + (concept.jd.test(jdText) && concept.evidence.test(haystack) ? (concept.weight ?? 4) : 0),
    0,
  );
  return requiredScore + keywordScore + conceptScore;
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

function isWorkDerivedBaselineProject(value: string) {
  return /finance-agent-lab|n8n|xuanyuan-web-collector|app web collection workflow|财务核算|数据采集/i.test(value);
}

function candidateNameFrom(profile: CareerProfileView | undefined, baseline: ResumeBaselineView) {
  if (profile?.name.trim()) return profile.name.trim();
  const heading = stripFrontmatter(baseline.originalResumeText).match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && !/baseline|resume|简历|模板/i.test(heading)) return heading;
  return "候选人";
}

function candidateHeadlineFrom(profile: CareerProfileView | undefined, jdTest: CareerJdTestView) {
  const roles = uniqueCaseInsensitive((profile?.targetRoles ?? []).map(sanitizeResumeRoleLabel)).slice(0, 3);
  return roles.join(" / ") || sanitizeResumeRoleLabel(jdTest.role) || "AI 应用开发";
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

export function projectDisplayName(name: string) {
  const names: Record<string, string> = {
    "Career Wiki Agent": "职业证据管理与简历生成平台",
    "Merchant Operations Dashboard": "商户经营分析与预警平台",
    "finance-agent-lab": "多城市财务核算与数据治理系统",
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
