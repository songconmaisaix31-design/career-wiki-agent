import { describe, expect, it } from "vitest";

import { analyzeCareerJd, generateSevenDayTasks, sanitizeWindowsFilename } from "./rules";
import type { CareerProjectView, CareerSkillView } from "./types";

const projects: CareerProjectView[] = [
  {
    id: "project-1",
    name: "Finance-Agent-Lab",
    status: "active",
    description: "RAG and TypeScript agent for finance workflows",
    techStack: ["TypeScript", "Next.js", "RAG"],
    highlights: ["Built retrieval workflow"],
    resumeBullets: [],
    interviewStory: "",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
];

const skills: CareerSkillView[] = [
  {
    id: "skill-1",
    name: "TypeScript",
    category: "frontend",
    level: "advanced",
    evidence: "Used in Finance-Agent-Lab",
    learningPriority: "medium",
    updatedAt: "2026-07-08T00:00:00.000Z",
  },
];

describe("career wiki rules", () => {
  it("analyzes JD with project matches and skill gaps", () => {
    const analysis = analyzeCareerJd(
      {
        company: "Acme",
        role: "AI Product Engineer",
        source: "manual",
        jdText: "负责使用 TypeScript 和 RAG 建设 AI workflow。熟悉 Python 加分，了解 SQL 优先。",
      },
      projects,
      skills,
    );

    expect(analysis.requiredSkills).toContain("TypeScript");
    expect(analysis.requiredSkills).toContain("RAG");
    expect(analysis.skillGaps).toContain("RAG");
    expect(analysis.matchedProjects).toEqual(["Finance-Agent-Lab"]);
    expect(analysis.matchScore).toBeGreaterThan(50);
  });

  it("generates seven fallback learning tasks", () => {
    const analysis = analyzeCareerJd(
      {
        company: "Acme",
        role: "AI Product Engineer",
        source: "manual",
        jdText: "负责 TypeScript、RAG、SQL 和 Python 相关项目交付，要求能独立输出方案。",
      },
      projects,
      skills,
    );

    const tasks = generateSevenDayTasks({ id: "analysis-1", updatedAt: "2026-07-08T00:00:00.000Z", ...analysis }, skills);

    expect(tasks).toHaveLength(7);
    expect(tasks[0].status).toBe("todo");
    expect(tasks.map((task) => task.dayIndex)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("sanitizes Windows filenames", () => {
    expect(sanitizeWindowsFilename("Acme:AI/Product*Engineer?")).toBe("Acme-AI-Product-Engineer");
  });
});

