import { z } from "zod";

export const stringListSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string().trim().min(1)).default([]));

export const careerProfileInputSchema = z.object({
  name: z.string().trim().default(""),
  targetRoles: stringListSchema,
  education: z.string().trim().default(""),
  currentPosition: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  strengths: stringListSchema,
  weaknesses: stringListSchema,
});

export const careerProjectInputSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "项目名称不能为空"),
  status: z.string().trim().default("active"),
  description: z.string().trim().default(""),
  techStack: stringListSchema,
  highlights: stringListSchema,
  resumeBullets: stringListSchema,
  interviewStory: z.string().trim().default(""),
});

export const careerSkillInputSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "技能名称不能为空"),
  category: z.string().trim().default("general"),
  level: z.string().trim().default("learning"),
  evidence: z.string().trim().default(""),
  learningPriority: z.string().trim().default("medium"),
});

export const careerJdInputSchema = z.object({
  company: z.string().trim().min(1, "公司不能为空"),
  role: z.string().trim().min(1, "岗位不能为空"),
  source: z.string().trim().default("manual"),
  jdText: z.string().trim().min(20, "JD 内容太短，无法分析"),
});

export const learningTaskGenerateInputSchema = z.object({
  jdAnalysisId: z.string().trim().min(1),
});

export const learningTaskUpdateInputSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["todo", "doing", "done"]),
});

export const wikiImportApplyInputSchema = z.object({
  dryRun: z.boolean().default(false),
});

export const resumeBaselineInputSchema = z.object({
  name: z.string().trim().default("baseline_resume_2025"),
  source: z.string().trim().default("manual"),
  markdown: z.string().trim().optional(),
});

export const jdTestInputSchema = z.object({
  company: z.string().trim().min(1, "公司不能为空"),
  role: z.string().trim().min(1, "岗位不能为空"),
  source: z.string().trim().default("manual"),
  jdText: z.string().trim().min(20, "JD 内容太短，无法测试"),
  targetDirection: z.string().trim().min(1, "目标方向不能为空"),
});

export const tailorRunInputSchema = z.object({
  baselineId: z.string().trim().min(1).optional(),
  jdTestIds: z.array(z.string().trim().min(1)).min(1),
  projectIds: z.array(z.string().trim().min(1)).optional(),
});

export const tailorExportInputSchema = z.object({
  runIds: z.array(z.string().trim().min(1)).min(1),
});

export const resumeVersionCreateInputSchema = z.object({
  tailorRunId: z.string().trim().min(1),
  versionName: z.string().trim().default(""),
});

export const resumeVersionUpdateInputSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["draft", "approved", "exported", "archived"]),
});

export const resumeVersionExportInputSchema = z.object({
  versionId: z.string().trim().min(1),
});

export const documentIngestConfirmInputSchema = z.object({
  purpose: z.enum(["jd", "resume_baseline"]),
  markdown: z.string().trim().min(20, "解析内容太短，无法保存"),
  title: z.string().trim().default("Imported Document"),
  parser: z.string().trim().default("unknown"),
  source: z.string().trim().default("document-ingest"),
  company: z.string().trim().default("Imported JD"),
  role: z.string().trim().default("Imported Role"),
  targetDirection: z.string().trim().default("Imported JD"),
  baselineName: z.string().trim().default("imported_baseline_resume"),
});

export const resumeVersionRenderInputSchema = z.object({
  versionId: z.string().trim().min(1),
  format: z.enum(["markdown", "json", "html"]).default("html"),
  template: z.enum(["modern", "ats", "compact"]).default("modern"),
  page_size: z.enum(["A4"]).default("A4"),
});

export const resumeVersionExportFormatInputSchema = z.object({
  versionId: z.string().trim().min(1),
  format: z.enum(["markdown", "json", "html", "docx", "pdf"]),
  template: z.enum(["modern", "ats", "compact"]).default("modern"),
  page_size: z.enum(["A4"]).default("A4"),
  include_internal_reports: z.boolean().default(false),
});

export const projectFitRunInputSchema = z.object({
  jdTestId: z.string().trim().min(1),
  targetDirection: z.string().trim().optional(),
  exportReport: z.boolean().default(false),
});

export const projectFitOverrideInputSchema = z.object({
  id: z.string().trim().min(1),
  overrideType: z.enum(["force_include", "force_exclude", "needs_review"]),
  overrideReason: z.string().trim().min(5, "Override reason is required"),
});

export const evidenceInputSchema = z.object({
  id: z.string().trim().optional(),
  targetType: z.enum(["project", "skill", "bullet", "work_experience", "education"]),
  targetId: z.string().trim().min(1, "targetId is required"),
  jdTestId: z.string().trim().default(""),
  evidenceType: z.enum(["wiki_project", "wiki_workflow", "wiki_changelog", "baseline_resume", "user_input", "external_note"]),
  title: z.string().trim().min(1, "Evidence title is required"),
  content: z.string().trim().min(10, "Evidence content is too short"),
  sourcePath: z.string().trim().default("manual_input"),
  sourceExcerpt: z.string().trim().default(""),
  confidence: z.coerce.number().min(0).max(100).default(70),
  status: z.enum(["draft", "verified", "rejected"]).default("draft"),
});

export const evidenceUpdateInputSchema = evidenceInputSchema.extend({
  id: z.string().trim().min(1),
});

export const evidenceDeleteInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const evidenceExportInputSchema = z.object({
  jdTestId: z.string().trim().default(""),
});

export type CareerProfileInput = z.infer<typeof careerProfileInputSchema>;
export type CareerProjectInput = z.infer<typeof careerProjectInputSchema>;
export type CareerSkillInput = z.infer<typeof careerSkillInputSchema>;
export type CareerJdInput = z.infer<typeof careerJdInputSchema>;
export type ResumeBaselineInput = z.infer<typeof resumeBaselineInputSchema>;
export type CareerJdTestInput = z.infer<typeof jdTestInputSchema>;
export type ResumeVersionCreateInput = z.infer<typeof resumeVersionCreateInputSchema>;
export type DocumentIngestConfirmInput = z.infer<typeof documentIngestConfirmInputSchema>;
export type ResumeVersionRenderInput = z.infer<typeof resumeVersionRenderInputSchema>;
export type ResumeVersionExportFormatInput = z.infer<typeof resumeVersionExportFormatInputSchema>;
export type ProjectFitRunInput = z.infer<typeof projectFitRunInputSchema>;
export type ProjectFitOverrideInput = z.infer<typeof projectFitOverrideInputSchema>;
export type EvidenceInput = z.infer<typeof evidenceInputSchema>;
export type EvidenceUpdateInput = z.infer<typeof evidenceUpdateInputSchema>;
export type EvidenceDeleteInput = z.infer<typeof evidenceDeleteInputSchema>;
export type EvidenceExportInput = z.infer<typeof evidenceExportInputSchema>;
