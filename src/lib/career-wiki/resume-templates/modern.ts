import { renderTemplateHtml } from "./shared";
import type { ResumeTemplate } from "./types";

export const modernTemplate: ResumeTemplate = {
  id: "modern",
  label: "Modern",
  description: "视觉更强，适合 AI 应用开发、互联网和产品化项目展示。",
  render: (schema) =>
    renderTemplateHtml(schema, {
      accent: "#0f766e",
      bodyClass: "template-modern",
      extraCss: `
        .template-modern .resume-page { border-top: 8px solid var(--accent); }
        .template-modern header { display: grid; gap: 6px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
        .template-modern h1 { font-size: 30px; }
        .template-modern h2 { text-transform: uppercase; border-left: 4px solid var(--accent); padding-left: 8px; }
        .template-modern .project { padding: 9px 0; border-top: 1px solid var(--line); }
        .template-modern .skill-group strong { color: var(--accent); }
      `,
    }),
};
