import type { ResumeRenderSchema } from "../resume-render-schema";
import { getResumeTemplate, type ResumeTemplateId } from "../resume-templates/templates";

export function renderResumeHtml(schema: ResumeRenderSchema, template: ResumeTemplateId = "modern") {
  return getResumeTemplate(template).render(schema);
}
