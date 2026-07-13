import { describe, expect, it } from "vitest";

import { findSensitiveContentIssues, redactSensitiveContent } from "./security/sensitive-scan";
import { canTransitionWorkflow } from "./workflow/state-machine";

describe("production quality guards", () => {
  it("allows only explicit workflow transitions", () => {
    expect(canTransitionWorkflow("profile_ready", "projects_ready")).toBe(true);
    expect(canTransitionWorkflow("profile_ready", "resume_approved")).toBe(false);
    expect(canTransitionWorkflow("exported", "archived")).toBe(true);
  });

  it("blocks secret-like values and private keys", () => {
    const issues = findSensitiveContentIssues("token=abc123\n-----BEGIN PRIVATE KEY-----", { includeUnsupportedClaims: true });
    expect(issues.map((issue) => issue.type)).toContain("secret");
    expect(issues.map((issue) => issue.type)).toContain("private_key");
  });

  it("blocks unsupported final resume claims", () => {
    const issues = findSensitiveContentIssues("ReviewFlow AI is a production-ready automation platform.", { includeUnsupportedClaims: true });
    expect(issues.map((issue) => issue.label)).toContain("production-ready overclaim");
    expect(issues.map((issue) => issue.label)).toContain("ReviewFlow AI status is not constrained");
  });

  it("redacts audit text without removing the surrounding event", () => {
    expect(redactSensitiveContent("saved token=abc123 for local test")).toBe("saved token=[REDACTED] for local test");
  });
});
