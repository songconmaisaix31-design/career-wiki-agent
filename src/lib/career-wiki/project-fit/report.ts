import type { CareerJdTestView } from "../types";
import type { ProjectFitResult } from "./types";

export function renderProjectFitReport(jdTest: CareerJdTestView, targetDirection: string, results: ProjectFitResult[]) {
  return [
    "---",
    `type: ${JSON.stringify("project_fit_report")}`,
    `company: ${JSON.stringify(jdTest.company)}`,
    `role: ${JSON.stringify(jdTest.role)}`,
    `target_direction: ${JSON.stringify(targetDirection)}`,
    `generated_at: ${JSON.stringify(new Date().toISOString())}`,
    "---",
    "",
    `# ${jdTest.company} - ${jdTest.role} Project Fit Report`,
    "",
    `Target direction: ${targetDirection}`,
    "",
    "## Summary",
    formatList(results.map((result) => `${result.fit_level} · [[${result.project_name}]] · ${result.fit_score} · ${result.recommended_resume_usage}`)),
    "",
    ...["strong_fit", "medium_fit", "weak_fit", "not_recommended", "insufficient_evidence"].flatMap((level) => renderGroup(level, results)),
  ].join("\n");
}

function renderGroup(level: string, results: ProjectFitResult[]) {
  const group = results.filter((result) => result.fit_level === level);
  if (!group.length) return [];
  return [
    `## ${level}`,
    "",
    ...group.flatMap((result) => [
      `### [[${result.project_name}]]`,
      "",
      `- Fit score: ${result.fit_score}`,
      `- Keyword score: ${result.keyword_score}`,
      `- Evidence score: ${result.evidence_score}`,
      `- Domain score: ${result.domain_score}`,
      `- Risk score: ${result.risk_score}`,
      `- Resume usage: ${result.recommended_resume_usage}`,
      result.exclusion_reason ? `- Exclusion reason: ${result.exclusion_reason}` : "- Exclusion reason: none",
      result.override_type ? `- Override: ${result.override_type} - ${result.override_reason ?? ""}` : "- Override: none",
      "",
      "Matched JD requirements:",
      formatList(result.matched_jd_requirements),
      "",
      "Missing JD requirements:",
      formatList(result.missing_jd_requirements),
      "",
      "Supporting evidence:",
      formatList(result.supporting_evidence),
      "",
      "Risk warnings:",
      formatList(result.risk_warnings),
      "",
      "Suggested bullets:",
      formatList(result.suggested_bullets),
      "",
    ]),
  ];
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}
