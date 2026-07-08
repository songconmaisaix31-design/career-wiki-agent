import type { CareerProjectView } from "../types";

export type EvidenceScoreResult = {
  score: number;
  evidence: string[];
};

export function scoreProjectEvidence(project: CareerProjectView): EvidenceScoreResult {
  const evidence: string[] = [];
  if (project.description.trim().length >= 30) evidence.push("Project description is present.");
  if (project.techStack.length >= 2) evidence.push(`Tech stack: ${project.techStack.slice(0, 6).join(", ")}`);
  if (project.highlights.length) evidence.push(`Highlights: ${project.highlights.slice(0, 3).join(" / ")}`);
  if (project.resumeBullets.length) evidence.push(`Resume bullets: ${project.resumeBullets.slice(0, 2).join(" / ")}`);
  if (/source:|wiki|changelog|workflow|obsidian|evidence|验证|记录|来源/i.test(project.interviewStory)) {
    evidence.push("Wiki/source evidence is recorded.");
  }

  const score = Math.min(
    100,
    (project.description.trim() ? 15 : 0) +
      Math.min(project.techStack.length * 8, 24) +
      Math.min(project.highlights.length * 10, 30) +
      Math.min(project.resumeBullets.length * 10, 20) +
      (/source:|wiki|changelog|workflow|obsidian|evidence|验证|记录|来源/i.test(project.interviewStory) ? 20 : 0),
  );
  return { score, evidence };
}
