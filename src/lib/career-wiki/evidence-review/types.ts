export type EvidenceReviewSeverity = "low" | "medium" | "high";
export type EvidenceReviewStatus = "open" | "resolved" | "accepted_risk" | "ignored";

export type EvidenceReviewIssueType =
  | "missing_verified_evidence"
  | "draft_evidence"
  | "weak_source"
  | "short_content"
  | "duplicate_evidence"
  | "project_fit_insufficient";

export type EvidenceReviewItemView = {
  id: string;
  jdTestId: string;
  targetType: string;
  targetId: string;
  evidenceItemId: string;
  issueType: EvidenceReviewIssueType | string;
  severity: EvidenceReviewSeverity;
  title: string;
  detail: string;
  recommendedAction: string;
  status: EvidenceReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceDuplicateGroupView = {
  id: string;
  jdTestId: string;
  itemIds: string[];
  reason: string;
  status: EvidenceReviewStatus;
  createdAt: string;
};
