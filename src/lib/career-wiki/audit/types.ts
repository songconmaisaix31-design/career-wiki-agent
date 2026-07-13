export type CareerAuditAction =
  | "evidence.create"
  | "evidence.update"
  | "evidence.delete"
  | "project_fit.run"
  | "project_fit.override"
  | "resume_version.status"
  | "resume_version.export"
  | "workflow.transition"
  | "export.blocked";

export type CareerAuditLogView = {
  id: string;
  action: CareerAuditAction | string;
  entityType: string;
  entityId: string;
  actor: string;
  summary: string;
  beforeJson: unknown;
  afterJson: unknown;
  metadata: unknown;
  createdAt: string;
};

export type CareerAuditLogInput = {
  action: CareerAuditAction | string;
  entityType: string;
  entityId: string;
  summary: string;
  actor?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};
