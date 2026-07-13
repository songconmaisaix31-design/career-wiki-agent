import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { assertNoSensitiveContent, sanitizeParsedText, titleFromText } from "./guards";
import { extractPdfText, extractWordText } from "@/lib/resume-file-parsers";
import type { DocumentParseRequest, ParsedDocument } from "./types";

const execFileAsync = promisify(execFile);

export async function parseWithMarkItDown(request: DocumentParseRequest): Promise<ParsedDocument> {
  if (!request.bytes) throw new Error("PDF/DOCX 解析需要上传文件。");

  const command = process.env.MARKITDOWN_COMMAND?.trim() || "markitdown";
  const tempDir = await mkdtemp(path.join(/*turbopackIgnore: true*/ os.tmpdir(), "career-wiki-ingest-"));
  const tempPath = path.join(/*turbopackIgnore: true*/ tempDir, safeTempName(request.input.file_name));

  try {
    await writeFile(tempPath, request.bytes);
    const { stdout } = await execFileAsync(command, [tempPath], {
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
      windowsHide: true,
    });
    const markdown = sanitizeParsedText(stdout);
    if (!markdown) throw new Error("MarkItDown 未返回可用 Markdown 内容。");
    assertNoSensitiveContent(markdown);
    return {
      markdown,
      plain_text: markdown.replace(/^#+\s+/gm, "").replace(/^[-*]\s+/gm, ""),
      title: titleFromText(markdown, request.input.file_name),
      parser: "markitdown",
      parser_version: command,
      provenance: {
        file_name: request.input.file_name,
        source_type: request.input.source_type,
        purpose: request.input.purpose,
        parser: "markitdown",
        parser_version: command,
        size_bytes: request.input.size_bytes,
      },
      warnings: [],
    };
  } catch (error) {
    if (isMissingCommandError(error)) {
      return parseWithNativeFallback(request);
    }
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function parseWithNativeFallback(request: DocumentParseRequest): Promise<ParsedDocument> {
  if (!request.bytes) throw new Error("PDF/DOCX 解析需要上传文件。");
  const isPdf = request.input.extension === ".pdf";
  const parser = isPdf ? "native_pdf" : "native_docx";
  const plainText = isPdf ? await extractPdfText(request.bytes) : await extractWordText(request.bytes);
  const markdown = structureResumeText(plainText);
  if (!markdown) throw new Error("文件中没有提取到可用文字，请改用 Markdown/TXT 或粘贴文本。");
  assertNoSensitiveContent(markdown);
  return {
    markdown,
    plain_text: plainText,
    title: titleFromText(markdown, request.input.file_name),
    parser,
    parser_version: isPdf ? "pdf-parse" : "word-extractor",
    provenance: {
      file_name: request.input.file_name,
      source_type: request.input.source_type,
      purpose: request.input.purpose,
      parser,
      parser_version: isPdf ? "pdf-parse" : "word-extractor",
      size_bytes: request.input.size_bytes,
    },
    warnings: ["MarkItDown unavailable; parsed with the built-in local fallback."],
  };
}

export function structureResumeText(text: string) {
  const headings = new Set(["个人总结", "个人优势", "核心优势", "教育经历", "教育背景", "工作经历", "实习经历", "项目经历", "专业技能", "核心技能", "技能"]);
  const lines = sanitizeParsedText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));
  return lines
    .map((line, index) => {
      if (headings.has(line.replace(/[：:]$/, ""))) return `## ${line.replace(/[：:]$/, "")}`;
      if (index === 0 && line.length <= 30) return `# ${line}`;
      return line.replace(/^[•●▪]\s*/, "- ");
    })
    .join("\n");
}

function safeTempName(fileName: string) {
  return path.basename(fileName).replace(/[<>:"/\\|?*\x00-\x1F]/g, "-") || "upload";
}

function isMissingCommandError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === 9009),
  );
}
