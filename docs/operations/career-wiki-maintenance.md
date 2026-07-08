# Career Wiki Maintenance

## Purpose

This document tracks local-first maintenance expectations for Career Wiki Agent. It is intentionally limited to local data health, exports, and auditability. It does not cover recruiting-platform automation.

## Local Data

- Database: `prisma/dev.db` by default.
- Vault: configured by `CAREER_VAULT_PATH`.
- Main Wiki index: `D:\AI-Workspace\Wiki\wiki\projects\career-wiki-agent.md`.

## Required Safety Rules

- Do not read or print `.env` values.
- Do not export API keys, cookies, tokens, private keys, or platform account data.
- Do not delete user data without a timestamped backup.
- Keep WIP / prototype / semi-finished project status visible in final materials.
- Do not allow unverified evidence into approved final resumes.

## Routine Validation

```bash
npx tsc --noEmit
npm test
npm run lint
DATABASE_URL=file:./dev.db npm run build
```

## Production Quality Additions

The v0.3 consolidation adds local maintenance commands:

```bash
npm run career:backup
npm run career:healthcheck
npm run career:integrity
```

These commands should remain local-only and must not require external accounts.
