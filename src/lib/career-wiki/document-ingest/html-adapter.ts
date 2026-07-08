import { assertNoSensitiveContent, sanitizeParsedText, titleFromText } from "./guards";
import type { DocumentParseRequest, ParsedDocument } from "./types";

export function parseHtmlDocument(request: DocumentParseRequest): ParsedDocument {
  const html = request.text ?? request.bytes?.toString("utf8") ?? "";
  const markdown = sanitizeParsedText(htmlToMarkdown(html));
  assertNoSensitiveContent(markdown);
  return {
    markdown,
    plain_text: markdown.replace(/^#+\s+/gm, "").replace(/^[-*]\s+/gm, ""),
    title: titleFromText(markdown, request.input.file_name),
    parser: "html",
    parser_version: "local-html-normalizer",
    provenance: {
      file_name: request.input.file_name,
      source_type: request.input.source_type,
      purpose: request.input.purpose,
      parser: "html",
      parser_version: "local-html-normalizer",
      size_bytes: request.input.size_bytes,
    },
    warnings: ["HTML 已转换为 normalized Markdown，复杂样式和脚本已忽略。"],
  };
}

function htmlToMarkdown(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(h1)>/gi, "\n\n")
      .replace(/<(h1)[^>]*>/gi, "\n# ")
      .replace(/<\/(h2)>/gi, "\n\n")
      .replace(/<(h2)[^>]*>/gi, "\n## ")
      .replace(/<\/(h3)>/gi, "\n\n")
      .replace(/<(h3)[^>]*>/gi, "\n### ")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<\/li>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower in named) return named[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return match;
  });
}
