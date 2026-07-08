import type { ResumeRenderSchema } from "../resume-render-schema";
import type { ResumeTemplateId } from "../resume-templates/templates";

export function renderResumeJson(schema: ResumeRenderSchema, template: ResumeTemplateId = "modern") {
  return JSON.stringify({ ...schema, metadata: { ...schema.metadata, template, page_size: "A4" } }, null, 2);
}
