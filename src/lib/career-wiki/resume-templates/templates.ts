import { atsTemplate } from "./ats";
import { compactTemplate } from "./compact";
import { modernTemplate } from "./modern";
import type { ResumeTemplate, ResumeTemplateId } from "./types";

export const resumeTemplates: ResumeTemplate[] = [modernTemplate, atsTemplate, compactTemplate];
export const resumeTemplateIds = resumeTemplates.map((template) => template.id) as ResumeTemplateId[];

export function getResumeTemplate(id: ResumeTemplateId = "modern") {
  return resumeTemplates.find((template) => template.id === id) ?? modernTemplate;
}

export function isResumeTemplateId(value: unknown): value is ResumeTemplateId {
  return value === "modern" || value === "ats" || value === "compact";
}

export type { ResumePageSize, ResumeTemplateId } from "./types";
