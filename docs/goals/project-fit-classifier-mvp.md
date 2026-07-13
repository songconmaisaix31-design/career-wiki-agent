# Project Fit Classifier MVP

## Scope

Career Wiki Agent needs a rule-based Project Fit Classifier that ranks Career Wiki projects against a selected JD test before resume tailoring. The classifier must help decide which projects should become primary resume evidence, supporting evidence, short mentions, or should be excluded.

## Out Of Scope

- Automatic job application
- Recruiting platform crawling
- Login automation
- HR messaging
- Cookie management
- Proxy pools
- Captcha bypass
- JobSpy integration
- ApplyPilot, AIHawk, AutoApplyMax, or other auto-apply logic
- LLM-only matching

## Data Model

Runtime table: `CareerProjectFitResult`

Fields:

- `id`
- `jdTestId`
- `projectId`
- `targetDirection`
- `result`
- `overrideType`
- `overrideReason`
- `createdAt`
- `updatedAt`

`result` stores the normalized classifier output:

- `project_id`
- `project_name`
- `fit_level`
- `fit_score`
- `keyword_score`
- `evidence_score`
- `domain_score`
- `risk_score`
- `matched_jd_requirements`
- `missing_jd_requirements`
- `supporting_evidence`
- `risk_warnings`
- `recommended_resume_usage`
- `suggested_bullets`
- `exclusion_reason`

## Classification Rules

- Keyword score compares JD requirements against project name, description, tech stack, highlights, resume bullets, and interview story.
- Domain score uses target direction presets for AI Application Engineer, FDE / Solution Engineer, and Data Automation Engineer.
- Evidence score rewards explicit Wiki/import/source evidence and concrete project bullets.
- Risk score flags WIP, prototype, MVP, semi-finished, draft, missing evidence, weak match, and unsupported production-ready claims.
- `insufficient_evidence` and `do_not_use` are excluded from final resume selection.
- Manual overrides require a reason and are recorded in the result risk warnings.

## Routes And API

Page:

- `/career-wiki/project-fit`

API:

- `POST /api/career-wiki/project-fit/run`
- `GET /api/career-wiki/project-fit?jdTestId=xxx`
- `PATCH /api/career-wiki/project-fit/override`

## Resume Tailor Integration

Resume Tailor reads saved Project Fit results for the selected JD:

- `primary_project` is preferred.
- `supporting_project` is allowed.
- `mention_only` is not selected as a full project.
- `do_not_use` is excluded.
- `insufficient_evidence` is excluded unless a manual review flow later adds evidence.
- Override information is carried into risk notes.

## Obsidian Export

Project Fit reports export to:

`D:\AI-Workspace\CareerVault\08_Test_Runs\project_fit\`

Filename:

`{company}-{role}-project-fit-report.md`

Requirements:

- YAML frontmatter
- Obsidian wikilinks for projects
- Windows-safe filenames
- Timestamped duplicate handling
- Export log record
- No API keys, cookies, tokens, or recruiting account data

## Acceptance Criteria

- A user can run Project Fit classification for a JD test.
- Results show fit level, score breakdown, evidence, risks, usage recommendation, and suggested bullets.
- A user can override a result only with a reason.
- Resume Tailor uses saved Project Fit results to prefer or exclude projects.
- Project Fit report can be exported to Obsidian.
- Unit tests cover the three target directions and exclusion behavior.
- Existing typecheck, tests, lint, and build pass.
