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

export type CareerWikiData = {
  profile: CareerProfileView;
  projects: CareerProjectView[];
  skills: CareerSkillView[];
  jdAnalyses: CareerJdAnalysisView[];
  learningTasks: CareerLearningTaskView[];
  exportLogs: CareerExportLogView[];
  vaultConfigured: boolean;
};

