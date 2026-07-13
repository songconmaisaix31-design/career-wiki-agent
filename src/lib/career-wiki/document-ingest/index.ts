import { assertSafeDocumentInput, normalizeExtension } from "./guards";
import { parseHtmlDocument } from "./html-adapter";
import { parseWithMarkItDown } from "./markitdown-adapter";
import { parsePlainTextDocument } from "./plain-text-adapter";
import type { DocumentParseRequest, ParsedDocument } from "./types";

export async function parseDocument(request: DocumentParseRequest): Promise<ParsedDocument> {
  const extension = normalizeExtension(request.input.file_name, request.input.extension);
  assertSafeDocumentInput({ ...request.input, extension });

  if (extension === ".md" || extension === ".txt") return parsePlainTextDocument(request);
  if (extension === ".html") return parseHtmlDocument(request);
  if (extension === ".pdf" || extension === ".docx") return parseWithMarkItDown(request);
  throw new Error(`不支持的文件格式：${extension}`);
}

export type { DocumentInput, DocumentParseRequest, DocumentPurpose, ParsedDocument } from "./types";
