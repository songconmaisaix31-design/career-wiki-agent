# Career Wiki Frontend Audit

Date: 2026-07-09
Branch baseline: `feature/production-quality-consolidation`
Current implementation target: `feature/frontend-ux-overhaul`

## Scope

This audit covers the Career Wiki frontend only. It does not change backend workflow guards, evidence validation, export rules, audit logging, database tables, `.env`, or CareerVault data.

## Current Page Inventory

Career Wiki pages are split across dedicated routes and a dynamic section route:

| Route | Current entry | Main component | Current role |
| --- | --- | --- | --- |
| `/career-wiki` | `src/app/career-wiki/page.tsx` | redirect/entry | Career Wiki entry |
| `/career-wiki/dashboard` | `src/app/career-wiki/dashboard/page.tsx` | server page | Ops dashboard |
| `/career-wiki/workflow` | `src/app/career-wiki/workflow/page.tsx` | server page | Workflow run summary |
| `/career-wiki/evidence-review` | `src/app/career-wiki/evidence-review/page.tsx` | server page | Evidence review queue |
| `/career-wiki/audit` | `src/app/career-wiki/audit/page.tsx` | server page | Audit log list |
| `/career-wiki/resume-versions/[id]/preview` | dedicated server page | `ResumePrintPreview` | Print preview |
| `/career-wiki/profile` | dynamic `[section]` route | `CareerWikiWorkspace` | Profile editor |
| `/career-wiki/projects` | dynamic `[section]` route | `CareerWikiWorkspace` | Project bank |
| `/career-wiki/skills` | dynamic `[section]` route | `CareerWikiWorkspace` | Skill matrix |
| `/career-wiki/jd-analyzer` | dynamic `[section]` route | `CareerWikiWorkspace` | Manual JD analysis |
| `/career-wiki/learning-tasks` | dynamic `[section]` route | `CareerWikiWorkspace` | Learning tasks |
| `/career-wiki/wiki-import` | dynamic `[section]` route | `ResumeTailorHarness` | Wiki import |
| `/career-wiki/jd-import` | dynamic `[section]` route | `ResumeTailorHarness` | Multi-format JD import |
| `/career-wiki/resume-baseline` | dynamic `[section]` route | `ResumeTailorHarness` | Baseline resume import |
| `/career-wiki/resume-tests` | dynamic `[section]` route | `ResumeTailorHarness` | JD test runs |
| `/career-wiki/project-fit` | dynamic `[section]` route | `ResumeTailorHarness` | Project Fit Classifier |
| `/career-wiki/evidence-editor` | dynamic `[section]` route | `ResumeTailorHarness` | Evidence editor |
| `/career-wiki/resume-tailor` | dynamic `[section]` route | `ResumeTailorHarness` | Resume Tailor flow |
| `/career-wiki/resume-versions` | dynamic `[section]` route | `ResumeTailorHarness` | Resume versions and exports |

## Current Component Inventory

Reusable app and UI primitives already exist:

| Area | Files | Reuse decision |
| --- | --- | --- |
| Original app shell | `src/components/app/*` | Reuse visual language: fixed sidebar, calm top-level layout, page header, local-first footer copy. Do not couple Career Wiki to the original client-side router. |
| shadcn/base primitives | `src/components/ui/*` | Reuse for button, card, badge, table, dialog, tabs, select, textarea, input, tooltip, skeleton, alert dialog. |
| Career Wiki workspace | `src/components/career-wiki/career-wiki-workspace.tsx` | Keep data flow, replace garbled labels and ad hoc layout with shared Career Wiki UI primitives. |
| Resume Tailor harness | `src/components/career-wiki/resume-tailor-harness.tsx` | Keep API calls and workflow constraints, refactor layout and status presentation. |
| Resume print preview | `src/components/career-wiki/resume-print-preview.tsx` | Keep standalone preview route, polish print controls and mobile readability. |
| Shared workflow stepper | `src/components/shared/workflow-stepper.tsx` | Useful pattern reference, but Career Wiki needs domain-specific status labels and blocked reasons. |
| Resume preview templates | `src/components/preview/templates/*` and `src/lib/career-wiki/resume-templates/*` | Keep rendering rules; do not mix evidence/risk internal fields into final resume body. |

## Styling And Design Token Usage

- Tailwind v4 is used through `src/app/globals.css`.
- Existing theme variables are neutral and local-product oriented: `--surface`, `--surface-low`, `--surface-mid`, `--surface-high`, `--line`, `--brand`, `--brand-muted`.
- Existing radii are moderate, with `--radius: 0.625rem`.
- The original LuJie UI uses a quiet, work-focused shell with a fixed left sidebar, serif brand mark, compact page headers, soft borders, and restrained shadows.
- Career Wiki pages currently bypass much of this consistency and repeat raw utility classes.

## Current Problems

1. Information architecture is fragmented: profile/projects/skills live in one workspace, resume workflow pages live in another harness, and production quality pages are standalone.
2. Navigation is duplicated and incomplete. Some pages link back to profile, some back to dashboard, and some use local tab bars only.
3. Several Career Wiki labels in `CareerWikiWorkspace` are mojibake, which makes the product unusable for Chinese UI.
4. Dashboard is an operations summary, not a user home page. It does not clearly guide JD import -> Project Fit -> Evidence Review -> Resume Tailor -> Approval -> Export.
5. Workflow page exposes backend state names and checklist rows without explaining user impact or next actions.
6. Evidence Review and Audit pages read like debug lists. They lack filters, severity hierarchy, detail panels, and clear action areas.
7. Project Fit, Evidence Editor, Resume Tailor, and Resume Versions are concentrated in a very large client component, making visual consistency harder to maintain.
8. Raw internal enum values are visible too often without Chinese labels.
9. Empty, loading, error, blocked, disabled, and success states are inconsistent.
10. Page max widths and spacing vary between `max-w-6xl`, `max-w-7xl`, and local grids.
11. Tables and cards lack a unified density and section header pattern.
12. Critical action constraints exist in backend code but are not consistently explained in the UI.

## Reusable Components And Patterns

Reuse these patterns before creating new code:

- Existing shadcn primitives in `src/components/ui`.
- Original LuJie app layout rhythm from `AppSidebar`, `AppTopbar`, and `AppPageHeader`.
- Existing Career Wiki domain repositories and API routes.
- Existing resume template rendering and export checklist logic.
- Existing workflow state machine and guard results.
- Existing audit log sanitizer and evidence review blocking rules.

New Career Wiki-only components should be thin wrappers over existing primitives:

- `CareerWikiAppShell`
- `CareerWikiSidebarNav`
- `CareerWikiPageHeader`
- `CareerWikiStatusStrip`
- `CareerWikiBreadcrumbs`
- `StatusBadge`
- `ScoreBadge`
- `Stepper`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `BlockedState`
- `ChecklistPanel`
- `ActionCard`
- `DetailPanel`

## Pages That Need Refactoring

Highest priority:

1. `/career-wiki/dashboard`
2. `/career-wiki/workflow`
3. `/career-wiki/project-fit`
4. `/career-wiki/evidence-editor`
5. `/career-wiki/evidence-review`
6. `/career-wiki/resume-tailor`
7. `/career-wiki/resume-versions`
8. `/career-wiki/audit`

Second priority:

1. `/career-wiki/jd-import`
2. `/career-wiki/jd-analyzer`
3. `/career-wiki/profile`
4. `/career-wiki/projects`
5. `/career-wiki/skills`
6. `/career-wiki/wiki-import`
7. `/career-wiki/resume-baseline`
8. `/career-wiki/resume-tests`
9. `/career-wiki/learning-tasks`
10. `/career-wiki/resume-versions/[id]/preview`

## Backend Logic That Must Not Change

- Evidence validation gates.
- Draft vs approved vs exported resume version rules.
- Workflow state transitions and guard evaluation.
- Project Fit scoring semantics and override reason requirement.
- Evidence status semantics: only `verified` evidence can support final resume claims.
- Audit log creation and sanitization.
- Obsidian export destination safety and timestamp no-overwrite behavior.
- Sensitive keyword filtering.
- Resume rendering rules that keep internal evidence and risk reports outside final resume body.
- No recruiting platform automation, crawler, auto-login, cookie, proxy, captcha, auto-apply, or HR messaging capabilities.

## Frontend Refactor Route

1. Create Career Wiki design system documentation.
2. Add Career Wiki UI primitives as small wrappers over existing components.
3. Add a shared Career Wiki App Shell and apply it to all `/career-wiki/*` pages except standalone print preview.
4. Redesign Dashboard as the home page and next-action hub.
5. Redesign Workflow as a readable state board.
6. Redesign JD Import and JD Analyzer for input -> preview -> save -> next action.
7. Redesign Project Fit with grouped fit levels and explainable scores.
8. Redesign Evidence Editor and Evidence Review around evidence status, quality, and blocking reasons.
9. Redesign Resume Tailor as a guided flow.
10. Redesign Resume Versions and standalone Preview for template selection and export readiness.
11. Redesign Audit as a filterable, readable event trail.
12. Add QA checklist and screenshot coverage for key pages.
13. Update README, release notes, project wiki, and MEMORY.
