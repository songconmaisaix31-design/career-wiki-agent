import type { ResumeRenderSchema } from "../resume-render-schema";

export function renderResumeMarkdown(schema: ResumeRenderSchema) {
  return [
    "---",
    `type: "final_resume"`,
    `company: ${JSON.stringify(schema.profile.company)}`,
    `role: ${JSON.stringify(schema.profile.role)}`,
    `version: ${JSON.stringify(schema.metadata.version_name)}`,
    "---",
    "",
    `# ${schema.profile.name}`,
    "",
    `> ${schema.profile.headline}`,
    "",
    "## 职业概述",
    schema.summary,
    "",
    "## 核心技能",
    ...schema.skills.flatMap((group) => [`### ${group.category}`, formatList(group.items), ""]),
    "## 工作经历",
    formatList(schema.work_experience),
    "",
    "## 项目经历",
    ...schema.projects.flatMap((project) => [
      `### ${project.name}`,
      formatList(project.bullets.map((bullet) => linkProject(project.name, bullet))),
      "",
    ]),
    "## 教育背景",
    formatList(schema.education),
    schema.awards.length ? "\n## Awards\n" + formatList(schema.awards) : "",
  ].join("\n");
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "";
}

function linkProject(name: string, bullet: string) {
  return bullet.includes(`[[${name}]]`) ? bullet : `[[${name}]]: ${bullet}`;
}
