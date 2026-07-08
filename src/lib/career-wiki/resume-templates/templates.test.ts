import { describe, expect, it } from "vitest";

import aiEngineer from "../../../../tests/fixtures/career-wiki/resume-render-schema-ai-engineer.json";
import dataAutomation from "../../../../tests/fixtures/career-wiki/resume-render-schema-data-automation.json";
import fde from "../../../../tests/fixtures/career-wiki/resume-render-schema-fde.json";
import { sanitizeWindowsFilename } from "../rules";
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
});
