# Resume Evidence Editor MVP

## Scope

Add a local-first evidence editor for Career Wiki Agent so users can add, review, verify, reject, and export evidence for projects, skills, resume bullets, work experience, and education. Verified evidence feeds Project Fit and Resume Tailor; draft and rejected evidence cannot silently enter final resumes.

## Out Of Scope

- Automatic job application
- Recruiting platform crawling
- Login automation
- HR messaging
- Cookie management
- Proxy pools
- Captcha bypass
- Auto-apply logic

## Data Model

Runtime table: `CareerEvidenceItem`

Fields:

- `id`
- `targetType`: `project` / `skill` / `bullet` / `work_experience` / `education`
- `targetId`
- `jdTestId`
- `evidenceType`: `wiki_project` / `wiki_workflow` / `wiki_changelog` / `baseline_resume` / `user_input` / `external_note`
- `title`
- `content`
- `sourcePath`
- `sourceExcerpt`
- `confidence`
- `status`: `draft` / `verified` / `rejected`
- `createdAt`
- `updatedAt`

Rules:

- `user_input` and `external_note` are treated as manual evidence.
- `draft` evidence is visible but does not increase Project Fit score.
- `verified` evidence can increase Project Fit score and can support Resume Tailor validation.
- `rejected` evidence is ignored by Project Fit and Resume Tailor.
- Every evidence item must keep a source explanation.

## Page

New page:

- `/career-wiki/evidence-editor`

Capabilities:

- List evidence items.
- Filter by JD, project, skill, target type, and status.
- Show `insufficient_evidence` Project Fit results when loaded.
- Create and edit evidence items.
- Mark evidence as `draft`, `verified`, or `rejected`.
- Export Evidence Report to Obsidian.

## API

- `GET /api/career-wiki/evidence`
- `POST /api/career-wiki/evidence`
- `PATCH /api/career-wiki/evidence`
- `DELETE /api/career-wiki/evidence`
- `POST /api/career-wiki/evidence/export`

## Project Fit Integration

- Project Fit reads `CareerEvidenceItem`.
- `verified` evidence is appended to project scoring context.
- `draft` evidence appears as pending evidence but does not affect `evidence_score`.
- `rejected` evidence is ignored.
- Project Fit report displays verified manual evidence in supporting evidence.

## Resume Tailor Integration

- Resume Tailor can use verified evidence as project bullet source.
- Evidence validation treats verified `user_input` / `external_note` as manual supplemental evidence.
- Final resume markdown does not include internal evidence fields.
- Risk notes include manual evidence usage.
- Draft and rejected evidence do not support approval.

## Obsidian Export

Export directory:

`D:\AI-Workspace\CareerVault\08_Test_Runs\evidence\`

Filename:

`{company}-{role}-evidence-report.md`

Requirements:

- YAML frontmatter
- Obsidian wikilinks
- Windows-safe filename
- Timestamped duplicate handling
- No API Key / Cookie / token

## Acceptance Criteria

- Evidence Editor page exists and loads.
- Users can create, update, delete, verify, reject, and export evidence.
- Draft evidence does not change Project Fit score.
- Verified evidence increases Project Fit evidence score.
- Rejected evidence is ignored.
- Resume Tailor uses only verified evidence.
- Evidence Report exports to Obsidian.
- Existing typecheck, tests, lint, and build pass.
