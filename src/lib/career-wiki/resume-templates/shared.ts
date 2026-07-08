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
  <title>${escapeHtml(schema.profile.company)} - ${escapeHtml(schema.profile.role)}</title>
  <style>
    @page { size: A4; margin: 14mm 13mm; }
    :root { color-scheme: light; --ink: #202124; --muted: #5f6368; --line: #d9dee7; --accent: ${style.accent}; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #edf1f7; color: var(--ink); font-family: Arial, "Microsoft YaHei", sans-serif; line-height: 1.46; }
    .resume-page { width: 210mm; min-height: 297mm; margin: 24px auto; background: #fff; box-shadow: 0 18px 48px rgb(15 23 42 / 14%); padding: 18mm 16mm; }
    header { break-after: avoid; }
    h1 { margin: 0; font-size: 28px; letter-spacing: 0; }
    .target { margin-top: 7px; color: var(--muted); font-size: 13px; }
    section { margin-top: 15px; break-inside: avoid; page-break-inside: avoid; }
    h2 { margin: 0 0 8px; color: var(--accent); font-size: 14px; letter-spacing: 0; break-after: avoid; page-break-after: avoid; }
    h3 { margin: 8px 0 4px; font-size: 13px; break-after: avoid; page-break-after: avoid; }
    p { margin: 0; }
    ul { margin: 5px 0 0; padding-left: 17px; }
    li { margin: 2px 0; }
    .skills { display: grid; gap: 6px; }
    .skill-group { display: grid; grid-template-columns: 118px 1fr; gap: 10px; }
    .project { break-inside: avoid; page-break-inside: avoid; }
    .status { color: var(--muted); font-weight: 400; }
    .print-hint { margin: 12px auto 0; width: 210mm; color: #334155; font-size: 13px; }
    .print-hint button { border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; padding: 8px 12px; font: inherit; cursor: pointer; }
    ${style.extraCss}
    @media print {
      body { background: #fff; }
      .resume-page { width: auto; min-height: auto; margin: 0; box-shadow: none; padding: 0; }
      .print-hint, .no-print { display: none !important; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body class="${style.bodyClass}">
  <main class="resume-page">
    <header>
      <h1>${escapeHtml(schema.profile.company)} - ${escapeHtml(schema.profile.role)}</h1>
      <div class="target">Target Role: ${escapeHtml(schema.target_role)} · Version: ${escapeHtml(schema.metadata.version_name)}</div>
    </header>
    <section>
      <h2>个人总结</h2>
      <p>${escapeHtml(schema.summary)}</p>
    </section>
    <section>
      <h2>技能</h2>
      <div class="skills">${schema.skills.map(renderSkillGroup).join("")}</div>
    </section>
    <section>
      <h2>项目经历</h2>
      ${schema.projects.map(renderProject).join("")}
    </section>
    <section>
      <h2>工作经历</h2>
      ${renderList(schema.work_experience)}
    </section>
    <section>
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

function renderProject(project: ResumeRenderSchema["projects"][number]) {
  const status = project.status ? ` <span class="status">(${escapeHtml(project.status)})</span>` : "";
  return `<article class="project"><h3>${escapeHtml(project.name)}${status}</h3>${renderList(project.bullets)}</article>`;
}

function renderList(items: string[]) {
  return items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>暂无可验证内容</p>";
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
