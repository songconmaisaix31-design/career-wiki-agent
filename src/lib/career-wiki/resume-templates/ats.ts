import { renderTemplateHtml } from "./shared";
import type { ResumeTemplate } from "./types";

export const atsTemplate: ResumeTemplate = {
  id: "ats",
  label: "ATS",
  description: "简洁保守，少装饰，结构优先，适合 ATS 解析。",
  render: (schema) =>
    renderTemplateHtml(schema, {
      accent: "#1f2937",
      bodyClass: "template-ats",
      extraCss: `
        .template-ats body, body.template-ats { background: #fff; }
        .template-ats .resume-page { box-shadow: none; border: 1px solid #e5e7eb; }
        .template-ats header { border-bottom: 2px solid #111827; padding-bottom: 10px; }
        .template-ats h1 { font-size: 26px; }
        .template-ats h2 { color: #111827; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
        .template-ats .project { padding-top: 6px; }
      `,
    }),
};
