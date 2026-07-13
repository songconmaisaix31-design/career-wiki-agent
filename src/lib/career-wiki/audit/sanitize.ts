import { redactSensitiveContent } from "../security/sensitive-scan";

const sensitivePatterns = [
  /api[_ -]?key/i,
  /cookie/i,
  /token/i,
  /password/i,
  /secret/i,
  /private[_ -]?key/i,
  /authorization/i,
];

export function sanitizeAuditValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeAuditText(value);
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitivePatterns.some((pattern) => pattern.test(key)) ? "[REDACTED]" : sanitizeAuditValue(entry),
      ]),
    );
  }
  return value;
}

export function sanitizeAuditText(text: string) {
  return redactSensitiveContent(text);
}
