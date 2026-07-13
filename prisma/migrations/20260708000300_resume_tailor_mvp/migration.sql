CREATE TABLE "CareerResumeVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "baselineId" TEXT NOT NULL,
  "jdTestId" TEXT NOT NULL,
  "tailorRunId" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "versionName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "finalResumeMarkdown" TEXT NOT NULL,
  "diffSummary" JSONB NOT NULL,
  "evidenceSummary" JSONB NOT NULL,
  "riskNotes" JSONB NOT NULL,
  "exportPath" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
