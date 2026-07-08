# Resume Tailor MVP

## Goal

Upgrade the Resume Tailor Test Harness into a local-first MVP for pre-application human review. The MVP must let the user generate draft resume versions, inspect section-level diffs, validate evidence, approve a final version, and export only approved final resumes to Obsidian.

## Scope

- Human confirmation flow on `/career-wiki/resume-tailor`.
- Baseline vs tailored section-level diff.
- Evidence validation for every generated resume bullet.
- Resume version management with draft, approved, exported, and archived states.
- Pre-export checklist.
- Approved final resume export plus diff, evidence, and risk reports.

## Out of Scope

- Automatic applications.
- Recruiting platform crawlers.
- Automatic login.
- Automatic HR messaging.
- Cookie management.
- Proxy pools.
- Captcha bypass.
- LinkedIn / BOSS / Zhilian automation.

## Data Model Design

- `ResumeVersion`
  - `id`
  - `baselineId`
  - `jdTestId`
  - `tailorRunId`
  - `company`
  - `role`
  - `versionName`
  - `status`: `draft` / `approved` / `exported` / `archived`
  - `finalResumeMarkdown`
  - `diffSummary`
  - `evidenceSummary`
  - `riskNotes`
  - `exportPath`
  - timestamps

Existing `ResumeTailorRun` remains the generated run record. `ResumeVersion` is the reviewable and exportable resume artifact.

## API Design

- `GET /api/career-wiki/resume-versions`
- `POST /api/career-wiki/resume-versions`
- `PATCH /api/career-wiki/resume-versions`
- `POST /api/career-wiki/resume-versions/export`

Existing harness APIs remain available:

- `GET /api/career-wiki/resume-tests`
- `POST /api/career-wiki/resume-tests/run`

## Page Route Design

- `/career-wiki/resume-tailor`
  - Step 1: select baseline resume.
  - Step 2: select JD test.
  - Step 3: select project materials.
  - Step 4: preview recommended projects and skills.
  - Step 5: generate draft resume.
  - Step 6: show diff and risk notes.
  - Step 7: approve and save final version.
  - Step 8: export to Obsidian.
- `/career-wiki/resume-versions`
  - List resume versions.
  - Filter by JD/company/role.
  - Approve, archive, and export versions.

## Evidence Validation

Accepted evidence sources:

- `wiki_project`
- `wiki_workflow`
- `wiki_changelog`
- `baseline_resume`
- `user_input`

Rejected evidence sources:

- `inferred_without_evidence`
- `missing_evidence`
- `llm_guess`
- `unknown`

Rules:

- Final resume cannot contain `missing_evidence`.
- Unsupported content stays in `risk_notes` or `missingEvidence`.
- WIP / prototype / MVP / semi-finished projects cannot be described as production-ready.
- ReviewFlow AI must retain WIP / prototype / semi-finished wording.
- Approval is blocked when evidence validation fails.

## Diff Design

First version uses section-level diff:

- `summary`
- `skills`
- `project bullets`
- `work experience`
- `education`
- `added keywords`
- `removed content`
- `rewritten content`

Each changed section keeps a source note through evidence items or baseline section name.

## Obsidian Export Design

Export only approved versions:

- Final resume: `05_Resume_Versions/{company}-{role}-v{version}-final-resume.md`
- Diff report: `08_Test_Runs/resume_tailor_tests/{company}-{role}-v{version}-diff-report.md`
- Evidence report: `08_Test_Runs/resume_tailor_tests/{company}-{role}-v{version}-evidence-report.md`
- Risk report: `08_Test_Runs/resume_tailor_tests/{company}-{role}-v{version}-risk-report.md`

Export requirements:

- YAML frontmatter.
- Obsidian wikilinks.
- Windows-safe filenames.
- Existing files are never overwritten.
- Export logs are recorded.
- Secrets and recruiting platform account data are never exported.

## Acceptance Criteria

- Draft resume versions can be generated.
- Diff report is visible before approval.
- Evidence validation blocks unsafe versions.
- Approved resume versions can be created.
- Versions can be listed and archived.
- Only approved versions can be exported as final resumes.
- Export checklist blocks missing evidence, overclaiming, secrets, empty bullets, and missing diff.
- Existing 4 JD test runs can be used for verification.
- `npx tsc --noEmit`, `npm test`, `npm run lint`, and `DATABASE_URL=file:./dev.db npm run build` pass.
