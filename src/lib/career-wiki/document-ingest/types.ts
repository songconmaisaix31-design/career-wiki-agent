export type DocumentPurpose = "jd" | "resume_baseline";
export type DocumentSourceType = "upload" | "local_path" | "pasted_text";
export type DocumentParser = "plain_text" | "html" | "markitdown";

export type DocumentInput = {
  file_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  source_type: DocumentSourceType;
  purpose: DocumentPurpose;
};

export type ParserProvenance = {
  file_name: string;
  source_type: DocumentSourceType;
  purpose: DocumentPurpose;
  parser: DocumentParser;
  parser_version: string;
  size_bytes: number;
};

export type ParsedDocument = {
  markdown: string;
  plain_text: string;
  title: string;
  parser: DocumentParser;
  parser_version: string;
  provenance: ParserProvenance;
  warnings: string[];
};

export type DocumentParseRequest = {
  input: DocumentInput;
  bytes?: Buffer;
  text?: string;
};
