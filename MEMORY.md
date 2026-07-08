# Project Memory

## Long-Term Context

- 2026-07-08: Project initialized from the public LuJie CareerKit repository snapshot because direct `git clone` failed repeatedly on GitHub pack transfer. Files were restored through GitHub tree/raw downloads with size checks.
- 2026-07-08: Target feature branch is `feature/career-wiki-mvp`.
- 2026-07-08: MVP must remain local-first and must not include job-board automation, crawler, login, cookie, proxy, captcha, automatic application, or HR messaging features.
- 2026-07-08: Obsidian Vault path is configured by `CAREER_VAULT_PATH`; intended local value is `D:\AI-Workspace\CareerVault`. Do not store secrets in this file.

## Decisions

- Use existing Next.js, TypeScript, Prisma, Vitest, ESLint, and npm stack.
- Use rule-based fallback logic for JD analysis and 7-day learning task generation so base functionality works without LLM credentials.
- Use timestamped export filenames when a Markdown destination already exists to avoid data loss.
- 2026-07-08: Career Wiki MVP is implemented as independent `/career-wiki/*` routes plus `/api/career-wiki/*` endpoints, with a dashboard entry link from the original app.
- 2026-07-08: Career Wiki runtime creates its own tables through `ensureCareerWikiSchema()` so local SQLite startup works even before a manual migration run.
- 2026-07-08: In this environment, Prisma engine download from the default source hit `ECONNRESET`; one-time `npx prisma generate` succeeded with `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma`.
- 2026-07-08: Demo validation data was backed up to `D:\AI-Workspace\Archive\career-wiki-agent-demo-backup-20260708-152654`, then removed from `prisma\dev.db` Career Wiki tables and `D:\AI-Workspace\CareerVault`.
- 2026-07-08: `D:\AI-Workspace\CareerVault` was initialized for real usage with profile, project bank, skill matrix, JD analysis, learning plan, resume version, interview prep, and applications templates.
- 2026-07-08: Next suggested phase is Resume Tailor MVP, using Career Wiki materials to produce resume version suggestions while keeping rule-based fallback.
- 2026-07-08: Resume Tailor Test Harness uses explicit dry-run/apply for Wiki import, Markdown-only baseline resume import, rule-based resume tailoring, and Obsidian exports to `05_Resume_Versions`, `03_JD_Library`, `04_Learning_Tasks`, and `08_Test_Runs`.
- 2026-07-08: WIP/prototype/MVP project status must stay visible in generated resume drafts; unsupported JD skills go to `missingEvidence` instead of final resume claims.
- 2026-07-08: Resume Tailor MVP adds `CareerResumeVersion` as the Career Wiki-specific review artifact rather than reusing the original app `ResumeVersion` model, keeping Career Wiki approval/export state separate from LuJie CareerKit's resume editor.
- 2026-07-08: Approved final resume export is blocked by a shared checklist: baseline selected, JD selected, markdown exists, evidence validation passes, no unsupported content, no missing evidence text, no production-ready overclaim, no secret keywords, no recruiting platform account wording, no empty bullets, and diff exists.
- 2026-07-08: Final resume export allows repeat exports for already `exported` versions and relies on timestamped unique filenames to avoid overwriting Obsidian files.
- 2026-07-08: Document ingestion upgrade uses a guarded local parser layer for Markdown/TXT/HTML and an optional MarkItDown CLI sidecar for PDF/DOCX. Missing MarkItDown must be a user-facing fallback, not a hard failure for other formats.
- 2026-07-08: Resume rendering now flows through `ResumeRenderSchema` before Markdown/JSON/HTML/DOCX/PDF export so evidence filtering, secret checks, ReviewFlow AI status rules, and production-ready overclaim guards stay centralized.
- 2026-07-08: Server-side PDF generation is intentionally a graceful HTML-print fallback until a dedicated renderer is selected; do not add browser automation or heavyweight rendering dependencies just for PDF without a separate decision.
- 2026-07-08: Resume Template Preview MVP adds `modern`, `ats`, and `compact` HTML templates on top of `ResumeRenderSchema`; templates control layout only and must not bypass evidence filtering or include risk/evidence reports in final resume body.
- 2026-07-08: Standalone resume preview lives at `/career-wiki/resume-versions/[id]/preview?template=...` and uses browser print/save-as-PDF instead of server-side PDF generation.
- 2026-07-08: Project Fit Classifier is rule-based and sits before Resume Tailor project selection. It stores explainable keyword/evidence/domain/risk scores, excludes `do_not_use` and `insufficient_evidence` projects from full resume selection, and records manual overrides with reasons.
- 2026-07-08: Resume Evidence Editor adds `CareerEvidenceItem` runtime storage. Only `verified` evidence can improve Project Fit or support Resume Tailor evidence validation; `draft` is visible but unscored, and `rejected` is ignored.
- 2026-07-08: Production Quality Consolidation should keep Career Wiki local-first, add workflow state, audit logs, evidence quality review, ops health/integrity checks, and sensitive guards without adding recruiting-platform automation or external account workflows.
- 2026-07-08: Maintenance commands must not read or print `.env`; they should default to local `file:./dev.db` when no runtime database URL is provided and must avoid exporting secrets.
