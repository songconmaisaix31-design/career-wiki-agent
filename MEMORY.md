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
