CREATE TABLE "ResumeBaseline" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "content" JSONB NOT NULL,
  "workExperience" JSONB NOT NULL,
  "projects" JSONB NOT NULL,
  "skills" JSONB NOT NULL,
  "education" JSONB NOT NULL,
  "selfSummary" TEXT NOT NULL DEFAULT '',
  "originalResumeText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareerJdTest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT '',
  "jdText" TEXT NOT NULL,
  "targetDirection" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ResumeTailorRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jdAnalysis" JSONB NOT NULL,
  "targetedSummary" TEXT NOT NULL DEFAULT '',
  "targetedSkills" JSONB NOT NULL,
  "selectedProjects" JSONB NOT NULL,
  "rewrittenProjectBullets" JSONB NOT NULL,
  "rewrittenWorkExperience" JSONB NOT NULL,
  "riskNotes" JSONB NOT NULL,
  "missingEvidence" JSONB NOT NULL,
  "finalResumeMarkdown" TEXT NOT NULL,
  "comparisonReport" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "baselineId" TEXT NOT NULL,
  "jdTestId" TEXT NOT NULL,
  CONSTRAINT "ResumeTailorRun_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "ResumeBaseline" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ResumeTailorRun_jdTestId_fkey" FOREIGN KEY ("jdTestId") REFERENCES "CareerJdTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
