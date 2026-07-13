import { renderTemplateHtml } from "./shared";
import type { ResumeTemplate } from "./types";

export const compactTemplate: ResumeTemplate = {
  id: "compact",
  label: "Compact",
  description: "信息密度高，适合一页纸和初级岗位投递。",
  render: (schema) =>
    renderTemplateHtml(schema, {
      accent: "#7c2d12",
      bodyClass: "template-compact",
      extraCss: `
        .template-compact .resume-page { padding: 12mm 12mm; }
        .template-compact h1 { font-size: 24px; }
        .template-compact h2 { margin-bottom: 5px; font-size: 12px; color: var(--accent); }
        .template-compact h3 { margin-top: 5px; font-size: 12px; }
        .template-compact section { margin-top: 10px; }
        .template-compact li { margin: 1px 0; }
        .template-compact .skill-group { grid-template-columns: 92px 1fr; gap: 8px; }
        .template-compact .project { padding-top: 4px; }
      `,
    }),
};
