import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { assertNoSensitiveContent, sanitizeParsedText, titleFromText } from "./guards";
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
      throw new Error("PDF/DOCX 需要安装或配置 MarkItDown CLI。请安装后重试，或先上传 Markdown/TXT/HTML。");
    }
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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
