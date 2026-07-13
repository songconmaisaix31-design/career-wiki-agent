export const careerWorkflowStates = [
  "profile_ready",
  "projects_ready",
  "skills_ready",
  "jd_imported",
  "project_fit_reviewed",
  "evidence_reviewed",
  "resume_drafted",
  "diff_reviewed",
  "resume_approved",
  "exported",
  "archived",
] as const;

export type CareerWorkflowState = (typeof careerWorkflowStates)[number];

export type CareerWorkflowRunView = {
  id: string;
  name: string;
  jdTestId: string;
  resumeVersionId: string;
  currentState: CareerWorkflowState;
  status: "active" | "completed" | "archived";
  checklist: CareerWorkflowCheck[];
  createdAt: string;
  updatedAt: string;
};

export type CareerWorkflowEventView = {
  id: string;
  workflowRunId: string;
  fromState: CareerWorkflowState | "";
  toState: CareerWorkflowState;
  action: string;
  reason: string;
  guardResult: CareerWorkflowGuardResult;
  createdAt: string;
};

export type CareerWorkflowCheck = {
  key: string;
  label: string;
  passed: boolean;
  reason: string;
  severity: "info" | "warning" | "blocking";
};

export type CareerWorkflowGuardResult = {
  allowed: boolean;
  checks: CareerWorkflowCheck[];
  overrideRequired: boolean;
};

export type CareerWorkflowStartInput = {
  name?: string;
  jdTestId?: string;
  resumeVersionId?: string;
};

export type CareerWorkflowTransitionInput = {
  workflowRunId: string;
  toState: CareerWorkflowState;
  reason?: string;
};
