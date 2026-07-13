# Career Wiki Agent - Document Ingestion and Resume Rendering Upgrade

Date: 2026-07-08

## Scope

This phase improves two gaps in Career Wiki Agent:

- Multi-format JD and baseline resume ingestion.
- Renderer-neutral resume output with Markdown, JSON, and HTML export.

## Out Of Scope

- Automatic job applications.
- Recruiting platform login automation.
- HR messaging.
- Cookie management.
- Proxy pools.
- CAPTCHA bypass.
- Login-state scraping.
- JobSpy automated crawling.
- ApplyPilot, AIHawk, AutoApplyMax, or LinkedIn auto-apply logic.

## Document Ingestion Design

Supported first-version formats:

- `.md`
- `.txt`
- `.html`
- `.pdf`
- `.docx`

Implementation:

- Markdown and TXT are parsed directly in Node.js.
- HTML is normalized to Markdown/plain text with a small local parser.
- PDF and DOCX use an optional MarkItDown CLI sidecar. If unavailable, the API returns a clear warning and other formats continue to work.

Security constraints:

- Default max file size is 10 MB.
- Only whitelisted extensions are accepted.
- Sensitive filenames and extensions are blocked, including `.env`, `.pem`, `.key`, `.p12`, `.crt`, `.cookie`, `.token`, `.sqlite`, and `.db`.
- The API stores normalized Markdown, not raw uploaded files.
- Parsed output is scanned for secret-like labels before confirmation/export.

## API Design

- `POST /api/career-wiki/document-ingest`
  - Accepts multipart upload or pasted text JSON.
  - Returns `ParsedDocument` preview.

- `POST /api/career-wiki/jd-import/confirm`
  - Confirms parsed Markdown into either `CareerJdTest` or `ResumeBaseline`.

- `POST /api/career-wiki/resume-versions/render`
  - Returns Markdown, JSON, or HTML preview from an existing resume version.

- `POST /api/career-wiki/resume-versions/export-format`
  - Exports approved/exported resume versions to Obsidian in Markdown, JSON, HTML, DOCX, or PDF format.

## Resume Render Schema

`ResumeRenderSchema` is renderer-neutral and contains:

- `profile`
- `target_role`
- `summary`
- `skills`
- `work_experience`
- `projects`
- `education`
- `awards`
- `evidence_summary`
- `risk_notes`
- `metadata`

Rules:

- Missing evidence and unsafe claims are excluded from render schema.
- `production-ready` wording is blocked.
- `ReviewFlow AI` must keep WIP/prototype/semi-finished state wording.
- Markdown, JSON, HTML, DOCX, and PDF exporters share this schema.

## Rendering Design

- Markdown keeps the current final resume capability.
- JSON exports `ResumeRenderSchema`.
- HTML uses a clean, print-friendly ATS-oriented layout.
- DOCX uses the existing `docx` dependency when available.
- PDF gracefully falls back to an HTML-print instruction when server-side PDF generation is unavailable.

## Obsidian Export

Export root:

`D:\AI-Workspace\CareerVault\05_Resume_Versions\`

Filename:

`{company}-{role}-v{version}-final-resume.{ext}`

Exports:

- Markdown final resume.
- HTML final resume.
- JSON render schema.
- Evidence report.
- Risk report.

Repeated exports use timestamped filenames and do not overwrite existing files.

## Acceptance Criteria

- `/career-wiki/jd-import` exists.
- Markdown, TXT, and HTML JD import work.
- PDF/DOCX return a clear MarkItDown warning if the sidecar is unavailable.
- Parsed JD can be saved as `CareerJdTest`.
- Parsed resume can be saved as `ResumeBaseline`.
- Resume versions can preview Markdown and HTML.
- Approved/exported resume versions can export Markdown, JSON, and HTML.
- DOCX/PDF endpoints return either a file or a graceful fallback message.
- Final resume exports do not contain secret labels, missing evidence text, or `production-ready`.
- Repeated exports do not overwrite existing files.
- `npx tsc --noEmit`, `npm test`, `npm run lint`, and `DATABASE_URL=file:./dev.db npm run build` pass.
