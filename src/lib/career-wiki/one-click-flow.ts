import type { CareerJdTestView, CareerResumeVersionView, ResumeExportChecklistItem, ResumeTailorRunView } from "./types";
import type { ProjectFitResult } from "./project-fit/types";

export type OneClickJdInput =
  | { mode: "existing"; jdTest: CareerJdTestView }
  | {
      mode: "manual";
      company: string;
      role: string;
      jdText: string;
    };

export type OneClickFlowRequest = <T>(url: string, body: unknown) => Promise<T>;

export type OneClickFlowResult = {
  jdTest: CareerJdTestView;
  fitResults: ProjectFitResult[];
  run: ResumeTailorRunView;
  version: CareerResumeVersionView;
  checklist: ResumeExportChecklistItem[];
};

export async function runOneClickCareerFlow(
  input: { baselineId: string; jd: OneClickJdInput },
  request: OneClickFlowRequest,
): Promise<OneClickFlowResult> {
  const jdTest =
    input.jd.mode === "existing"
      ? input.jd.jdTest
      : (
          await request<{ jdTest: CareerJdTestView }>("/api/career-wiki/resume-tests", {
            company: input.jd.company,
            role: input.jd.role,
            source: "manual-one-click",
            jdText: input.jd.jdText,
            targetDirection: input.jd.role,
          })
        ).jdTest;

  const fitResponse = await request<{ results: ProjectFitResult[] }>("/api/career-wiki/project-fit/run", {
    jdTestId: jdTest.id,
    targetDirection: jdTest.targetDirection,
    exportReport: false,
  });
  const tailorResponse = await request<{ runs: ResumeTailorRunView[] }>("/api/career-wiki/resume-tests/run", {
    baselineId: input.baselineId,
    jdTestIds: [jdTest.id],
  });
  const run = tailorResponse.runs[0];
  if (!run) throw new Error("没有生成简历草稿，请检查基准简历和 JD。");

  const versionResponse = await request<{ version: CareerResumeVersionView; checklist: ResumeExportChecklistItem[] }>(
    "/api/career-wiki/resume-versions",
    { tailorRunId: run.id },
  );

  return {
    jdTest,
    fitResults: fitResponse.results,
    run,
    version: versionResponse.version,
    checklist: versionResponse.checklist,
  };
}
