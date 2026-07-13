import { describe, expect, it, vi } from "vitest";

import { runOneClickCareerFlow } from "./one-click-flow";
import type { CareerJdTestView, CareerResumeVersionView, ResumeTailorRunView } from "./types";

const jdTest = {
  id: "jd-1",
  company: "Example",
  role: "AI Engineer",
  source: "manual",
  jdText: "Build and evaluate evidence-backed AI applications.",
  targetDirection: "AI Engineer",
  updatedAt: "2026-07-12T00:00:00.000Z",
} satisfies CareerJdTestView;

const run = { id: "run-1" } as ResumeTailorRunView;
const version = { id: "version-1", status: "draft" } as CareerResumeVersionView;

describe("runOneClickCareerFlow", () => {
  it("runs fit, tailoring, and draft creation in order for an existing JD", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ runs: [run] })
      .mockResolvedValueOnce({ version, checklist: [] });

    const result = await runOneClickCareerFlow({ baselineId: "baseline-1", jd: { mode: "existing", jdTest } }, request);

    expect(request.mock.calls.map(([url]) => url)).toEqual([
      "/api/career-wiki/project-fit/run",
      "/api/career-wiki/resume-tests/run",
      "/api/career-wiki/resume-versions",
    ]);
    expect(result.version.status).toBe("draft");
  });

  it("creates a manual JD before running the flow", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ jdTest })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ runs: [run] })
      .mockResolvedValueOnce({ version, checklist: [] });

    await runOneClickCareerFlow(
      { baselineId: "baseline-1", jd: { mode: "manual", company: "Example", role: "AI Engineer", jdText: jdTest.jdText } },
      request,
    );

    expect(request.mock.calls[0][0]).toBe("/api/career-wiki/resume-tests");
    expect(request.mock.calls[0][1]).toMatchObject({ source: "manual-one-click", targetDirection: "AI Engineer" });
  });
});
