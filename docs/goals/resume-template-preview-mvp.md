# Career Wiki Agent - Multi-format Resume Template Preview MVP

Date: 2026-07-08

## Scope

This phase upgrades final resume output from basic export to template-based preview and print-ready delivery.

## Out Of Scope

- Automatic job applications.
- Recruiting platform crawling.
- Login automation.
- HR messaging.
- Cookie management.
- Proxy pools.
- CAPTCHA bypass.
- JobSpy integration.
- ApplyPilot, AIHawk, or AutoApplyMax application logic.

## Templates

First-version templates:

- `modern`: polished layout for internet, AI application, and productized project resumes.
- `ats`: conservative structure for ATS parsing.
- `compact`: dense one-page-oriented layout for junior or early-career resumes.

All templates render from `ResumeRenderSchema` and must not include evidence or risk reports in the formal resume body.

## Preview UX

`/career-wiki/resume-versions` supports:

- Version selection.
- Template selection.
- Markdown/HTML preview.
- Export checklist display.
- Standalone preview link.

Standalone preview:

`/career-wiki/resume-versions/[id]/preview?template=modern`

The standalone page removes app navigation, shows a browser-printable resume preview, and provides print/save-as-PDF guidance.

## Export API

`POST /api/career-wiki/resume-versions/export-format`

Parameters:

- `format`: `markdown | json | html | docx | pdf`
- `template`: `modern | ats | compact`
- `page_size`: `A4`
- `include_internal_reports`: `false`

Rules:

- Draft versions can preview only.
- Approved/exported versions can export final files.
- Export checklist runs before export.
- Repeat exports use timestamped filenames.

## Export Paths

Root:

`D:\AI-Workspace\CareerVault\05_Resume_Versions\`

Files:

- `{company}-{role}-v{version}-{template}-final-resume.html`
- `{company}-{role}-v{version}-{template}-final-resume.docx`
- `{company}-{role}-v{version}-{template}-final-resume.md`
- `{company}-{role}-v{version}-{template}-render-schema.json`

Evidence and risk reports remain separate files.

## Acceptance Criteria

- Three templates are available: `modern`, `ats`, `compact`.
- Resume Versions page can switch template and preview.
- Standalone print preview page exists.
- HTML supports A4 print CSS.
- DOCX output has clearer headings, spacing, skill groups, and project bullets.
- Export filenames include template.
- JSON export includes renderer metadata.
- HTML output does not include `Missing Evidence`, `production-ready`, `API Key`, `Cookie`, or `token`.
- ReviewFlow AI status remains WIP/prototype/semi-finished when present.
- `npx tsc --noEmit`, `npm test`, `npm run lint`, and `DATABASE_URL=file:./dev.db npm run build` pass.
