# Career Wiki Frontend QA Checklist

Date: 2026-07-09
Release target: `v0.4-frontend-ux-overhaul`

## Shared Checks

Every page should satisfy:

- Page opens without server error.
- Title and description are clear.
- Next action is visible.
- Empty state explains what to do next.
- Error or blocked state explains reason and repair path.
- Primary buttons use action wording.
- Disabled buttons include a reason through visible text or `title`.
- Status badge has Chinese label and optional technical value.
- No raw JSON is shown on primary screens.
- No secret-looking values are shown.
- Evidence validation, workflow guards, audit logs, and draft/final export constraints remain enforced by backend APIs.

## Page Checklist

| Page | Route | QA focus |
| --- | --- | --- |
| Dashboard | `/career-wiki/dashboard` | Hero next action, workflow cards, metrics, risk panel, quick actions |
| Workflow | `/career-wiki/workflow` | Workflow list, detail, stepper, checklist, timeline, reason-required transition |
| JD Import | `/career-wiki/jd-import` | Upload/paste, parser warning, parsed preview, confirm metadata |
| JD Analyzer | `/career-wiki/jd-analyzer` | Sectioned results, next action to Project Fit |
| Project Fit | `/career-wiki/project-fit` | JD selector, score display, override reason, evidence repair path |
| Evidence Editor | `/career-wiki/evidence-editor` | Filters, edit panel, draft/verified/rejected meaning |
| Evidence Review | `/career-wiki/evidence-review` | Queue layout, high severity visibility, review note required, export button |
| Resume Tailor | `/career-wiki/resume-tailor` | Guided steps, draft creation, diff/checklist/evidence validation |
| Resume Versions | `/career-wiki/resume-versions` | Version list, detail, template selector, preview, export groups, draft export disabled |
| Resume Preview | `/career-wiki/resume-versions/[id]/preview` | No sidebar, A4 preview, print/save-as-PDF controls |
| Audit | `/career-wiki/audit` | Filters, list/detail split, sanitized summaries, no delete action |
| Profile | `/career-wiki/profile` | Form grouping, save feedback |
| Projects | `/career-wiki/projects` | Project form and card list |
| Skills | `/career-wiki/skills` | Skill table and edit flow |

## Browser QA Targets

Use the in-app browser or Playwright-equivalent checks for:

1. `/career-wiki/dashboard`
2. `/career-wiki/workflow`
3. `/career-wiki/jd-import`
4. `/career-wiki/project-fit`
5. `/career-wiki/evidence-editor`
6. `/career-wiki/evidence-review`
7. `/career-wiki/resume-tailor`
8. `/career-wiki/resume-versions`
9. `/career-wiki/audit`

Save screenshots to `docs/frontend/screenshots/` when screenshot tooling is available.

## Guardrail Regression Checks

- Draft resume cannot export final.
- High severity evidence review item still blocks approval.
- `do_not_use` project does not enter final resume.
- `insufficient_evidence` project does not enter final resume.
- Project Fit override requires reason.
- Audit log records workflow, evidence, resume status, export, and blocked actions.
- Final resume body does not show internal evidence fields.
- Multi-template preview still works.
- Multi-format export still works.
- Obsidian export still uses sanitized timestamped paths.
- UI and export output do not contain `API Key`, `Cookie`, `token`, `password`, or `secret`.

## Required Commands

```bash
npx tsc --noEmit
npm test
npm run lint
DATABASE_URL=file:./dev.db npm run build
npm run career:healthcheck
npm run career:integrity
```
