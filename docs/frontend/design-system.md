# Career Wiki Frontend Design System

Date: 2026-07-09
Product direction: local-first Career OS for JD import, project matching, evidence review, resume tailoring, approval, and export.

## Design Principles

1. Workflow first: every page must show the current state, blockers, and the next useful action.
2. Local-first trust: communicate CareerVault, audit, and health state without exposing secrets or account data.
3. Evidence before claims: UI must explain why unsupported content cannot enter a final resume.
4. Calm density: this is an operational tool, not a landing page. Use compact layouts, clear hierarchy, and restrained decoration.
5. Chinese user copy, English technical identifiers: show Chinese labels first and internal enum values as secondary small text only when useful.

## App Shell

All `/career-wiki/*` pages except print preview use the same shell.

### Left Sidebar

Primary groups:

| Group | Items |
| --- | --- |
| Overview | Dashboard, Workflow |
| Intake | JD Import, JD Analyzer, Wiki Import, Baseline Resume |
| Fit & Evidence | Project Fit, Evidence Editor, Evidence Review |
| Resume | Resume Tailor, Resume Versions, Resume Tests, Learning Tasks |
| Knowledge | Profile, Project Bank, Skill Matrix |
| Operations | Audit Log, Health |

Rules:

- Highlight the active route.
- Use icons from `lucide-react`.
- Do not use emoji as icons.
- Keep item height stable, minimum 44px touch target.
- Keep sidebar fixed on desktop and horizontal/compact on mobile.

### Top Status Bar

Show:

- Current module.
- System health: pass / warn / fail.
- CareerVault status: configured / missing.
- Latest workflow state.
- Quick actions: Import JD, Run Project Fit, Add Evidence, Generate Resume, View Versions.

### Main Content

- Default max width: `max-w-7xl`.
- Content padding: `px-4 py-6` on mobile, `px-8 py-8` on desktop.
- Use consistent vertical spacing: `space-y-6`.
- Prefer two-column layouts only when the side panel has a stable purpose.

### Page Header

Each page header includes:

- Breadcrumb.
- Short Chinese title.
- One-sentence description.
- Primary action.
- Secondary actions.
- Optional status summary.

## Navigation Map

| Primary nav | Route | User job |
| --- | --- | --- |
| Dashboard | `/career-wiki/dashboard` | See overall state and next action |
| Workflow | `/career-wiki/workflow` | Understand state machine progress |
| JD Import | `/career-wiki/jd-import` | Import or paste JD |
| JD Analyzer | `/career-wiki/jd-analyzer` | Manually analyze JD |
| Project Fit | `/career-wiki/project-fit` | See which projects fit a JD |
| Evidence Editor | `/career-wiki/evidence-editor` | Add and verify evidence |
| Evidence Review | `/career-wiki/evidence-review` | Resolve evidence quality blockers |
| Resume Tailor | `/career-wiki/resume-tailor` | Generate and approve tailored resume |
| Resume Versions | `/career-wiki/resume-versions` | Preview and export versions |
| Audit Log | `/career-wiki/audit` | Trace critical actions |
| Profile | `/career-wiki/profile` | Edit personal profile |
| Project Bank | `/career-wiki/projects` | Maintain project material |
| Skill Matrix | `/career-wiki/skills` | Maintain skills and priorities |

## Layout Patterns

### Dashboard

- Hero status panel.
- Five-step workflow cards: JD Import -> Project Fit -> Evidence Review -> Resume Tailor -> Approval Export.
- Metrics grid.
- Risk panel.
- Quick action grid.
- Empty-state guidance.

### Workflow

- Left workflow list.
- Right detail panel.
- Horizontal or vertical stepper.
- Checklist panel with blocker reasons.
- Timeline for events.
- Transition form with required reason.

### Project Fit

- Top JD selector and target direction.
- Fit result groups.
- Project cards with score bars and evidence/risk summaries.
- Override action with required reason.
- Direct links to Evidence Editor and Resume Tailor.

### Evidence Editor / Review

- Left filters.
- Center list or queue.
- Right detail/editor panel.
- Clear `draft`, `verified`, `rejected` meaning.
- Review note required for review actions.

### Resume Tailor

- Guided stepper with nine steps.
- Blocked steps explain missing prerequisites.
- Draft, approved, and exported states must be distinct.
- Checklist failures link to repair pages.

### Resume Versions

- Left version list.
- Right detail and preview.
- Template selector.
- Export groups.
- Draft export disabled with reason.
- Approved/exported export shows checklist.

## Components

### Button

- Primary: important forward action.
- Secondary: safe navigation or supporting action.
- Destructive: irreversible or rejecting action, always with confirmation.
- Disabled buttons must show a visible reason nearby or through `title`.

### Card

- Use cards for individual workflow steps, records, repeated items, and panels.
- Radius: `rounded-lg` or smaller.
- Avoid cards inside cards unless the inner card is a repeated list item.

### Badge

Use `StatusBadge` for states and `ScoreBadge` for numeric scores.

### StatusBadge

| State | Label | Visual |
| --- | --- | --- |
| `success` | 通过 | green |
| `warning` | 注意 | amber |
| `danger` | 风险 | red |
| `info` | 信息 | blue |
| `muted` | 未开始 | gray |
| `blocked` | 已阻断 | red filled |
| `draft` | 草稿 | gray |
| `approved` | 已批准 | green |
| `exported` | 已导出 | blue |
| `archived` | 已归档 | gray outline |

### ScoreBadge And ProgressBar

- Scores under 40: danger.
- Scores 40 to 69: warning.
- Scores 70 and above: success.
- Always pair score with a label, not only a number.

### Stepper

- Shows `done`, `current`, `blocked`, and `pending`.
- Every blocked step must include reason and repair action.

### EmptyState

Must answer:

1. What is missing?
2. Why does it matter?
3. What should the user do next?

### LoadingState

- Use skeletons or concise text.
- Reserve layout space to avoid jumping.

### ErrorState

- Explain the failed action.
- Show user next step.
- Do not expose raw stack traces or secrets.

### BlockedState

- Use for evidence, workflow, checklist, and export blockers.
- Must include reason and repair action.

### DataTable

- Tables need a title and short description.
- Avoid too many columns. Move details into a side panel when needed.
- Use Chinese labels with small technical values where needed.

### ChecklistPanel

- Passed items are compact.
- Blocking items are prominent.
- Include repair route when available.

### Timeline

- Show action, actor/source, reason, risk level, and time.
- Keep before/after details summarized and sanitized.

### ExportButtonGroup

- Group by final resume formats and internal reports.
- Draft final export is disabled.
- Repeat export must mention timestamp no-overwrite behavior.

## State Color Semantics

| Semantic | Use |
| --- | --- |
| success | pass, verified, approved, exported successfully |
| warning | warn, needs review, draft, medium risk |
| danger | fail, rejected, high risk, blocked |
| info | active, running, available |
| muted | empty, pending, archived |
| blocked | cannot continue until reason is resolved |
| draft | generated but not approved |
| approved | can export final resume |
| exported | final artifact has been written |
| archived | retained but inactive |

## Copy Rules

- Page titles must be short and Chinese.
- Button text starts with a verb: 导入, 运行, 补充, 审核, 生成, 批准, 导出.
- Error text explains reason and next step.
- Empty-state text tells the next concrete action.
- Blocker text explains why the system cannot continue.
- Do not show raw JSON on primary pages.
- Do not expose secret-looking fields, account data, tokens, cookies, or API keys.

## Accessibility And Interaction

- Text contrast should meet WCAG AA.
- Interactive targets should be at least 44px tall.
- Use visible focus states.
- Keep button hover and focus states stable; no layout shift.
- Forms need labels.
- Icon-only buttons need `aria-label` and `title`.
- Mobile must be readable even if desktop is the primary target.

## Visual Direction

- Style: restrained SaaS operations UI with Swiss/minimal structure.
- Palette: existing neutral LuJie theme plus restrained status colors.
- Typography: existing Geist / system stack, with the existing serif brand only for brand display.
- Avoid decorative gradients, oversized marketing heroes, emoji icons, raw debug panels, and one-off color systems.
