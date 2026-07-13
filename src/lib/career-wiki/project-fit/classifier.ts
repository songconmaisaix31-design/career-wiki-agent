import { scoreProjectDomain } from "./domain-score";
import { scoreProjectEvidence } from "./evidence-score";
import { scoreProjectKeywords } from "./keyword-score";
import { scoreProjectRisk } from "./risk-score";
import type { ProjectFitLevel, ProjectFitOverrideInput, ProjectFitResult, ProjectFitRunContext, ProjectResumeUsage } from "./types";
import type { CareerEvidenceItemView, CareerProjectView } from "../types";

export function classifyProjectsForJd(context: ProjectFitRunContext): ProjectFitResult[] {
  return context.projects
    .filter((project) => !isLowSignalProject(project.name) && !isExplicitlyExcludedProject(project))
    .map((project) => classifyProject(context, project))
    .sort((left, right) => right.fit_score - left.fit_score);
}

export function applyProjectFitOverride(result: ProjectFitResult, override: Pick<ProjectFitOverrideInput, "overrideType" | "overrideReason">): ProjectFitResult {
  const warning = `Manual override: ${override.overrideType} - ${override.overrideReason}`;
  if (override.overrideType === "force_exclude") {
    return {
      ...result,
      fit_level: "not_recommended",
      recommended_resume_usage: "do_not_use",
      exclusion_reason: override.overrideReason,
      override_type: override.overrideType,
      override_reason: override.overrideReason,
      risk_warnings: [...new Set([...result.risk_warnings, warning])],
    };
  }
  if (override.overrideType === "needs_review") {
    return {
      ...result,
      recommended_resume_usage: "needs_manual_review",
      override_type: override.overrideType,
      override_reason: override.overrideReason,
      risk_warnings: [...new Set([...result.risk_warnings, warning])],
    };
  }
  return {
    ...result,
    fit_level: result.evidence_score < 30 ? "insufficient_evidence" : result.fit_level,
    recommended_resume_usage: result.evidence_score < 30 ? "needs_manual_review" : "supporting_project",
    override_type: override.overrideType,
    override_reason: override.overrideReason,
    risk_warnings: [...new Set([...result.risk_warnings, warning])],
  };
}

export function filterProjectsForResume(projects: CareerProjectView[], projectFitResults: ProjectFitResult[] = []) {
  if (!projectFitResults.length) return projects;
  const usable = new Map(
    projectFitResults
      .filter((result) => result.recommended_resume_usage === "primary_project" || result.recommended_resume_usage === "supporting_project")
      .map((result) => [result.project_id, result]),
  );
  return projects
    .filter((project) => usable.has(project.id))
    .sort((left, right) => (usable.get(right.id)?.fit_score ?? 0) - (usable.get(left.id)?.fit_score ?? 0));
}

function classifyProject(context: ProjectFitRunContext, project: CareerProjectView): ProjectFitResult {
  const projectEvidence = evidenceForProject(project, context.evidenceItems ?? []);
  const scoredProject = appendVerifiedEvidence(project, projectEvidence);
  const keyword = scoreProjectKeywords(context.jdTest, scoredProject);
  const evidence = scoreProjectEvidence(project, projectEvidence);
  const domainScore = scoreProjectDomain(context.jdTest, scoredProject, context.targetDirection);
  const risk = scoreProjectRisk(project, evidence.score, keyword.score);
  const fitScore = clamp(Math.round(keyword.score * 0.35 + evidence.score * 0.3 + domainScore * 0.25 - risk.score * 0.2 + directNameBoost(project.name, context.jdTest.jdText) + verifiedEvidenceBoost(projectEvidence)));
  const fit = decideFit(fitScore, evidence.score, risk.score);
  return {
    project_id: project.id,
    project_name: project.name,
    fit_level: fit.level,
    fit_score: fitScore,
    keyword_score: keyword.score,
    evidence_score: evidence.score,
    domain_score: domainScore,
    risk_score: risk.score,
    matched_jd_requirements: keyword.matched,
    missing_jd_requirements: keyword.missing.slice(0, 16),
    supporting_evidence: evidence.evidence,
    risk_warnings: risk.warnings,
    recommended_resume_usage: fit.usage,
    suggested_bullets: buildSuggestedBullets(scoredProject, keyword.matched, fit.usage, projectEvidence),
    exclusion_reason: fit.exclusionReason,
  };
}

function decideFit(fitScore: number, evidenceScore: number, riskScore: number): { level: ProjectFitLevel; usage: ProjectResumeUsage; exclusionReason: string } {
  if (evidenceScore < 25) return { level: "insufficient_evidence", usage: "needs_manual_review", exclusionReason: "Evidence score is below final resume threshold." };
  if (fitScore >= 72 && riskScore < 70) return { level: "strong_fit", usage: "primary_project", exclusionReason: "" };
  if (fitScore >= 55) return { level: "medium_fit", usage: "supporting_project", exclusionReason: "" };
  if (fitScore >= 35) return { level: "weak_fit", usage: "mention_only", exclusionReason: "Can be mentioned only if space allows." };
  return { level: "not_recommended", usage: "do_not_use", exclusionReason: "Low JD match score." };
}

function buildSuggestedBullets(project: CareerProjectView, matchedRequirements: string[], usage: ProjectResumeUsage, evidenceItems: CareerEvidenceItemView[] = []) {
  if (usage === "do_not_use" || usage === "needs_manual_review") return [];
  const status = /wip|prototype|mvp|semi-finished|draft/i.test(project.status) ? `（项目状态：${project.status}）` : "";
  const verifiedEvidence = evidenceItems.filter((item) => item.status === "verified").map((item) => item.content);
  const source = (project.resumeBullets.length ? project.resumeBullets : project.highlights.length ? project.highlights : verifiedEvidence).filter((item) => !/missing evidence|production-ready/i.test(item));
  return source.slice(0, usage === "primary_project" ? 3 : 2).map((bullet) => {
    const matched = matchedRequirements.slice(0, 3).join(", ");
    return `${project.name}${status}: ${bullet}${matched ? `（JD match: ${matched}）` : ""}`;
  });
}

function evidenceForProject(project: CareerProjectView, evidenceItems: CareerEvidenceItemView[]) {
  return evidenceItems.filter((item) => item.targetId === project.id || item.targetId === project.name);
}

function verifiedEvidenceBoost(evidenceItems: CareerEvidenceItemView[]) {
  return evidenceItems.some((item) => item.status === "verified") ? 18 : 0;
}

function appendVerifiedEvidence(project: CareerProjectView, evidenceItems: CareerEvidenceItemView[]): CareerProjectView {
  const verified = evidenceItems.filter((item) => item.status === "verified");
  if (!verified.length) return project;
  return {
    ...project,
    description: [project.description, ...verified.map((item) => item.content)].filter(Boolean).join("\n"),
    interviewStory: [project.interviewStory, ...verified.map((item) => `Verified evidence (${item.evidenceType}): ${item.title} Source: ${item.sourcePath || item.sourceExcerpt}`)]
      .filter(Boolean)
      .join("\n"),
  };
}

function directNameBoost(projectName: string, jdText: string) {
  return normalize(jdText).includes(normalize(projectName)) ? 10 : 0;
}

function isLowSignalProject(name: string) {
  return /^\.|^(scripts?|n8n|index|project index|workflows?)$/i.test(name.trim());
}

function isExplicitlyExcludedProject(project: CareerProjectView) {
  return /archived|do[_ -]?not[_ -]?use|excluded/i.test(project.status);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
