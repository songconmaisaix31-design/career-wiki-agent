# Production Quality Consolidation

## Goal

Consolidate Career Wiki Agent into a production-quality local-first workflow for real pre-application review. The system should make workflow state, evidence quality, auditability, operations health, and sensitive-content blocking visible and enforceable before final resume export.

## Current Baseline

- Branch: `feature/resume-evidence-editor-mvp`
- Baseline commit: `f03dbc2 feat: add resume evidence editor mvp`
- Existing capabilities:
  - Career Wiki
  - Wiki import
  - JD / resume multi-format import
  - Resume Tailor
  - Project Fit Classifier
  - Evidence Validation
  - Resume Evidence Editor
  - Resume Version Management
  - Multi-template resume preview and export
  - Obsidian export

## Scope

- Career workflow state machine
- Audit logs for critical workflow actions
- Evidence quality review MVP
- Career Wiki operation dashboard
- Local maintenance scripts for backup, healthcheck, and integrity checks
- Sensitive content guards for user input, generated content, logs, and exports
- E2E validation documentation and regression tests
- Production-quality release documentation

## Out Of Scope

- Automatic job application
- Recruiting platform crawling
- Login automation
- HR messaging
- Cookie management
- Proxy pools
- Captcha bypass
- LinkedIn / BOSS / Zhilian login-state automation
- Any unconfirmed automatic sending or application submission

## Workflow Design

The first version uses an explicit local state machine:

1. `profile_ready`
2. `projects_ready`
3. `skills_ready`
4. `jd_imported`
5. `project_fit_reviewed`
6. `evidence_reviewed`
7. `resume_drafted`
8. `diff_reviewed`
9. `resume_approved`
10. `exported`
11. `archived`

State transitions are guarded by checklist results, evidence quality status, sensitive-content checks, and resume export status. Manual override is allowed only with a reason and is recorded in audit logs.

## Data Model Design

Runtime tables follow the existing local-first runtime schema pattern:

- `CareerWorkflowRun`
- `CareerWorkflowEvent`
- `CareerAuditLog`
- `CareerEvidenceReviewItem`
- `CareerEvidenceDuplicateGroup`

All tables are local SQLite tables and are created lazily through existing repository initialization patterns. No secrets are stored in these tables.

## API Design

- `GET /api/career-wiki/workflows`
- `POST /api/career-wiki/workflows/start`
- `GET /api/career-wiki/workflows/[id]`
- `POST /api/career-wiki/workflows/transition`
- `GET /api/career-wiki/audit`
- `GET /api/career-wiki/audit/[id]`
- `GET /api/career-wiki/evidence-review`
- `POST /api/career-wiki/evidence-review/run`
- `POST /api/career-wiki/evidence-review/action`
- `POST /api/career-wiki/evidence-review/export`
- `GET /api/career-wiki/dashboard`
- `GET /api/career-wiki/health`

## Page Design

- `/career-wiki/dashboard`
- `/career-wiki/workflow`
- `/career-wiki/audit`
- `/career-wiki/evidence-review`

These pages reuse the existing Career Wiki harness to keep navigation and data loading consistent.

## Operations Commands

- `npm run career:backup`
- `npm run career:healthcheck`
- `npm run career:integrity`

The commands are local-only, avoid `.env` reads, do not print secrets, and default to `DATABASE_URL=file:./dev.db` when no runtime database URL is provided.

## Sensitive Content Guards

Guards must block or quarantine:

- API keys
- Cookies
- Tokens
- Password-like secrets
- Private keys
- Recruiting platform account identifiers
- Production-ready exaggeration for WIP / prototype / semi-finished projects

Guards must run before final resume export and before writing audit or export logs.

## Acceptance Criteria

- Workflow state machine exists and blocks invalid transitions.
- Audit logs cover evidence changes, Project Fit runs, Resume Tailor approvals, exports, and manual overrides.
- Evidence quality review flags missing, weak, duplicate, stale, and inconsistent evidence.
- High-severity unresolved evidence review items block approval.
- Dashboard shows workflow health, evidence health, resume versions, exports, and operations status.
- Backup, healthcheck, and integrity scripts run locally.
- Sensitive content guards prevent secrets from entering exports and logs.
- Draft resumes cannot export final formats.
- Final resumes require approved status and verified evidence.
- ReviewFlow AI remains WIP / prototype / semi-finished in generated materials.
- Required checks pass:
  - `npx tsc --noEmit`
  - `npm test`
  - `npm run lint`
  - `DATABASE_URL=file:./dev.db npm run build`
  - `npm run career:healthcheck`
  - `npm run career:integrity`

## Release Target

- Final commit: `feat: consolidate production-quality career wiki workflow`
- Tag: `v0.3-production-quality`
