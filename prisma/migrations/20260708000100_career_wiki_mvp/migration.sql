CREATE TABLE "CareerProfile" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
  "name" TEXT NOT NULL DEFAULT '',
  "targetRoles" JSONB NOT NULL,
  "education" TEXT NOT NULL DEFAULT '',
  "currentPosition" TEXT NOT NULL DEFAULT '',
  "summary" TEXT NOT NULL DEFAULT '',
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareerProject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "description" TEXT NOT NULL DEFAULT '',
  "techStack" JSONB NOT NULL,
  "highlights" JSONB NOT NULL,
  "resumeBullets" JSONB NOT NULL,
  "interviewStory" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareerSkill" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "level" TEXT NOT NULL DEFAULT 'learning',
  "evidence" TEXT NOT NULL DEFAULT '',
  "learningPriority" TEXT NOT NULL DEFAULT 'medium',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareerJdAnalysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT '',
  "jdText" TEXT NOT NULL,
  "responsibilities" JSONB NOT NULL,
  "requiredSkills" JSONB NOT NULL,
  "bonusPoints" JSONB NOT NULL,
  "matchedProjects" JSONB NOT NULL,
  "skillGaps" JSONB NOT NULL,
  "matchScore" INTEGER NOT NULL DEFAULT 0,
  "resumeSuggestions" JSONB NOT NULL,
  "interviewTips" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CareerLearningTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "relatedSkill" TEXT NOT NULL DEFAULT '',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "dayIndex" INTEGER NOT NULL,
  "estimatedTime" TEXT NOT NULL DEFAULT '60 min',
  "outputRequired" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'todo',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "jdAnalysisId" TEXT NOT NULL,
  CONSTRAINT "CareerLearningTask_jdAnalysisId_fkey" FOREIGN KEY ("jdAnalysisId") REFERENCES "CareerJdAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CareerExportLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
