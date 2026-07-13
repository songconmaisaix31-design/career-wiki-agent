export type ResumeWritingSeverity = "info" | "warning" | "blocking";

export type ResumeWritingFindingCode =
  | "generic_claim"
  | "unsupported_superlative"
  | "unverified_metric"
  | "repeated_sentence_opening"
  | "excessive_keyword_stuffing"
  | "overlong_bullet"
  | "vague_subject"
  | "production_status_overclaim";

export type ResumeWritingFinding = {
  code: ResumeWritingFindingCode;
  severity: ResumeWritingSeverity;
  section: string;
  content: string;
  message: string;
  suggestion: string;
};

export type ResumeWritingQualityReport = {
  score: number;
  passed: boolean;
  blockingCount: number;
  warningCount: number;
  findings: ResumeWritingFinding[];
};
