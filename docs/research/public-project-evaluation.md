# Career Wiki Agent - Public Project Evaluation

Date: 2026-07-08

## Executive Summary

Career Wiki Agent should continue from the current codebase instead of being replaced by a public project.

Recommended adoption:

- Resume rendering: use Reactive Resume as the primary reference and possible renderer module, with OpenResume only as a design/reference source.
- JD/resume matching: use Resume Matcher as a reference for ATS/keyword scoring and AI-assisted suggestions, but keep Career Wiki Agent's evidence validation and project-level matching as the source of truth.
- Multi-format JD upload: introduce MarkItDown first for lightweight PDF/DOCX/HTML/URL-to-Markdown ingestion; keep Docling as an optional advanced parser for scanned PDFs, layout-heavy PDFs, tables, OCR, and JSON provenance.
- JD source adapter: JobSpy can be used later as a human-triggered, rate-limited public JD discovery adapter. Do not enable proxy bypass or login-based scraping.
- Automation projects: ApplyPilot, AIHawk, AutoApplyMax, and GodsScion LinkedIn auto applier should be reference-only or explicitly out of scope for now. They automate job applications and create legal, account, platform, and reputation risk.

## Source Notes

Primary sources reviewed:

- Resume Matcher: https://github.com/srbhr/Resume-Matcher
- OpenResume: https://github.com/xitanggg/open-resume
- Reactive Resume: https://github.com/AmruthPillai/Reactive-Resume
- JobSpy: https://github.com/speedyapply/JobSpy
- ApplyPilot: https://github.com/Pickle-Pixel/ApplyPilot
- AIHawk: https://github.com/feder-cr/Jobs_Applier_AI_Agent_AIHawk
- AutoApplyMax: https://github.com/Azoo92i/AutoApplyMax
- GodsScion LinkedIn auto applier: https://github.com/GodsScion/Auto_job_applier_linkedIn
- MarkItDown: https://github.com/microsoft/markitdown
- Docling: https://github.com/docling-project/docling

## Candidate Comparison

| Project | Positioning | Stack | License | UI completeness | Resume design | Export support | JD/resume input | Matching | Automation | Local run | LLM | Automation risk | Integration cost | Recommended reuse |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `srbhr/Resume-Matcher` | AI resume tailoring and ATS/matching harness | Python, TypeScript, Next.js, vector/search concepts | Apache-2.0 | Medium/high | Medium/high | PDF output | Resume PDF/DOCX, pasted JD | Resume/JD matching, keywords, AI suggestions | No direct auto-apply | Yes | Yes, local/remote LLMs | Low/medium | Medium | Module reference for scoring, keyword extraction, matcher UX |
| `xitanggg/open-resume` | Browser-local resume builder and parser | TypeScript, Next.js, React, Tailwind | AGPL-3.0 | High for single-purpose resume builder | High, ATS-oriented | PDF; JSON import/export appears issue/PR-level, not stable core | Resume PDF import/parser | ATS readability parser, not JD matching | No | Browser-local | No core dependency | Low | Medium; AGPL limits code embedding | Design/reference only unless AGPL obligations are acceptable |
| `amruthpillai/reactive-resume` | Full self-hostable resume builder | TypeScript/React monorepo, self-host stack | MIT | Very high | Very high, many templates | PDF and JSON workflow | Resume builder/import/export; not JD-first | No JD matching core | No | Yes, self-host | Optional AI features | Low | High if embedded whole app; medium if renderer-only | Preferred rendering-layer reference/module |
| `speedyapply/JobSpy` | Public job scraper/dataframe library | Python | MIT | None/library | None | CSV/dataframe output | Public job search inputs | No | Scrapes job boards | Yes | No | Medium: scraping, ToS, proxy temptation | Medium; Python sidecar required | Later low-risk JD source adapter, human-triggered only |
| `Pickle-Pixel/ApplyPilot` | Autonomous job application agent | Python, browser automation/agents | AGPL-3.0 | Medium for automation ops | Has tailoring pipeline, not renderer-focused | Application materials pipeline | Jobs/forms/sites | Fit scoring/tailoring | Yes, any site/form | Yes | Yes | Very high: auto-submit, accounts, forms, platform ToS | High | Reference only; do not integrate now |
| `feder-cr/Jobs_Applier_AI_Agent_AIHawk` | AI job application automation | Python, Selenium/browser automation | AGPL-3.0 | Medium | Tailored application materials | Application workflow | Jobs/application forms | Tailoring/agent logic | Yes | Yes | Yes | Very high | High | Reference only for future human-gated architecture |
| `Azoo92i/AutoApplyMax` | Chrome extension for auto-applying | JavaScript/TypeScript, Chrome extension | AGPL-3.0 | High as extension/product | Resume generator/ATS checker advertised | Extension workflow | LinkedIn/Indeed/etc. | ATS checker and generated materials | Yes | Browser extension | Yes | Very high | High | Reference only; no direct integration |
| `GodsScion/Auto_job_applier_linkedIn` | LinkedIn auto job applier | Python, Selenium/undetected ChromeDriver/PyAutoGUI | AGPL-3.0 | Low/medium | Tailors resume from job info | Application automation | LinkedIn job pages/forms | Basic tailoring | Yes | Yes | Yes | Critical: LinkedIn automation, account and ToS risk | High | Do not use; reference only for risks to avoid |
| `microsoft/markitdown` | File/URL/document to Markdown conversion for LLM pipelines | Python | MIT | CLI/library only | None | Markdown output | PDF, Word, PowerPoint, Excel, images metadata/OCR, audio, HTML, CSV/JSON/XML, ZIP, YouTube URLs, EPUB | No | No | Yes | Optional LLM for image/audio-related enrichment | Low if sandboxed; file I/O needs input sanitization | Low/medium via sidecar or CLI | Adopt first for JD upload ingestion |
| `docling-project/docling` | Advanced document parsing for GenAI/RAG | Python | MIT for code; model licenses vary | CLI/library only | None | Markdown, HTML, WebVTT, DocTags, lossless JSON | PDF, DOCX, PPTX, XLSX, HTML, EPUB, email, images, LaTeX, Markdown, more | No | No | Yes | Supports VLM/OCR integrations | Low/medium; heavier dependencies/model concerns | Medium/high | Optional advanced parser after MarkItDown |

## Key Judgments

### 1. Continue Current Career Wiki Agent

Yes. The current app already has the most important differentiated layer: Career Wiki, Project Bank, Skill Matrix, evidence validation, version approval, and Obsidian export. Public projects mostly solve adjacent surfaces: rendering, parsing, matching, or risky automation.

Replacing the current app would lose the local-first evidence graph and approval workflow. The better path is modular adoption.

### 2. OpenResume vs Reactive Resume

Use Reactive Resume as the preferred resume rendering reference/module.

Reasons:

- MIT license is easier to reuse than OpenResume's AGPL-3.0.
- Reactive Resume is a more complete resume product: templates, PDF export, self-hosting, privacy positioning, JSON portability.
- It is better suited as a long-term rendering layer or template schema reference.

Use OpenResume only as a reference for:

- ATS-friendly single-page layout.
- Browser-local privacy design.
- PDF import parser ideas.
- Form-to-preview UX.

Do not embed OpenResume code unless AGPL obligations are intentionally accepted.

### 3. Resume Matcher

Use Resume Matcher as a scoring and UX reference, not as a full replacement.

What to reuse conceptually:

- Keyword coverage.
- ATS-style match score.
- Resume/JD gap analysis.
- Suggestion UX.
- Master resume + job-specific resume workflow.

What not to replace:

- Career Wiki Agent's project-level evidence validation.
- `CareerProject` provenance.
- `CareerResumeVersion` approval/export gates.

### 4. MarkItDown / Docling

Adopt MarkItDown first.

Best first use case:

- `JD Import`: PDF, DOCX, HTML, Markdown, TXT, URL-to-Markdown.
- `Baseline Resume Import`: PDF/DOCX to Markdown before structured parse.

Use Docling second for:

- scanned PDFs,
- tables,
- layout-heavy job descriptions,
- OCR,
- lossless JSON with layout provenance,
- document chunks with richer evidence metadata.

Recommended design:

- Keep both as optional Python sidecar adapters.
- Store normalized Markdown plus parser metadata.
- Never grant file parser access to `.env`, keys, tokens, or credential folders.

### 5. JobSpy

JobSpy can be used later as a low-risk JD source adapter only if constrained:

- Manual trigger only.
- Public job search only.
- No login.
- No cookies.
- No proxy bypass.
- No CAPTCHA bypass.
- Rate limits and source attribution.
- Store imported JD as `source = jobspy_public_search`.

Do not expose it as "auto scraping" in the first integration.

### 6. ApplyPilot / AIHawk / AutoApplyMax / GodsScion

Do not integrate directly.

Reasons:

- They automate job applications, form filling, LinkedIn/job-board interaction, or browser sessions.
- AGPL licensing is common across these projects, increasing reuse constraints.
- They require credentials, browser automation, anti-bot-sensitive behavior, and platform-specific logic.
- They conflict with the current project's explicit safety boundary.

Useful as references only:

- Human-in-the-loop gates.
- Application tracking schema.
- Question-answer knowledge base.
- Failure logging and audit trails.
- Explicit "do not submit without human confirmation" architecture.

## Recommended Combination

### Near-Term Adopt

1. `MarkItDown`
   - Purpose: multi-format JD/resume ingestion.
   - Reuse mode: module/sidecar adapter.
   - First integration priority: high.

2. `Resume Matcher`
   - Purpose: scoring/keyword/reference architecture.
   - Reuse mode: algorithm and UX reference, selected helper modules only after review.
   - First integration priority: high.

3. `Reactive Resume`
   - Purpose: beautiful resume rendering and template architecture.
   - Reuse mode: renderer/template reference first; module extraction later.
   - First integration priority: medium/high.

### Later Optional

4. `Docling`
   - Purpose: advanced document parsing/OCR/layout provenance.
   - Reuse mode: optional parser sidecar.
   - First integration priority: medium.

5. `JobSpy`
   - Purpose: public JD discovery/import.
   - Reuse mode: adapter with hard safety constraints.
   - First integration priority: medium/low.

### Reference Only / Not Now

- ApplyPilot
- AIHawk
- AutoApplyMax
- GodsScion LinkedIn auto applier

## Proposed Refactor Route

### Phase 1: Resume Rendering Quality

Goal: improve visual output without replacing Career Wiki Agent.

Recommended modules:

- `src/lib/career-wiki/resume-render-schema.ts`
  - Convert `CareerResumeVersion` into a renderer-neutral resume JSON.
- `src/lib/career-wiki/renderers/markdown-renderer.ts`
  - Keep current Markdown output.
- `src/lib/career-wiki/renderers/reactive-resume-adapter.ts`
  - Map Career Wiki resume JSON into a Reactive Resume-like schema.
- `src/app/api/career-wiki/resume-versions/render/route.ts`
  - Preview/export rendered resume.

First implementation should not embed the whole Reactive Resume app. Start with schema mapping and template reference.

### Phase 2: Multi-Format JD Upload

Recommended modules:

- `src/lib/career-wiki/document-ingest/types.ts`
  - `DocumentInput`, `ParsedDocument`, `ParserProvenance`.
- `src/lib/career-wiki/document-ingest/markitdown-adapter.ts`
  - Call MarkItDown sidecar or CLI.
- `src/lib/career-wiki/document-ingest/docling-adapter.ts`
  - Optional advanced parser.
- `src/app/api/career-wiki/jd-import/route.ts`
  - Upload PDF/DOCX/Markdown/HTML/TXT.
- `src/components/career-wiki/jd-import-panel.tsx`
  - Upload UI, parser preview, provenance display.

Safety:

- Restrict file size.
- Restrict MIME/extension.
- Store parsed Markdown, never raw credentials.
- Block `.env`, key, token, cookie, certificate, and private-key filenames.

### Phase 3: Matching Upgrade

Recommended modules:

- `src/lib/career-wiki/matching/types.ts`
  - `JdRequirement`, `ProjectMatch`, `EvidenceMatch`.
- `src/lib/career-wiki/matching/keyword-score.ts`
  - Resume Matcher-inspired keyword coverage.
- `src/lib/career-wiki/matching/project-score.ts`
  - Current project-level evidence scoring.
- `src/lib/career-wiki/matching/evidence-score.ts`
  - Strong evidence and provenance ranking.
- `src/lib/career-wiki/matching/report.ts`
  - Match summary and missing evidence report.

Important: matching should rank projects by evidence, not just keyword overlap.

### Phase 4: Export Formats

Recommended modules:

- `src/lib/career-wiki/export/final-resume-md.ts`
- `src/lib/career-wiki/export/final-resume-html.ts`
- `src/lib/career-wiki/export/final-resume-pdf.ts`
- `src/lib/career-wiki/export/final-resume-docx.ts`
- `src/lib/career-wiki/export/final-resume-json.ts`

Use existing app dependencies first:

- `docx` for DOCX.
- browser/print or a server-side renderer for PDF.
- Markdown as canonical source.
- JSON as renderer-neutral exchange format.

### Phase 5: JD Source Adapter

Recommended modules:

- `src/lib/career-wiki/job-source-adapters/types.ts`
- `src/lib/career-wiki/job-source-adapters/manual.ts`
- `src/lib/career-wiki/job-source-adapters/jobspy-public-search.ts`
- `src/app/api/career-wiki/job-sources/search/route.ts`

Hard constraints:

- Manual trigger only.
- No login.
- No cookies.
- No proxy.
- No CAPTCHA bypass.
- No automatic apply.
- Store source URL and query.
- Require user confirmation before converting to JD test.

## Risk Notes

### License Risk

- AGPL projects are not good candidates for direct code embedding unless the project is prepared to comply with AGPL distribution and network-use obligations.
- MIT and Apache-2.0 projects are easier to reuse.
- Docling code is MIT, but model licenses may differ.

### Automation Risk

Auto-apply projects can create account bans, platform ToS violations, spam/reputation problems, privacy exposure, and accidental submissions. They should not be part of Career Wiki Agent until the app has strong user confirmation, audit logging, and clear legal boundaries.

### Data/Security Risk

Document parsers can read local files with the current process permissions. MarkItDown explicitly warns that it performs I/O with process privileges. Any parser integration needs path allowlists, file-size limits, extension checks, and secret-file guards.

### Product Risk

Beautiful resume rendering is not enough. If the final resume is visually polished but evidence quality is weak, it increases user risk. Rendering should sit after evidence validation, not before it.

## File-Level Integration Recommendations

Keep:

- `src/lib/career-wiki/resume-version.ts`
  - Continue as the approval/export gate.
- `src/lib/career-wiki/resume-tailor.ts`
  - Continue as fallback generator.
- `src/lib/career-wiki/test-harness-repository.ts`
  - Split later if it grows, but do not rewrite now.

Add:

- `src/lib/career-wiki/document-ingest/`
  - MarkItDown / Docling adapters.
- `src/lib/career-wiki/matching/`
  - Resume Matcher-inspired scoring and project-level evidence ranking.
- `src/lib/career-wiki/renderers/`
  - Markdown, HTML, PDF, DOCX, JSON export/render adapters.
- `src/lib/career-wiki/job-source-adapters/`
  - Manual and JobSpy public-search adapters.
- `src/app/api/career-wiki/jd-import/route.ts`
  - Multi-format JD upload.
- `src/app/api/career-wiki/resume-versions/export/[format]/route.ts`
  - Format-specific final resume export.

Refactor later:

- `src/components/career-wiki/resume-tailor-harness.tsx`
  - Split into `ResumeTailorFlow`, `ResumeVersionList`, `DiffPanel`, `EvidencePanel`, and `ExportChecklistPanel`.

## Final Recommendation

Do:

- Keep Career Wiki Agent as the main product.
- Adopt MarkItDown first for document ingestion.
- Use Resume Matcher ideas for scoring.
- Use Reactive Resume as the resume rendering/template reference.
- Keep Docling as an advanced parser option.
- Consider JobSpy only as a constrained, public, human-triggered JD source adapter.

Do not:

- Replace the current app with OpenResume or Reactive Resume.
- Directly embed AGPL auto-apply projects.
- Add login automation, cookie handling, proxy pools, CAPTCHA bypass, or auto-submit.
- Export a visually polished resume before evidence validation passes.

## Suggested Next Goal

```text
/goal
Project: Career Wiki Agent - Multi-format JD Import MVP
Goal:
Add a safe JD import pipeline using MarkItDown as the first parser adapter.
Scope:
- PDF/DOCX/HTML/Markdown/TXT upload
- parser preview
- source provenance
- secret-file guard
- create JD test from parsed Markdown
- no scraping, no login, no auto apply
Final commit:
feat: add multi-format jd import
```
