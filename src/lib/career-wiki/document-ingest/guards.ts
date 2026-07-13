import path from "node:path";

import type { DocumentInput } from "./types";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".md", ".txt", ".html", ".pdf", ".docx"]);

const blockedExtensions = new Set([".env", ".pem", ".key", ".p12", ".crt", ".cookie", ".token", ".sqlite", ".db"]);
const blockedNamePattern = /(^|[._-])(env|secret|secrets|token|cookie|credential|credentials|private[-_]?key)([._-]|$)/i;
const secretContentPattern = /\b(api[_ -]?key|cookie|token|private key|secret access key|password)\b\s*[:=]/i;

export function normalizeExtension(fileName: string, providedExtension = "") {
  const fromName = path.extname(fileName).toLowerCase();
  const normalized = providedExtension.trim().toLowerCase();
  if (fromName) return fromName;
  return normalized ? (normalized.startsWith(".") ? normalized : `.${normalized}`) : "";
}

export function assertSafeDocumentInput(input: DocumentInput) {
  const extension = normalizeExtension(input.file_name, input.extension);
  const baseName = path.basename(input.file_name).toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    throw new Error(`不支持的文件格式：${extension || "unknown"}。当前支持 md、txt、html、pdf、docx。`);
  }
  if (blockedExtensions.has(extension) || blockedNamePattern.test(baseName)) {
    throw new Error("出于安全原因，不能解析疑似包含密钥、Cookie、token 或凭据的文件。");
  }
  if (input.size_bytes > MAX_DOCUMENT_BYTES) {
    throw new Error("文件超过 10MB 限制，请拆分或压缩后再上传。");
  }
  if (input.size_bytes < 0) {
    throw new Error("文件大小无效。");
  }
}

export function assertNoSensitiveContent(text: string) {
  if (secretContentPattern.test(text)) {
    throw new Error("解析结果疑似包含 API Key、Cookie、token 或密码字段，已阻止保存。");
  }
}

export function sanitizeParsedText(text: string) {
  return text.replace(/\0/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

export function titleFromText(text: string, fallback: string) {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.slice(0, 120);
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return (firstLine || path.parse(fallback).name || "Parsed Document").slice(0, 120);
}
