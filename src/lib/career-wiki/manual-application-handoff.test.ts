import { describe, expect, it } from "vitest";

import { parseHttpUrl, validateManualApplicationHandoff } from "./manual-application-handoff";

const validInput = {
  versionId: "version-1",
  action: "ready_for_manual_send" as const,
  confirmed: false,
  status: "exported",
  company: "Acme",
  role: "AI Engineer",
  source: "https://example.com/jobs/123",
  exportPath: "D:\\CareerVault\\resume.md",
  exportFileExists: true,
};

describe("manual application handoff", () => {
  it("prepares an exported resume and source URL for manual use", () => {
    expect(validateManualApplicationHandoff(validInput)).toMatchObject({
      action: "ready_for_manual_send",
      sourceUrl: "https://example.com/jobs/123",
      resumePath: validInput.exportPath,
    });
  });

  it("requires explicit confirmation before marking a manual send", () => {
    expect(() => validateManualApplicationHandoff({ ...validInput, action: "manually_sent" })).toThrow("明确确认");
  });

  it("blocks drafts, missing exports, and non-http sources", () => {
    expect(() => validateManualApplicationHandoff({ ...validInput, status: "approved" })).toThrow("批准并导出");
    expect(() => validateManualApplicationHandoff({ ...validInput, exportFileExists: false })).toThrow("找不到");
    expect(() => validateManualApplicationHandoff({ ...validInput, source: "manual" })).toThrow("HTTP(S)");
  });

  it("rejects local files and script URLs", () => {
    expect(parseHttpUrl("file:///D:/resume.md")).toBe("");
    expect(parseHttpUrl("javascript:alert(1)")).toBe("");
  });
});
