import type { ResumeRenderSchema } from "../resume-render-schema";

export function renderResumeHtml(schema: ResumeRenderSchema) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(schema.profile.company)} - ${escapeHtml(schema.profile.role)}</title>
  <style>
    :root { color-scheme: light; --ink: #202124; --muted: #5f6368; --line: #dadce0; --accent: #0b57d0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: var(--ink); font-family: Arial, "Microsoft YaHei", sans-serif; line-height: 1.48; }
    main { width: min(920px, 100%); margin: 0 auto; padding: 36px 32px; background: #fff; }
    header { border-bottom: 2px solid var(--ink); padding-bottom: 18px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 28px; letter-spacing: 0; }
    .target { margin-top: 8px; color: var(--muted); font-size: 14px; }
    section { margin-top: 18px; break-inside: avoid; }
    h2 { margin: 0 0 8px; color: var(--accent); font-size: 15px; text-transform: uppercase; letter-spacing: 0; }
    h3 { margin: 10px 0 4px; font-size: 14px; }
    p { margin: 0; }
    ul { margin: 6px 0 0; padding-left: 18px; }
    li { margin: 3px 0; }
    .skills { display: grid; gap: 8px; }
    .skill-group { display: grid; grid-template-columns: 140px 1fr; gap: 10px; }
    .project { border-top: 1px solid var(--line); padding-top: 10px; }
    .status { color: var(--muted); font-weight: 400; }
    @media print {
      body { background: #fff; }
      main { width: 100%; padding: 0; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <main>
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
