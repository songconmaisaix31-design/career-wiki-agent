import { describe, expect, it } from "vitest";

import { analyzeResumeWriting } from "./analyze-resume";

describe("analyzeResumeWriting", () => {
  it("reports formulaic language without blocking approval", () => {
    const report = analyzeResumeWriting("## 工作经历\n- 深度参与相关工作，有效推动项目形成闭环。");

    expect(report.passed).toBe(true);
    expect(report.findings.some((item) => item.code === "generic_claim" && item.severity === "warning")).toBe(true);
  });

  it("blocks production overclaiming for ReviewFlow AI", () => {
    const report = analyzeResumeWriting("## 项目经历\n- ReviewFlow AI（WIP / prototype）已成为 production-ready 平台。");

    expect(report.passed).toBe(false);
    expect(report.blockingCount).toBe(1);
    expect(report.findings[0]?.code).toBe("production_status_overclaim");
  });

  it("flags repeated openings, metrics, and keyword stuffing", () => {
    const report = analyzeResumeWriting([
      "## 项目经历",
      "- 使用 TypeScript React Next.js Node.js Prisma SQLite Docker Playwright Tailwind Vitest 构建工具。",
      "- 使用脚本处理 10 万条记录。",
      "- 使用现有接口完成导出。",
    ].join("\n"));

    expect(report.findings.some((item) => item.code === "repeated_sentence_opening")).toBe(true);
    expect(report.findings.some((item) => item.code === "unverified_metric")).toBe(true);
    expect(report.findings.some((item) => item.code === "excessive_keyword_stuffing")).toBe(true);
  });

  it("ignores concise evidence-based bullets", () => {
    const report = analyzeResumeWriting("## 项目经历\n- 为财务报表流程增加字段校验和人工复核节点，异常记录进入单独清单。\n- ReviewFlow AI（WIP / prototype）完成本地评审流程验证。");

    expect(report).toMatchObject({ passed: true, blockingCount: 0, warningCount: 0, score: 100 });
  });
});
