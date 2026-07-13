import type { CareerWorkflowState } from "./types";

export const workflowTransitions: Record<CareerWorkflowState, CareerWorkflowState[]> = {
  profile_ready: ["projects_ready", "archived"],
  projects_ready: ["skills_ready", "archived"],
  skills_ready: ["jd_imported", "archived"],
  jd_imported: ["project_fit_reviewed", "archived"],
  project_fit_reviewed: ["evidence_reviewed", "archived"],
  evidence_reviewed: ["resume_drafted", "archived"],
  resume_drafted: ["diff_reviewed", "archived"],
  diff_reviewed: ["resume_approved", "archived"],
  resume_approved: ["exported", "archived"],
  exported: ["archived"],
  archived: [],
};

export function canTransitionWorkflow(fromState: CareerWorkflowState, toState: CareerWorkflowState) {
  return workflowTransitions[fromState]?.includes(toState) ?? false;
}
