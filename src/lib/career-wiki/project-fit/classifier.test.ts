import { describe, expect, it } from "vitest";

import type { CareerJdTestView, CareerProjectView } from "../types";
import { applyProjectFitOverride, classifyProjectsForJd, filterProjectsForResume } from "./classifier";
import { renderProjectFitReport } from "./report";

const updatedAt = "2026-07-08T00:00:00.000Z";

const projects: CareerProjectView[] = [
  project({
    id: "finance",
    name: "Finance-Agent-Lab",
    status: "active",
    description: "Finance data automation lab for SQL reports, dashboard metrics, data collection, and data governance workflows.",
    techStack: ["Python", "SQL", "data automation", "dashboard", "data governance"],
    highlights: ["Automated finance report workflow", "Built SQL-backed dashboard checks", "Collected and normalized finance data"],
    resumeBullets: ["Designed a finance data automation workflow with SQL validation and dashboard output."],
    interviewStory: "Source: wiki_project; logs/changelog records verified data automation workflow.",
  }),
  project({
    id: "reviewflow",
    name: "ReviewFlow AI",
    status: "WIP / prototype / semi-finished",
    description: "AI application prototype for code review workflow, LLM-assisted review, and agent-style feedback loops.",
    techStack: ["TypeScript", "LLM", "AI agent", "workflow", "React"],
    highlights: ["Built a prototype AI review workflow", "Connected review prompts with structured feedback"],
    resumeBullets: ["Implemented WIP AI review workflow for semi-finished product exploration."],
    interviewStory: "Source: wiki_project; prototype evidence from local project notes.",
  }),
  project({
    id: "blob",
    name: "Vercel Blob URL Server",
    status: "MVP",
    description: "API integration service for Vercel Blob storage, URL delivery, and solution engineering demos.",
    techStack: ["TypeScript", "Next.js", "Vercel", "Blob", "API", "storage"],
    highlights: ["Delivered storage URL API demo", "Documented customer-facing integration path"],
    resumeBullets: ["Built an MVP Vercel Blob API service for solution integration demos."],
    interviewStory: "Source: wiki_project; workflow notes document API integration.",
  }),
  project({
    id: "unrelated",
    name: "Static Blog Theme",
    status: "active",
    description: "Small static theme experiment.",
    techStack: ["CSS"],
    highlights: ["Created theme colors"],
    resumeBullets: ["Adjusted visual styling."],
    interviewStory: "Source: user_input.",
  }),
  project({
    id: "thin",
    name: "Thin Agent Note",
    status: "draft",
    description: "",
    techStack: [],
    highlights: [],
    resumeBullets: [],
    interviewStory: "",
  }),
];

describe("project fit classifier", () => {
  it("ranks Finance-Agent-Lab as strong fit for Data Automation Engineer", () => {
    const results = classifyProjectsForJd({
      jdTest: jd("Data Automation Engineer", "Need data automation, SQL, dashboard, data collection, data governance, and report workflow experience."),
      projects,
      targetDirection: "Data Automation Engineer",
    });
    const finance = byName(results, "Finance-Agent-Lab");
    expect(finance.fit_level).toBe("strong_fit");
    expect(finance.recommended_resume_usage).toBe("primary_project");
  });

  it("keeps ReviewFlow AI usable for AI Application while preserving WIP risk", () => {
    const results = classifyProjectsForJd({
      jdTest: jd("AI Application Engineer", "Build AI agent, LLM, workflow, RAG, review automation, TypeScript application features."),
      projects,
      targetDirection: "AI Application Engineer",
    });
    const reviewFlow = byName(results, "ReviewFlow AI");
    expect(["medium_fit", "strong_fit"]).toContain(reviewFlow.fit_level);
    expect(reviewFlow.risk_warnings.join(" ")).toMatch(/WIP|prototype|semi-finished/i);
  });

  it("ranks Vercel Blob URL Server at least medium for FDE / Solution Engineer", () => {
    const results = classifyProjectsForJd({
      jdTest: jd("FDE / Solution Engineer", "Need solution engineering, customer integration, API, Vercel, blob storage, delivery demos."),
      projects,
      targetDirection: "FDE / Solution Engineer",
    });
    const blob = byName(results, "Vercel Blob URL Server");
    expect(["medium_fit", "strong_fit"]).toContain(blob.fit_level);
    expect(["supporting_project", "primary_project"]).toContain(blob.recommended_resume_usage);
  });

  it("blocks unrelated and insufficient-evidence projects from full resume selection", () => {
    const results = classifyProjectsForJd({
      jdTest: jd("Data Automation Engineer", "Need data automation, SQL, dashboard, and governance."),
      projects,
      targetDirection: "Data Automation Engineer",
    });
    expect(byName(results, "Static Blog Theme").recommended_resume_usage).toBe("do_not_use");
    expect(byName(results, "Thin Agent Note").fit_level).toBe("insufficient_evidence");
    const selected = filterProjectsForResume(projects, results).map((item) => item.name);
    expect(selected).not.toContain("Static Blog Theme");
    expect(selected).not.toContain("Thin Agent Note");
  });

  it("records manual override reason and renders Obsidian wikilinks", () => {
    const results = classifyProjectsForJd({
      jdTest: jd("AI Application Engineer", "Need AI agent and workflow experience."),
      projects,
      targetDirection: "AI Application Engineer",
    });
    const overridden = applyProjectFitOverride(byName(results, "Static Blog Theme"), {
      overrideType: "force_exclude",
      overrideReason: "No relevant project evidence for this JD.",
    });
    expect(overridden.recommended_resume_usage).toBe("do_not_use");
    expect(overridden.risk_warnings.join(" ")).toContain("Manual override");

    const report = renderProjectFitReport(jd("AI Application Engineer", "Need AI agent and workflow experience."), "AI Application Engineer", [
      overridden,
    ]);
    expect(report).toContain("[[Static Blog Theme]]");
    expect(report).not.toMatch(/api[_ -]?key|cookie|token|Missing Evidence|production-ready/i);
  });
});

function jd(role: string, jdText: string): CareerJdTestView {
  return {
    id: role.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    company: "Fixture Company",
    role,
    source: "fixture",
    jdText,
    targetDirection: role,
    updatedAt,
  };
}

function project(input: Omit<CareerProjectView, "updatedAt">): CareerProjectView {
  return { ...input, updatedAt };
}

function byName(results: ReturnType<typeof classifyProjectsForJd>, name: string) {
  const result = results.find((item) => item.project_name === name);
  if (!result) throw new Error(`Missing result for ${name}`);
  return result;
}
