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
  vaultConfigured: boolean;
};

export type ResumeTailorHarnessData = {
  baselines: ResumeBaselineView[];
  jdTests: CareerJdTestView[];
  tailorRuns: ResumeTailorRunView[];
  vaultConfigured: boolean;
};
