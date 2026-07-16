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
        @page { size: A4; margin: 8mm 10mm; }
        .template-modern { font-size: 12.5px; line-height: 1.55; }
        .template-modern .resume-page { padding: 10mm 11mm; }
        .template-modern header { display: grid; grid-template-columns: auto 1fr; align-items: end; gap: 18px; padding: 0 0 5px; border-bottom: 2px solid #202b33; text-align: left; }
        .template-modern h1 { color: #111820; font-size: 26px; font-weight: 750; line-height: 1; }
        .template-modern .headline { justify-self: end; margin: 0; color: #263943; font-size: 12.5px; font-weight: 700; line-height: 1.2; }
        .template-modern section { margin-top: 10px; }
        .template-modern .summary-section { padding: 0; }
        .template-modern .summary-section h2 { display: none; }
        .template-modern .summary-section p { max-width: none; margin: 0; color: #34434b; font-size: 12.2px; line-height: 1.55; text-align: left; }
        .template-modern h2 { display: block; margin: 0 0 5px; padding: 0 0 2px; border-bottom: 1.5px solid #202b33; background: none; color: #111820; font-size: 13.2px; font-weight: 750; line-height: 1.3; }
        .template-modern .skills { grid-template-columns: 1fr 1fr; gap: 3px 18px; }
        .template-modern .skill-group { grid-template-columns: 64px 1fr; align-items: start; gap: 7px; }
        .template-modern .skill-group strong { color: #173e52; font-size: 12px; }
        .template-modern .work-entry { padding: 0; }
        .template-modern .work-heading { grid-template-columns: minmax(220px, 1fr) minmax(150px, auto) auto; gap: 10px; padding-bottom: 1px; }
        .template-modern .work-heading h3 { color: #111820; font-size: 13px; font-weight: 750; }
        .template-modern .work-role { color: #172b36; font-size: 12.2px; text-align: center; }
        .template-modern .work-date { color: #334651; font-size: 11.8px; font-weight: 700; }
        .template-modern .work-context { margin-top: 3px; color: #34434b; font-size: 12px; }
        .template-modern .work-entry ul { margin-top: 3px; }
        .template-modern li { margin: 1px 0; }
        .template-modern .project { padding: 0; }
        .template-modern .projects-section { break-inside: auto; }
        .template-modern .project + .project { border-top: 1px solid #dfe5e8; padding-top: 6px; }
        .template-modern .project-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
        .template-modern .project h3 { margin: 0 0 3px; color: #111820; font-size: 13px; font-weight: 750; }
        .template-modern .project-intro, .template-modern .project-stack { margin: 2px 0; }
        .template-modern .project-intro strong, .template-modern .project-stack strong, .template-modern .project-highlights > strong { color: #172b36; }
        .template-modern .project-highlights { margin-top: 3px; }
        .template-modern .project-highlights ul { margin-top: 2px; }
        .template-modern .education-section { margin-top: 9px; color: #52616a; font-size: 11.5px; }
        .template-modern .education-section ul { display: flex; flex-wrap: wrap; gap: 1px 18px; margin-top: 1px; }
        .template-modern .education-section li { margin: 0; }
        .template-modern li::marker { color: var(--accent); }
        @media screen and (max-width: 760px) {
          .template-modern .resume-page { padding: 8mm 7mm; }
          .template-modern .skills { grid-template-columns: 1fr; }
          .template-modern header { grid-template-columns: 1fr; gap: 4px; }
          .template-modern .headline { justify-self: start; max-width: none; }
          .template-modern .work-heading { grid-template-columns: 1fr; gap: 1px; }
          .template-modern .work-heading h3 { grid-column: auto; }
          .template-modern .work-role { text-align: left; }
          .template-modern .work-date { white-space: normal; }
          .template-modern .education-section ul { display: block; }
        }
      `,
    }),
};
