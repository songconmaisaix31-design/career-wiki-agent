# Career Wiki Agent - Browser-Assisted Job Application Evaluation

Date: 2026-07-12
Status: Research and architecture decision

## Executive Decision

Career Wiki Agent should implement a browser-assisted, human-controlled application handoff instead of autonomous job-board automation.

The recommended workflow is:

1. The user opens a job detail page in their own browser.
2. The user explicitly captures the currently visible JD or pastes it into Career Wiki Agent.
3. Career Wiki Agent normalizes and previews the JD before saving it.
4. Existing Project Fit, Resume Tailor, evidence validation, and writing-quality checks generate a draft.
5. The user reviews the diff, evidence, unsupported claims, and wording findings.
6. An approved resume version is exported.
7. Career Wiki Agent reopens the original job URL and presents the approved file.
8. The user uploads and sends the resume manually on the recruiting platform.

Do not automate login, CAPTCHA handling, Cookie storage, anti-bot bypass, message composition to recruiters, file upload to BOSS Zhipin, or the final send action.

## Recommended Open-Source Combination

| Project | Role | Decision | Reason |
|---|---|---|---|
| `browser-use/browser-harness` | Connect an agent to a user-controlled Chrome session through CDP | Use as an external operator for an explicitly opened page | Thin MIT-licensed harness, local browser connection, reusable domain skills, and no need to embed a browser runtime into the Next.js app |
| `srbhr/Resume-Matcher` | JD keyword coverage and resume gap UX | Reuse concepts and selected scoring ideas | Mature local deployment, current Next.js/React frontend, explainable matching surface; Career Wiki evidence remains the source of truth |
| `amruthpillai/reactive-resume` | Resume schema, templates, and final rendering | Continue using as the rendering reference | MIT license, multiple templates, A4/Letter support, PDF/JSON/DOCX, and local/self-hosted operation |
| `textlint/textlint` | Natural-language lint infrastructure | Reuse the rule-engine pattern, not necessarily the dependency | Mature pluggable lint model and machine-readable findings; custom Career Wiki rules are more suitable for Chinese resumes |
| `speedyapply/JobSpy` | Public job discovery on supported international sources | Optional later adapter, not for BOSS Zhipin | Useful for public sources but does not provide a reliable, supported BOSS Zhipin integration |
| `Pickle-Pixel/ApplyPilot` | End-to-end application pipeline reference | Reference only | Useful stage separation and dry-run concepts, but autonomous submission, CAPTCHA services, and AGPL scope conflict with this project |

## Projects Not Recommended for Direct Integration

### BOSS Zhipin Scrapers

Repositories such as `jhcoco/bosszp` and `ctkqiang/boss_zhipin_pachong` should not be integrated.

Reasons:

- Their core value depends on platform-specific scraping behavior.
- Public implementations commonly discuss disabling robots rules, manipulating request headers, handling Cookies, or working around anti-scraping controls.
- Selectors and response formats are brittle and can fail without warning.
- They create account, legal, platform policy, and maintenance risk without improving Career Wiki Agent's differentiated resume workflow.

### Autonomous Application Agents

Do not embed ApplyPilot, AIHawk, AutoApplyMax, or LinkedIn auto-applier logic.

Their useful ideas are limited to:

- explicit pipeline stages,
- dry-run previews,
- application status tracking,
- failure logs,
- human approval checkpoints.

Their submission, login, CAPTCHA, proxy, and recruiter-message automation must remain out of scope.

## Browser-Assisted Architecture

### Trust Boundary

`browser-harness` should remain an external local tool, not a runtime dependency of Career Wiki Agent.

Allowed browser operations:

- connect to a browser after the user explicitly enables CDP access,
- inspect the currently active user-selected job detail page,
- extract visible job title, company, location, source URL, and JD text,
- return structured JSON to a local temporary file or clipboard,
- reopen the original source URL after resume approval.

Blocked browser operations:

- search or crawl BOSS Zhipin in batches,
- read or persist Cookies, tokens, account identifiers, or private messages,
- automate login or CAPTCHA flows,
- send messages to recruiters,
- upload or submit a resume,
- click any final application or send control.

### Proposed Data Contract

```ts
interface BrowserCapturedJob {
  source: "boss_zhipin_visible_page" | "manual_url";
  sourceUrl: string;
  capturedAt: string;
  company: string;
  role: string;
  location?: string;
  salaryText?: string;
  jdText: string;
  captureMode: "visible_page_user_confirmed";
}
```

The captured payload must pass the existing JD import preview before persistence. Browser extraction is untrusted input and must never bypass schema validation or sanitization.

### Application State Machine

```text
captured
  -> jd_confirmed
  -> fit_reviewed
  -> resume_draft
  -> wording_review
  -> evidence_review
  -> approved
  -> exported
  -> ready_for_manual_send
  -> manually_sent | abandoned
```

Only a human action can transition `resume_draft` to `approved` or `ready_for_manual_send` to `manually_sent`.

## Reducing AI-Like Resume Language

Do not add a generic "humanizer" model. It introduces another opaque rewrite step and can weaken evidence fidelity.

Add a deterministic writing-quality gate after tailoring and before approval.

### Resume Writing Rules

Each bullet should prefer:

```text
verified action + concrete object + implementation method + verified result
```

Rules:

- Keep one primary claim per bullet.
- Prefer concrete nouns and verbs over abstract evaluation.
- Remove self-assessment such as "strong ability", "excellent", and "proficient" unless the statement is a skill-level field rather than a resume claim.
- Flag empty business language such as "empower", "closed-loop", "deeply participated", and "significantly improved" when no evidence or metric follows.
- Do not invent percentages, scale, users, revenue, latency, accuracy, or production status.
- Preserve the user's original terminology for products, workflows, and technical constraints.
- Vary sentence structure only when meaning remains unchanged; style variation must not create new claims.
- Keep WIP, prototype, MVP, and semi-finished qualifiers visible.
- Limit repeated openings such as "Responsible for" across adjacent bullets.
- Prefer 28-55 Chinese characters per bullet as a review hint, not a hard rejection rule.
- Show every automated rewrite in the existing diff before approval.

### Proposed Finding Types

```ts
type ResumeWritingFindingCode =
  | "generic_claim"
  | "unsupported_superlative"
  | "unverified_metric"
  | "repeated_sentence_opening"
  | "excessive_keyword_stuffing"
  | "overlong_bullet"
  | "vague_subject"
  | "production_status_overclaim";
```

Findings should include severity, section, original text, explanation, and a suggested edit. Suggestions remain drafts until the user accepts them.

## Module-Level Integration Plan

### Phase 1: Writing Quality Gate

Add:

- `src/lib/career-wiki/writing-quality/types.ts`
- `src/lib/career-wiki/writing-quality/rules.ts`
- `src/lib/career-wiki/writing-quality/analyze-resume.ts`
- `src/lib/career-wiki/writing-quality/analyze-resume.test.ts`
- `src/components/career-wiki/resume-writing-review.tsx`

Integrate with:

- existing Resume Tailor draft generation,
- resume version approval checklist,
- baseline-versus-tailored diff,
- final export checklist.

A high-severity writing finding must block approval only when it also represents unsupported evidence, a fabricated metric, sensitive data, or a production-status overclaim. Pure style findings should require acknowledgement but not block export.

### Phase 2: Explicit Browser Capture Handoff

Keep browser automation outside the application process.

Add later, after the project safety boundary is explicitly revised:

- `tools/browser-harness/capture-current-job.md`
- `src/lib/career-wiki/job-capture/types.ts`
- `src/lib/career-wiki/job-capture/validate-capture.ts`
- `src/app/api/career-wiki/jd-import/browser-capture/route.ts`
- a JD import preview action labelled `Import current visible job page`

The API may accept a user-confirmed JSON payload. It must not launch Chrome, access browser profiles, or execute platform-specific login and scraping code.

### Phase 3: Manual Send Handoff

Add application tracking without submission automation:

- store the approved resume version ID,
- store the original job URL,
- show the exported file path,
- provide `Open job page` and `Open resume folder` actions,
- let the user manually mark the application as sent,
- write an audit entry with timestamp and selected resume version.

Do not add an API endpoint named `submit`, `send`, or `auto-apply` for recruiting platforms.

## Acceptance Criteria for a Safe MVP

1. The user can import or paste one JD and confirm the normalized content.
2. The system generates a draft using only verified evidence.
3. Writing-quality findings identify vague, repetitive, unsupported, and overclaimed language.
4. The user can accept or reject individual wording suggestions.
5. Approval still requires evidence validation and the existing export checklist.
6. The approved resume can be exported and linked to the source job URL.
7. The system can reopen the job page and resume folder.
8. The final upload and send actions remain manual.
9. No Cookie, token, login data, private message, or recruiting-platform account information is stored.
10. No crawler, CAPTCHA bypass, proxy, automatic application, or recruiter-message feature is introduced.

## Sources

- Browser Harness: https://github.com/browser-use/browser-harness
- Resume Matcher: https://github.com/srbhr/Resume-Matcher
- Reactive Resume: https://github.com/amruthpillai/reactive-resume
- OpenResume: https://github.com/xitanggg/open-resume
- JobSpy: https://github.com/speedyapply/JobSpy
- ApplyPilot: https://github.com/Pickle-Pixel/ApplyPilot
- textlint: https://github.com/textlint/textlint
- BOSS Zhipin scraper example: https://github.com/jhcoco/bosszp
- BOSS Zhipin crawler example: https://github.com/ctkqiang/boss_zhipin_pachong

## Current Constraint

The current project `AGENTS.md` explicitly prohibits recruiting-platform automation, login automation, crawler behavior, automatic applications, and recruiter messaging. Therefore this research does not authorize implementation of browser capture or send behavior. The writing-quality gate and manual JD workflow can be implemented under the existing boundary; browser integration requires an explicit project-rule change and a separate reviewed goal.
