# Career Wiki Agent E2E Checklist

## Purpose

Validate the production-quality local workflow before using a tailored resume for real application review.

## Preconditions

- `DATABASE_URL=file:./dev.db`
- `CAREER_VAULT_PATH=D:\AI-Workspace\CareerVault`
- No `.env` or credential files are opened, copied, exported, or logged.
- No job-board automation, login automation, crawler, HR messaging, cookie management, proxy pool, captcha bypass, or automatic application flow is enabled.

## Manual E2E Flow

1. Open `/career-wiki/dashboard`.
2. Confirm health status is pass or only has explainable local-data warnings.
3. Open `/career-wiki/profile` and confirm Career Profile has real content.
4. Open `/career-wiki/projects` and confirm project status does not exaggerate WIP / prototype / semi-finished work.
5. Open `/career-wiki/skills` and confirm core skills have evidence or learning priority.
6. Open `/career-wiki/jd-import` and import or paste a representative JD.
7. Open `/career-wiki/project-fit` and run Project Fit for the JD.
8. Confirm `insufficient_evidence` or `do_not_use` projects are not treated as primary resume projects.
9. Open `/career-wiki/evidence-editor` and add or verify missing evidence.
10. Open `/career-wiki/evidence-review`.
11. Run `POST /api/career-wiki/evidence-review/run` for the JD.
12. Resolve or accept only appropriate review items.
13. Confirm high-severity open review items block resume approval.
14. Open `/career-wiki/resume-tailor` and generate a draft resume.
15. Save the draft as a resume version.
16. Confirm the version remains `draft` until manually approved.
17. Confirm diff, risk notes, evidence validation, and export checklist are visible.
18. Approve only after evidence validation and evidence review pass.
19. Open `/career-wiki/resume-versions` and preview final resume with `modern`, `ats`, and `compact` templates.
20. Export approved final resume formats.
21. Confirm repeated export creates timestamped files and does not overwrite prior files.
22. Open `/career-wiki/audit` and confirm evidence edits, Project Fit, status changes, workflow transitions, and exports are logged.

## Content Safety Checks

Final resume exports must not contain:

- `production-ready`
- `Missing Evidence`
- `missing_evidence`
- API key values
- Cookie values
- token values
- private key blocks
- recruiting platform account credentials

ReviewFlow AI must remain described as WIP / prototype / semi-finished unless verified evidence supports a stronger status.

## Required Commands

```bash
npx tsc --noEmit
npm test
npm run lint
DATABASE_URL=file:./dev.db npm run build
npm run career:healthcheck
npm run career:integrity
```

## Expected Result

- Dashboard loads.
- Workflow state is visible.
- Evidence quality review exists and blocks high-severity open issues.
- Audit log records critical local actions.
- Operations commands run locally.
- Final resume export is allowed only for approved versions.
- No sensitive content is exported.
