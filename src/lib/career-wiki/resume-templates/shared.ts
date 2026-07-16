import type { ResumeRenderSchema } from "../resume-render-schema";

export type TemplateStyle = {
  accent: string;
  bodyClass: string;
  extraCss: string;
};

export function renderTemplateHtml(schema: ResumeRenderSchema, style: TemplateStyle) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(schema.profile.name)} - ${escapeHtml(schema.profile.headline)}</title>
  <style>
    @page { size: A4; margin: 14mm 13mm; }
    :root { color-scheme: light; --ink: #17211f; --muted: #5f6b68; --line: #dfe5e2; --accent: ${style.accent}; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f0; color: var(--ink); font-family: Arial, "Microsoft YaHei", sans-serif; font-size: 12px; line-height: 1.55; }
    .resume-page { width: 210mm; max-width: calc(100% - 32px); min-height: 297mm; margin: 24px auto; background: #fff; box-shadow: 0 18px 48px rgb(15 23 42 / 14%); padding: 18mm 16mm; }
    header { break-after: avoid; }
    h1 { margin: 0; font-size: 30px; line-height: 1.15; letter-spacing: 0; }
    .headline { margin-top: 7px; color: var(--muted); font-size: 13px; }
    section { margin-top: 15px; break-inside: avoid; page-break-inside: avoid; }
    h2 { margin: 0 0 8px; color: var(--accent); font-size: 13px; letter-spacing: 0; break-after: avoid; page-break-after: avoid; }
    h3 { margin: 8px 0 4px; font-size: 13px; break-after: avoid; page-break-after: avoid; }
    p { margin: 0; }
    ul { margin: 5px 0 0; padding-left: 17px; }
    li { margin: 2px 0; }
    .skills { display: grid; gap: 6px; }
    .skill-group { display: grid; grid-template-columns: 118px 1fr; gap: 10px; }
    .skill-group span { min-width: 0; overflow-wrap: anywhere; }
    .work-entry { break-inside: avoid; page-break-inside: avoid; }
    .work-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: baseline; gap: 16px; }
    .work-heading h3 { margin: 0; }
    .work-role { font-weight: 700; }
    .work-date { color: var(--muted); white-space: nowrap; }
    .work-context { margin-top: 4px; color: var(--muted); }
    .project { break-inside: avoid; page-break-inside: avoid; }
    .status { color: var(--muted); font-weight: 400; }
    .print-hint { margin: 12px auto 0; width: 210mm; color: #334155; font-size: 13px; }
    .print-hint button { border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; padding: 8px 12px; font: inherit; cursor: pointer; }
    ${style.extraCss}
    @media print {
      body { background: #fff; }
      .resume-page { width: auto; max-width: none; min-height: auto; margin: 0; box-shadow: none; padding: 0; }
      .print-hint, .no-print { display: none !important; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body class="${style.bodyClass}">
  <main class="resume-page">
    <header>
      <h1>${escapeHtml(schema.profile.name)}</h1>
      <div class="headline">${escapeHtml(schema.profile.headline)}</div>
    </header>
    <section class="summary-section">
      <h2>职业概述</h2>
      <p>${escapeHtml(schema.summary)}</p>
    </section>
    <section class="skills-section">
      <h2>核心技能</h2>
      <div class="skills">${schema.skills.map(renderSkillGroup).join("")}</div>
    </section>
    ${schema.work_experience.length ? `<section class="work-section"><h2>工作经历</h2>${renderWorkExperience(schema.work_experience)}</section>` : ""}
    <section class="projects-section">
      <h2>项目经历</h2>
      ${schema.projects.map(renderProject).join("")}
    </section>
    <section class="education-section">
      <h2>教育背景</h2>
      ${renderList(schema.education)}
    </section>
  </main>
</body>
</html>`;
}

function renderSkillGroup(group: ResumeRenderSchema["skills"][number]) {
  return `<div class="skill-group"><strong>${escapeHtml(group.category)}</strong><span>${escapeHtml(group.items.join(" / "))}</span></div>`;
}

function renderWorkExperience(items: string[]) {
  const entries: Array<{ company: string; role: string; date: string; context: string; highlights: string[] }> = [];
  let current: (typeof entries)[number] | undefined;

  for (const item of items) {
    const heading = parseWorkHeading(item);
    if (heading) {
      current = { ...heading, context: "", highlights: [] };
      entries.push(current);
    } else if (current && !current.context) {
      current.context = item;
    } else if (current) {
      current.highlights.push(item);
    }
  }

  if (!entries.length) return renderList(items);
  return entries
    .map(
      (entry) => `<article class="work-entry">
        <div class="work-heading">
          <h3>${escapeHtml(entry.company)}</h3>
          <span class="work-role">${escapeHtml(entry.role)}</span>
          <span class="work-date">${escapeHtml(entry.date)}</span>
        </div>
        ${entry.context ? `<p class="work-context">${escapeHtml(entry.context)}</p>` : ""}
        ${renderList(entry.highlights)}
      </article>`,
    )
    .join("");
}

function parseWorkHeading(value: string) {
  const [company, role, date, ...rest] = value.split(/[|｜]/).map((part) => part.trim());
  if (!company || !role || !date || rest.length || !/\d{4}[./-]\d{2}/.test(date)) return undefined;
  return { company, role, date };
}

function renderProject(project: ResumeRenderSchema["projects"][number]) {
  const [introduction, ...highlights] = project.bullets;
  const techStack = inferProjectTechStack(project.bullets);
  return `<article class="project">
    <div class="project-heading"><h3>${escapeHtml(project.name)}</h3></div>
    ${introduction ? `<p class="project-intro"><strong>项目简介：</strong>${escapeHtml(introduction)}</p>` : ""}
    ${techStack.length ? `<p class="project-stack"><strong>技术栈：</strong>${escapeHtml(techStack.join("、"))}</p>` : ""}
    ${highlights.length ? `<div class="project-highlights"><strong>技术亮点：</strong>${renderList(highlights)}</div>` : ""}
  </article>`;
}

function inferProjectTechStack(bullets: string[]) {
  const text = bullets.join(" ");
  const technologies = [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "FastAPI",
    "Omni",
    "LangGraph",
    "Postgres",
    "PostgreSQL",
    "Embedding",
    "Intent Classification",
    "Markdown Knowledge Base",
    "SQL",
    "Prisma",
    "SQLite",
    "Docker",
    "n8n",
    "JSON Schema",
    "pytest",
    "Vitest",
    "ESLint",
    "PowerShell",
    "CDP",
    "ADB",
    "uiautomator2",
    "Vercel",
    "LLM",
    "RAG",
    "Agent",
    "MCP",
  ];
  return technologies.filter((technology) => text.toLowerCase().includes(technology.toLowerCase()));
}

function renderList(items: string[]) {
  return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
