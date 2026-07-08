import type { ResumeRenderSchema } from "../resume-render-schema";

export function renderResumeJson(schema: ResumeRenderSchema) {
  return JSON.stringify(schema, null, 2);
}
