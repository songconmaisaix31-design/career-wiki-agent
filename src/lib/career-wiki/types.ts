export type CareerProfileView = {
  id: string;
  name: string;
  targetRoles: string[];
  education: string;
  currentPosition: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  updatedAt: string;
};

export type CareerProjectView = {
  id: string;
  name: string;
  status: string;
  description: string;
  techStack: string[];
  highlights: string[];
  resumeBullets: string[];
  interviewStory: string;
  updatedAt: string;
};

export type CareerEvidenceTargetType = "project" | "skill" | "bullet" | "work_experience" | "education";

export type CareerEvidenceType = "wiki_project" | "wiki_workflow" | "wiki_changelog" | "baseline_resume" | "user_input" | "external_note";

export type CareerEvidenceStatus = "draft" | "verified" | "rejected";

export type CareerEvidenceItemView = {
  id: string;
  targetType: CareerEvidenceTargetType;
  targetId: string;
  jdTestId: string;
  evidenceType: CareerEvidenceType;
  title: string;
  content: string;
  sourcePath: string;
  sourceExcerpt: string;
  confidence: number;
  status: CareerEvidenceStatus;
  createdAt: string;
  updatedAt: string;
};

export type CareerSkillView = {
  id: string;
  name: string;
  category: string;
  level: string;
  evidence: string;
  learningPriority: string;
  updatedAt: string;
};

export type CareerJdAnalysisView = {
  id: string;
  company: string;
  role: string;
  source: string;
  jdText: string;
  responsibilities: string[];
  requiredSkills: string[];
  bonusPoints: string[];
  matchedProjects: string[];
  skillGaps: string[];
  matchScore: number;
  resumeSuggestions: string[];
  interviewTips: string[];
  updatedAt: string;
};

export type CareerLearningTaskStatus = "todo" | "doing" | "done";

export type CareerLearningTaskView = {
  id: string;
  jdAnalysisId: string;
  title: string;
  description: string;
  relatedSkill: string;
  priority: string;
  dayIndex: number;
  estimatedTime: string;
  outputRequired: string;
  status: CareerLearningTaskStatus;
  updatedAt: string;
};

export type CareerExportLogView = {
  id: string;
  entityType: string;
  entityId: string;
  filePath: string;
  createdAt: string;
};

export type WikiImportProjectPreview = {
  name: string;
  status: string;
  description: string;
  techStack: string[];
  highlights: string[];
  resumeBullets: string[];
  sourceFile: string;
};

export type WikiImportSkillPreview = {
  name: string;
  category: string;
  level: string;
  evidence: string;
  learningPriority: string;
  sourceFile: string;
};

export type WikiImportPreview = {
  projects: WikiImportProjectPreview[];
  skills: WikiImportSkillPreview[];
  warnings: string[];
};

export type ResumeBaselineView = {
  id: string;
  name: string;
  source: string;
  content: Record<string, unknown>;
  workExperience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  selfSummary: string;
  originalResumeText: string;
  updatedAt: string;
};

export type CareerJdTestView = {
  id: string;
  company: string;
  role: string;
  source: string;
  jdText: string;
  targetDirection: string;
  updatedAt: string;
};

export type ResumeComparisonReport = {
  baselineScore: number;
  tailoredScore: number;
  improvementSummary: string[];
  changedSections: string[];
  riskWarnings: string[];
  nextActions: string[];
};

export type ResumeTailorRunView = {
  id: string;
  baselineId: string;
  jdTestId: string;
  jdAnalysis: CareerJdAnalysisView;
  targetedSummary: string;
  targetedSkills: string[];
  selectedProjects: string[];
  rewrittenProjectBullets: string[];
  rewrittenWorkExperience: string[];
  riskNotes: string[];
  missingEvidence: string[];
  finalResumeMarkdown: string;
  comparisonReport: ResumeComparisonReport;
  updatedAt: string;
};

export type ResumeVersionStatus = "draft" | "approved" | "exported" | "archived";

export type ResumeEvidenceSource = "wiki_project" | "wiki_workflow" | "wiki_changelog" | "baseline_resume" | "user_input" | "external_note";

export type ResumeEvidenceItem = {
  section: string;
  content: string;
  evidenceSource: ResumeEvidenceSource | "missing_evidence" | "unknown";
  sourceLabel: string;
  valid: boolean;
  blockingReason: string;
};

export type ResumeDiffSummary = {
  summary: string[];
  skills: string[];
  projectBullets: string[];
  workExperience: string[];
  education: string[];
  addedKeywords: string[];
  removedContent: string[];
  rewrittenContent: string[];
  riskContent: string[];
  unsupportedContent: string[];
};

export type ResumeExportChecklistItem = {
  key: string;
  label: string;
  passed: boolean;
  reason: string;
};

export type CareerResumeVersionView = {
  id: string;
  baselineId: string;
  jdTestId: string;
  tailorRunId: string;
  company: string;
  role: string;
  versionName: string;
  status: ResumeVersionStatus;
  finalResumeMarkdown: string;
  diffSummary: ResumeDiffSummary;
  evidenceSummary: ResumeEvidenceItem[];
  riskNotes: string[];
  exportPath: string;
  checklist: ResumeExportChecklistItem[];
  updatedAt: string;
};

export type CareerWikiData = {
  profile: CareerProfileView;
  projects: CareerProjectView[];
  skills: CareerSkillView[];
  jdAnalyses: CareerJdAnalysisView[];
  learningTasks: CareerLearningTaskView[];
  exportLogs: CareerExportLogView[];
  baselines?: ResumeBaselineView[];
  jdTests?: CareerJdTestView[];
  tailorRuns?: ResumeTailorRunView[];
  resumeVersions?: CareerResumeVersionView[];
  vaultConfigured: boolean;
};

export type ResumeTailorHarnessData = {
  baselines: ResumeBaselineView[];
  jdTests: CareerJdTestView[];
  projects: CareerProjectView[];
  skills: CareerSkillView[];
  tailorRuns: ResumeTailorRunView[];
  resumeVersions: CareerResumeVersionView[];
  evidenceItems: CareerEvidenceItemView[];
  vaultConfigured: boolean;
};
