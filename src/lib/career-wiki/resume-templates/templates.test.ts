import { describe, expect, it } from "vitest";

import aiEngineer from "../../../../tests/fixtures/career-wiki/resume-render-schema-ai-engineer.json";
import dataAutomation from "../../../../tests/fixtures/career-wiki/resume-render-schema-data-automation.json";
import fde from "../../../../tests/fixtures/career-wiki/resume-render-schema-fde.json";
import { sanitizeResumeRoleLabel, sanitizeWindowsFilename } from "../rules";
import type { ResumeRenderSchema } from "../resume-render-schema";
import { getResumeTemplate, resumeTemplateIds } from "./templates";

const fixtures = [aiEngineer, fde, dataAutomation] as ResumeRenderSchema[];

describe("resume templates", () => {
  it("renders every fixture with every template", () => {
    for (const fixture of fixtures) {
      for (const templateId of resumeTemplateIds) {
        const html = getResumeTemplate(templateId).render(fixture);
        expect(html).toContain("<!doctype html>");
        expect(html).toContain("项目经历");
        expect(html).not.toMatch(/Missing Evidence|production-ready|api[_ -]?key|cookie|token/i);
      }
    }
  });

  it("keeps exported filenames Windows-safe", () => {
    expect(sanitizeWindowsFilename("Acme:AI/Application*Engineer-v1-modern-final-resume.html")).toBe(
      "Acme-AI-Application-Engineer-v1-modern-final-resume.html",
    );
  });

  it("removes JD source annotations from resume labels", () => {
    expect(sanitizeResumeRoleLabel("AI Engineer（应届/在校，职位长图）")).toBe("AI Engineer");
  });

  it("renders the modern project hierarchy and keeps education after projects", () => {
    const fixture = {
      ...fixtures[0],
      projects: fixtures[0].projects.map((project, index) =>
        index === 0 ? { ...project, bullets: [...project.bullets, "Implemented a verified workflow boundary."] } : project,
      ),
    };
    const html = getResumeTemplate("modern").render(fixture);

    expect(html).toContain('class="project-intro"');
    expect(html).toContain('class="project-stack"');
    expect(html).toContain('class="project-highlights"');
    expect(html.indexOf('class="projects-section"')).toBeLessThan(html.indexOf('class="education-section"'));
  });

  it("renders structured work experience as a dense heading and evidence list", () => {
    const fixture = {
      ...fixtures[0],
      work_experience: [
        "Langfang Taixin｜Data Operations (AI Automation)｜2026.05-2026.07",
        "City operations service provider for six cities.",
        "Built repeatable data workflows.",
      ],
    };
    const html = getResumeTemplate("modern").render(fixture);

    expect(html).toContain('class="work-heading"');
    expect(html).toContain('class="work-role"');
    expect(html).toContain('class="work-date"');
    expect(html).toContain('class="work-context"');
    expect(html).toContain("Built repeatable data workflows.");
  });
});
