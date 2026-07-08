import type { CareerResumeVersionView, ResumeEvidenceItem } from "./types";

export type ResumeRenderProject = {
  name: string;
  status: string;
  bullets: string[];
};

export type ResumeRenderSchema = {
  profile: {
    title: string;
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
  const evidenceSummary = version.evidenceSummary.filter((item) => item.valid && isSafeResumeText(item.content));
  return {
    profile: {
      title: `${version.company} - ${version.role}`,
      company: version.company,
      role: version.role,
    },
    target_role: version.role,
    summary: safeText(firstText(sections, ["个人总结", "summary", "profile"])),
    skills: groupSkills(extractList(firstText(sections, ["技能", "skills"]))),
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
  let current = "summary";
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
  const items = filterSafeList(skills);
  return items.length ? [{ category: "Core Skills", items }] : [];
}

function groupProjectBullets(bullets: string[]) {
  const projects = new Map<string, ResumeRenderProject>();
  for (const bullet of bullets) {
    const [rawName, ...rest] = bullet.split(":");
    const name = cleanProjectName(rawName || "Project");
    const status = projectStatus(rawName || bullet);
    const content = safeText(rest.join(":").trim() || bullet);
    if (!content) continue;
    const existing = projects.get(name) ?? { name, status, bullets: [] };
    existing.status = existing.status || status;
    existing.bullets.push(content);
    projects.set(name, existing);
  }
  return [...projects.values()];
}

function cleanProjectName(value: string) {
  return value.replace(/（项目状态：.+?）/g, "").trim() || "Project";
}

function projectStatus(value: string) {
  return value.match(/项目状态：(.+?)）/)?.[1]?.trim() ?? "";
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
  if (/missing evidence|missing_evidence/i.test(text)) return false;
  if (/production-ready/i.test(text)) return false;
  if (/(api[_ -]?key|cookie|token)\s*[:=]/i.test(text)) return false;
  if (/ReviewFlow AI/i.test(text) && !/wip|prototype|semi-finished|mvp|项目状态/i.test(text)) return false;
  return true;
}
