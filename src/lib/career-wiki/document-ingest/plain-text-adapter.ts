import { assertNoSensitiveContent, sanitizeParsedText, titleFromText } from "./guards";
import type { DocumentParseRequest, ParsedDocument } from "./types";

export function parsePlainTextDocument(request: DocumentParseRequest): ParsedDocument {
  const raw = request.text ?? request.bytes?.toString("utf8") ?? "";
  const markdown = sanitizeParsedText(raw);
  assertNoSensitiveContent(markdown);
  return {
    markdown,
    plain_text: markdown,
    title: titleFromText(markdown, request.input.file_name),
    parser: "plain_text",
    parser_version: "node:utf8",
    provenance: {
      file_name: request.input.file_name,
      source_type: request.input.source_type,
      purpose: request.input.purpose,
      parser: "plain_text",
      parser_version: "node:utf8",
      size_bytes: request.input.size_bytes,
    },
    warnings: [],
  };
}
