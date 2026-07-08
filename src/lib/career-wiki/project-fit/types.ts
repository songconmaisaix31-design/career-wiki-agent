import type { CareerJdTestView, CareerProjectView } from "../types";

export type ProjectFitLevel = "strong_fit" | "medium_fit" | "weak_fit" | "not_recommended" | "insufficient_evidence";

export type ProjectResumeUsage = "primary_project" | "supporting_project" | "mention_only" | "do_not_use" | "needs_manual_review";

export type ProjectFitOverrideType = "force_include" | "force_exclude" | "needs_review";

export type ProjectFitResult = {
  id?: string;
  jd_test_id?: string;
  project_id: string;
  project_name: string;
  fit_level: ProjectFitLevel;
  fit_score: number;
  keyword_score: number;
  evidence_score: number;
  domain_score: number;
  risk_score: number;
  matched_jd_requirements: string[];
  missing_jd_requirements: string[];
  supporting_evidence: string[];
  risk_warnings: string[];
  recommended_resume_usage: ProjectResumeUsage;
  suggested_bullets: string[];
  exclusion_reason: string;
  override_type?: ProjectFitOverrideType;
  override_reason?: string;
  updated_at?: string;
};

export type ProjectFitRunInput = {
  jdTestId: string;
  targetDirection?: string;
  exportReport?: boolean;
};

export type ProjectFitOverrideInput = {
  id: string;
  overrideType: ProjectFitOverrideType;
  overrideReason: string;
};

export type ProjectFitRunContext = {
  jdTest: CareerJdTestView;
  projects: CareerProjectView[];
  targetDirection?: string;
};

export type ProjectFitReport = {
  jdTest: CareerJdTestView;
  targetDirection: string;
  results: ProjectFitResult[];
  exportedFile?: string;
};
