export type SensitiveScanIssue = {
  type: "secret" | "private_key" | "account" | "unsupported_claim";
  label: string;
  severity: "blocking" | "warning";
};

export function findSensitiveContentIssues(
  text: string,
  options: { includeUnsupportedClaims?: boolean } = {},
): SensitiveScanIssue[] {
  const issues: SensitiveScanIssue[] = [];
  if (/(api[_ -]?key|cookie|token|password|secret|authorization)\s*[:=]\s*\S+/i.test(text)) {
    issues.push({ type: "secret", label: "Secret-like key/value content", severity: "blocking" });
  }
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(text)) {
    issues.push({ type: "private_key", label: "Private key block", severity: "blocking" });
  }
  if (/(linkedin|boss|智联|招聘平台).{0,16}(账号|account|password|cookie|token)/i.test(text)) {
    issues.push({ type: "account", label: "Recruiting platform account or credential content", severity: "blocking" });
  }
  if (options.includeUnsupportedClaims) {
    if (/production-ready|production_ready/i.test(text)) {
      issues.push({ type: "unsupported_claim", label: "production-ready overclaim", severity: "blocking" });
    }
    if (/missing evidence|missing_evidence|Missing Evidence/i.test(text)) {
      issues.push({ type: "unsupported_claim", label: "missing evidence marker", severity: "blocking" });
    }
    if (text.split(/\r?\n/).some((line) => /ReviewFlow AI/i.test(line) && !/wip|prototype|semi-finished|项目状态/i.test(line))) {
      issues.push({ type: "unsupported_claim", label: "ReviewFlow AI status is not constrained", severity: "blocking" });
    }
  }
  return issues;
}

export function assertNoSensitiveContent(text: string, context: string, options: { includeUnsupportedClaims?: boolean } = {}) {
  const blocking = findSensitiveContentIssues(text, options).filter((issue) => issue.severity === "blocking");
  if (blocking.length) {
    throw new Error(`${context} contains blocked content: ${blocking.map((issue) => issue.label).join("; ")}`);
  }
}

export function redactSensitiveContent(text: string) {
  return text
    .replace(/(api[_ -]?key|cookie|token|password|secret|authorization)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/-----BEGIN [\s\S]+?PRIVATE KEY-----/gi, "[REDACTED_PRIVATE_KEY]");
}
