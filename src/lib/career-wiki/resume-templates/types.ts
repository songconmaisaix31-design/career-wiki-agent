import type { ResumeRenderSchema } from "../resume-render-schema";

export type ResumeTemplateId = "modern" | "ats" | "compact";
export type ResumePageSize = "A4";

export type ResumeTemplate = {
  id: ResumeTemplateId;
  label: string;
  description: string;
  render: (schema: ResumeRenderSchema) => string;
};
