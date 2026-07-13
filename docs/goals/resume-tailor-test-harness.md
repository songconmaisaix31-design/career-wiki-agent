# Resume Tailor Test Harness

## Goal

Build a local-first test harness on top of Career Wiki Agent MVP to verify whether real Wiki project knowledge, a baseline Markdown resume, and multiple JD samples can produce safer and more targeted resume drafts.

## Scope

- Wiki Importer with dry-run preview and explicit apply.
- Baseline Markdown resume import.
- JD test set management.
- Batch test run for selected JD samples.
- Rule-based resume tailor output.
- Baseline vs tailored resume comparison report.
- Obsidian export for baseline resume, tailored resumes, JD analysis, learning tasks, and test reports.

## Out of Scope

- Automatic applications.
- Recruiting platform crawlers.
- Automatic login.
- Automatic HR messaging.
- Cookie management.
- Proxy pools.
- Captcha bypass.
- LinkedIn / BOSS / Zhilian automation.
- PDF / DOCX resume import in this version.
- Claiming WIP / prototype projects as production-ready systems.

## Data Model Design

- `ResumeBaseline`
  - `id`
  - `name`
  - `source`
  - `content`
  - `workExperience`
  - `projects`
  - `skills`
  - `education`
  - `selfSummary`
  - `originalResumeText`
  - timestamps
- `CareerJdTest`
  - `id`
  - `company`
  - `role`
  - `source`
  - `jdText`
  - `targetDirection`
  - timestamps
- `ResumeTailorRun`
  - `id`
  - `baselineId`
  - `jdTestId`
  - `jdAnalysis`
  - `targetedSummary`
  - `targetedSkills`
  - `selectedProjects`
  - `rewrittenProjectBullets`
  - `rewrittenWorkExperience`
  - `riskNotes`
  - `missingEvidence`
  - `finalResumeMarkdown`
  - `comparisonReport`
  - timestamps

Existing `CareerProject` and `CareerSkill` store Wiki import provenance through existing text fields:

- `CareerProject.interviewStory` includes source and status notes.
- `CareerSkill.evidence` includes source files.

This avoids a broad migration of existing MVP records while still preserving provenance.

## API Design

- `GET /api/career-wiki/wiki-import/preview`
- `POST /api/career-wiki/wiki-import/apply`
- `GET /api/career-wiki/resume-baseline`
- `POST /api/career-wiki/resume-baseline`
- `GET /api/career-wiki/resume-tests`
- `POST /api/career-wiki/resume-tests`
- `POST /api/career-wiki/resume-tests/run`
- `POST /api/career-wiki/resume-tailor/export`

## Page Route Design

- `/career-wiki/wiki-import`
- `/career-wiki/resume-baseline`
- `/career-wiki/resume-tests`
- `/career-wiki/resume-tailor`

## Safety Rules

- Every generated resume section must be evidence-based.
- Unknown or unsupported claims go to `missing_evidence`.
- WIP / prototype / MVP / semi-finished status must remain visible.
- ReviewFlow AI must stay WIP / prototype / semi-finished when imported from Wiki evidence.
- No secrets or recruiting platform account data are exported.

## Verification Plan

1. Run Wiki dry-run preview.
2. Apply Wiki import.
3. Import baseline Markdown resume.
4. Create at least three JD test samples.
5. Run tailor tests for selected JD samples.
6. Generate comparison reports.
7. Export generated artifacts to Obsidian.
8. Confirm Markdown files exist and are readable.
9. Run `npx tsc --noEmit`, `npm test`, `npm run lint`, and `DATABASE_URL=file:./dev.db npm run build`.

