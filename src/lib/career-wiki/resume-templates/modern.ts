import { renderTemplateHtml } from "./shared";
import type { ResumeTemplate } from "./types";

export const modernTemplate: ResumeTemplate = {
  id: "modern",
  label: "Modern",
  description: "视觉更强，适合 AI 应用开发、互联网和产品化项目展示。",
  render: (schema) =>
    renderTemplateHtml(schema, {
      accent: "#1976a8",
      bodyClass: "template-modern",
      extraCss: `
        .template-modern .resume-page { padding: 15mm 14mm 13mm; }
        .template-modern header { display: grid; gap: 5px; padding: 0 0 13px; border-bottom: 2px solid #202b33; text-align: center; }
        .template-modern h1 { color: #151b20; font-size: 31px; font-weight: 750; }
        .template-modern .headline { color: #334651; font-size: 13px; font-weight: 700; }
        .template-modern section { margin-top: 14px; }
        .template-modern .summary-section { padding: 0 2px; }
        .template-modern .summary-section h2 { display: none; }
        .template-modern .summary-section p { max-width: 72ch; margin: 0 auto; color: #34434b; text-align: center; }
        .template-modern h2 { display: inline-block; margin: 0 0 9px; padding: 4px 22px 4px 10px; clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%); background: var(--accent); color: #fff; font-size: 13px; font-weight: 750; }
        .template-modern .skills { grid-template-columns: 1fr 1fr; gap: 5px 22px; }
        .template-modern .skill-group { grid-template-columns: 96px 1fr; align-items: start; }
        .template-modern .skill-group strong { color: #173e52; font-size: 11px; }
        .template-modern .work-entry { padding: 2px 0 8px; }
        .template-modern .work-heading { grid-template-columns: minmax(220px, 1fr) minmax(150px, auto) auto; gap: 12px; padding-bottom: 4px; border-bottom: 1px solid #202b33; }
        .template-modern .work-heading h3 { color: #111820; font-size: 13px; font-weight: 750; }
        .template-modern .work-role { color: #172b36; font-size: 11.5px; text-align: center; }
        .template-modern .work-date { color: #334651; font-size: 11px; font-weight: 700; }
        .template-modern .work-context { margin-top: 5px; color: #34434b; font-size: 11px; }
        .template-modern .work-entry ul { margin-top: 4px; }
        .template-modern .project { padding: 5px 0 8px; }
        .template-modern .project + .project { border-top: 1px solid #dfe5e8; padding-top: 10px; }
        .template-modern .project-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
        .template-modern .project h3 { margin: 0 0 5px; color: #111820; font-size: 14px; font-weight: 750; }
        .template-modern .project-intro, .template-modern .project-stack { margin: 3px 0; }
        .template-modern .project-intro strong, .template-modern .project-stack strong, .template-modern .project-highlights > strong { color: #172b36; }
        .template-modern .project-highlights { margin-top: 4px; }
        .template-modern .project-highlights ul { margin-top: 3px; }
        .template-modern .education-section { margin-top: 10px; color: #52616a; font-size: 10.5px; }
        .template-modern .education-section h2 { background: #6b7f89; }
        .template-modern .education-section ul { display: flex; flex-wrap: wrap; gap: 2px 18px; margin-top: 2px; }
        .template-modern .education-section li { margin: 0; }
        .template-modern li::marker { color: var(--accent); }
        @media (max-width: 760px) {
          .template-modern .skills { grid-template-columns: 1fr; }
          .template-modern .headline { max-width: none; }
          .template-modern .work-heading { grid-template-columns: 1fr auto; }
          .template-modern .work-heading h3 { grid-column: 1 / -1; }
          .template-modern .work-role { text-align: left; }
          .template-modern .education-section ul { display: block; }
        }
      `,
    }),
};
