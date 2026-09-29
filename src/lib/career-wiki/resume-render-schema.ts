import type { CareerResumeVersionView, ResumeEvidenceItem } from "./types";

export type ResumeRenderProject = {
  name: string;
  status: string;
  bullets: string[];
};

export type ResumeRenderSchema = {
  profile: {
    name: string;
    title: string;
    headline: string;
    company: string;
    role: string;
  };
  target_role: string;
  summary: string;
  skills: Array<{ category: string; items: string[] }>;
  work_experience: string[];
  projects: ResumeRenderProject[];
  education: string[];
  awards: string[];
  evidence_summary: ResumeEvidenceItem[];
  risk_notes: string[];
  metadata: {
    version_id: string;
    version_name: string;
    status: string;
    generated_at: string;
  };
};

export function buildResumeRenderSchema(version: CareerResumeVersionView): ResumeRenderSchema {
  const sections = splitMarkdownSections(version.finalResumeMarkdown);
  const heading = firstHeading(version.finalResumeMarkdown);
  const candidateName = isTargetHeading(heading, version) ? "候选人" : heading || "候选人";
  const evidenceSummary = version.evidenceSummary.filter((item) => item.valid && isSafeResumeText(item.content));
  return {
    profile: {
      name: candidateName,
      title: candidateName,
      headline: firstQuote(version.finalResumeMarkdown) || `求职方向：${version.role}`,
      company: version.company,
      role: version.role,
    },
    target_role: version.role,
    summary: safeText(firstText(sections, ["职业概述", "个人总结", "summary", "profile"])),
    skills: groupSkills(extractList(firstText(sections, ["核心技能", "技能", "skills"]))),
    work_experience: filterSafeList(extractList(firstText(sections, ["工作经历", "work experience", "experience"]))),
    projects: groupProjectBullets(filterSafeList(extractList(firstText(sections, ["项目经历", "projects", "project experience"])))),
    education: filterSafeList(extractList(firstText(sections, ["教育背景", "教育", "education"]))),
    awards: filterSafeList(extractList(firstText(sections, ["奖项", "awards", "certifications"]))),
    evidence_summary: evidenceSummary,
    risk_notes: version.riskNotes,
    metadata: {
      version_id: version.id,
      version_name: version.versionName,
      status: version.status,
      generated_at: new Date().toISOString(),
    },
  };
}

export function assertSafeRenderSchema(schema: ResumeRenderSchema) {
  const text = JSON.stringify(schema);
  const formalText = JSON.stringify({
    summary: schema.summary,
    skills: schema.skills,
    work_experience: schema.work_experience,
    projects: schema.projects,
    education: schema.education,
    awards: schema.awards,
  });
  if (/missing evidence|missing_evidence/i.test(text)) throw new Error("Render schema 包含 missing evidence，已阻止渲染。");
  if (/production-ready/i.test(formalText)) throw new Error("Render schema 正文包含 production-ready 误写，已阻止渲染。");
  if (/(api[_ -]?key|cookie|token)\s*[:=]/i.test(text)) throw new Error("Render schema 疑似包含敏感信息，已阻止渲染。");
  const unsafeReviewFlow = schema.projects.some((project) =>
    /ReviewFlow AI/i.test(project.name) && !/wip|prototype|semi-finished|mvp/i.test(project.status),
  );
  if (unsafeReviewFlow) throw new Error("ReviewFlow AI 状态缺少 WIP / prototype / semi-finished 表述。");
}

function splitMarkdownSections(markdown: string) {
  const sections = new Map<string, string>();
  let current = "__preamble__";
  for (const line of markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/)?.[1]?.trim();
    if (heading) {
      current = heading;
      sections.set(current, "");
    } else {
      sections.set(current, `${sections.get(current) ?? ""}${line}\n`);
    }
  }
  return sections;
}

function firstText(sections: Map<string, string>, names: string[]) {
  for (const [title, body] of sections) {
    if (names.some((name) => title.toLowerCase().includes(name.toLowerCase()))) return body.trim();
  }
  return "";
}

function extractList(section: string) {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

function groupSkills(skills: string[]) {
  const items = filterSafeList(skills).map((item) => (/^ai coding$/i.test(item) ? "Spec Coding" : item));
  const groups = [
    { category: "AI 工作栈", pattern: /codex|claude code|spec coding|ai coding|cursor|github copilot/i, items: [] as string[] },
    { category: "编程语言", pattern: /python|fastapi|pytest|pandas/i, items: [] as string[] },
    { category: "数据", pattern: /sql|sqlite|json schema|excel|data|数据/i, items: [] as string[] },
    { category: "工程", pattern: /git|docker|n8n|rest api|http|vitest|eslint|linux|wsl/i, items: [] as string[] },
    { category: "Web", pattern: /typescript|javascript|react|next|node|prisma|web/i, items: [] as string[] },
    { category: "内容生产", pattern: /视频剪辑|video editing|aigc 内容生产|aigc content production|内容生产|剪辑/i, items: [] as string[] },
    { category: "AI 技术", pattern: /agent|llm|rag|langgraph|aigc|prompt|模型|人工智能|tool calling/i, items: [] as string[] },
    { category: "其他", pattern: /.*/i, items: [] as string[] },
  ];
  for (const item of items) (groups.find((group) => group.pattern.test(item)) ?? groups.at(-1))?.items.push(item);
  return groups.filter((group) => group.items.length).map(({ category, items: groupItems }) => ({ category, items: groupItems }));
}

function groupProjectBullets(bullets: string[]) {
  const projects = new Map<string, ResumeRenderProject>();
  for (const bullet of bullets) {
    const match = bullet.match(/^(.+?)[：:]\s+(.+)$/) ?? bullet.match(/^([^（：:]+)[：:]\s*(.+)$/);
    const rawName = match?.[1] ?? "Project";
    const heading = splitProjectHeading(rawName);
    const name = heading.name || "Project";
    if (isLowSignalProjectName(name)) continue;
    const status = heading.status || projectStatus(rawName);
    const content = safeText(match?.[2]?.trim() || bullet);
    if (!content) continue;
    const existing = projects.get(name) ?? { name, status, bullets: [] };
    existing.status = existing.status || status;
    existing.bullets.push(content);
    projects.set(name, existing);
  }
  return [...projects.values()];
}

function splitProjectHeading(value: string) {
  const marker = "（项目状态：";
  const markerIndex = value.indexOf(marker);
  if (markerIndex >= 0 && value.endsWith("）")) {
    return {
      name: value.slice(0, markerIndex).trim(),
      status: value.slice(markerIndex + marker.length, -1).trim(),
    };
  }
  return { name: cleanProjectName(value), status: "" };
}

function cleanProjectName(value: string) {
  return value.replace(/（项目状态：.+?）/g, "").trim() || "Project";
}

function projectStatus(value: string) {
  return value.match(/项目状态：(.+?)）/)?.[1]?.trim() ?? "";
}

function firstHeading(markdown: string) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function firstQuote(markdown: string) {
  return markdown.match(/^>\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function isTargetHeading(heading: string, version: CareerResumeVersionView) {
  const normalized = heading.toLowerCase();
  return !heading || normalized.includes("定制简历") || normalized.includes(version.company.toLowerCase()) || normalized.includes(version.role.toLowerCase());
}

function isLowSignalProjectName(name: string) {
  return /^\.|^(tests?|scripts?|index|workflows?|\d{2}-.+)$/i.test(name.trim());
}

function filterSafeList(items: string[]) {
  return items.map(safeText).filter(Boolean);
}

function safeText(text: string) {
  const trimmed = text.trim();
  return isSafeResumeText(trimmed) ? trimmed : "";
}

function isSafeResumeText(text: string) {
  if (!text.trim()) return false;
  if (/TODO|暂无可验证内容|请填写|待填写|placeholder/i.test(text)) return false;
  if (/missing evidence|missing_evidence/i.test(text)) return false;
  if (/production-ready/i.test(text)) return false;
  if (/(api[_ -]?key|cookie|token)\s*[:=]/i.test(text)) return false;
  if (/ReviewFlow AI/i.test(text) && !/wip|prototype|semi-finished|mvp|项目状态/i.test(text)) return false;
  return true;
}
