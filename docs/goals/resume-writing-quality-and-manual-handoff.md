# Resume Writing Quality and Manual Application Handoff

Date: 2026-07-12
Status: In progress

## Goal

Reduce formulaic AI-like resume language without weakening evidence validation, then provide a human-controlled handoff from an approved exported resume to the original job page.

## Scope

- Analyze final resume Markdown with deterministic Chinese writing rules.
- Surface findings on Resume Tailor and Resume Versions pages.
- Block approval only for writing findings that also represent an unsafe claim.
- Remove known formulaic suffixes from rule-based resume generation.
- Record `ready_for_manual_send` and `manually_sent` actions in the existing audit log.
- Provide the original HTTP(S) job URL and exported resume path for manual use.

## Out of Scope

- Recruiting-platform crawling or batch search.
- Browser profile, Cookie, token, or account access.
- Login and CAPTCHA automation.
- Resume upload, application submission, or recruiter messaging.
- BOSS Zhipin-specific selectors or domain skills.

## Acceptance Criteria

1. Writing findings include code, severity, section, original content, reason, and suggestion.
2. Formulaic, repetitive, vague, keyword-stuffed, overlong, metric, and project-status language is detected.
3. ReviewFlow AI or another WIP project cannot be described as production-ready.
4. Style-only warnings do not block approval.
5. Blocking writing findings are included in the approval and export checklist.
6. Version pages show the writing score and findings before approval.
7. Manual handoff requires an approved/exported version, a valid source URL, and an exported file.
8. Marking an application as manually sent requires explicit confirmation and creates an audit log.
9. No recruiting-platform action is executed by the server.

## Dense Work Experience Refinement

Date: 2026-07-13

- Replace the former internship presentation with a verified full-time work experience block.
- Preserve the source order for company, role, date, business context, and evidence-backed outcomes; JD relevance may reorder only the outcome bullets.
- Render work experience as a dense title row plus context and bullets, matching the visual hierarchy of strong Chinese technical resumes without copying personal data or unsupported fields from references.
- Keep education after project experience with lower visual weight.
- Create new draft resume versions for review; never mutate approved or exported history.

### Refinement Acceptance Criteria

1. The Modern preview shows company, role, and date on one structured heading row.
2. Work context is visually distinct from outcome bullets.
3. The nine current JD resumes contain the verified Langfang Taixin work experience and no internship section.
4. Existing approved and exported versions remain unchanged.
5. Desktop preview fits the A4 canvas without horizontal overflow, overlap, or clipped text.

## Verification

- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `DATABASE_URL=file:./dev.db npm run build`
- Browser verification at desktop and mobile widths
