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

