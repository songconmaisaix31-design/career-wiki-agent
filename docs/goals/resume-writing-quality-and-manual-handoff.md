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

## HR Screening Consolidation

Date: 2026-07-13

- Position the candidate as `AI Application Development / Python Data Automation`; remove the unsupported `AI Full-stack Engineer` claim.
- Use a concrete, metric-backed summary instead of audit or specification language.
- Keep verified ATS keywords from the baseline even when a JD names only a subset.
- Treat finance calculation and cross-platform collection as work evidence, not duplicate standalone projects.
- Keep one complementary personal project in the project section.
- Rename software systems accurately; do not use `Agent` or `intelligent agent` when the evidence shows rules, workflows, or a local software platform.
- Preserve user-provided dates until the user explicitly confirms a different employment status.
- Do not invent phone, email, GitHub, location, production usage, team size, deployment, business outcomes, or awards.

### HR Screening Acceptance Criteria

1. The visible headline is `AI 应用开发 / Python 数据自动化`.
2. The summary includes the verified six-city scope, 83 tests, and 300,000-row capacity validation.
3. The skill section contains concrete Python, data, engineering, and Web keywords without unsupported Agent-only claims.
4. Work-derived finance and collection systems do not repeat in the project section.
5. The project section contains one complementary personal project with an explicit local MVP status.
6. Resume language does not contain `受治理规则集`, `partial verification`, `evidence validation`, or `fail-closed`.
7. The Modern resume fits one A4 page at the desktop print viewport without horizontal overflow.

## Dense Chinese Resume Layout

Date: 2026-07-15

- Treat the Modern template as a recruiter-scanning document rather than a showcase page.
- Use narrow A4 print margins, a single-row identity header, left-aligned summary copy, compact two-column skills, and full-width ruled section headings.
- Keep the verified content order and evidence boundaries unchanged; visual references do not authorize adding contact details, demographic fields, links, technologies, or outcomes.
- Preserve a readable mobile preview while applying dense print rules only to A4 output.

### Layout Acceptance Criteria

1. A4 print margins are no greater than 10 mm horizontally.
2. Candidate name and positioning share the header row on desktop.
3. Section headings use compact horizontal rules instead of large filled banners.
4. Body copy remains readable without overlap, clipping, or horizontal overflow.
5. The current HR-screening resume remains a single A4 page.

## JD-Specific Resume Generation

Date: 2026-07-15

- Generate one distinct resume draft for each JD instead of reusing a fixed project and skill list.
- Extract role, technology, delivery, quality, data, product, and domain keywords from each JD.
- Use JD relevance to order the summary focus, evidence-backed skills, work highlights, selected projects, and project bullets.
- Keep work-derived finance and collection systems in work experience; select up to two complementary personal projects when their verified content supports the JD.
- Treat project-fit `force_exclude`, archived, and `do_not_use` project status as hard exclusions.
- Keep unsupported JD requirements in `missingEvidence` and learning tasks. They must not appear as candidate capabilities in the final resume.
- Preserve one project entry per project family and never duplicate the same project under translated and source names.

### JD-Specific Acceptance Criteria

1. Two materially different JDs produce different skill priorities, work-highlight ordering, project selection, or project-bullet ordering.
2. Each selected project has direct keyword or capability overlap with its JD and contains evidence-backed bullets.
3. The summary remains grounded in the verified profile but highlights the technologies and projects most relevant to the current JD.
4. `AI 恋爱大师`, `WorldQuant Brain 金融数据量化处理`, archived projects, and explicit `force_exclude` results never return to a resume.
5. Missing JD requirements are visible in `missingEvidence` and remain absent from `finalResumeMarkdown`.
6. Existing approved and exported resume versions remain immutable; regenerated results create new draft versions.

## Dashboard Evidence And AI Workflow Skills

Date: 2026-07-15

- Treat `Merchant Operations Dashboard` as a primary business project when its verified data, delivery, Web, or quality evidence overlaps with the JD.
- Keep dated dashboard metrics source-bound. They may describe the verified `20260714` run but must not imply current liveness or fully reproducible deployment.
- Include at least two distinct, resume-ready project families in each structured-work draft when two eligible projects exist.
- Prefer quantified project bullets when the quantity is directly supported by Wiki, baseline, test, or user-confirmed evidence; never invent ROI, users, latency, revenue, or efficiency claims.
- Keep JD-matched technical skills first and add the user-confirmed AI development workflow as `Codex`, `Claude Code`, and `Spec Coding`.
- Do not add `Cursor`, `GitHub Copilot`, or another AI tool until direct evidence is available.

### Dashboard Acceptance Criteria

1. Each regenerated JD draft contains at least two distinct project entries.
2. `Merchant Operations Dashboard` is displayed as `商户经营分析与预警平台`.
3. Dashboard bullets retain the verified module, pipeline, merchant, alert, tracking, district, and trade-area quantities.
4. AI workflow tools render in a separate `AI 工作栈` skill group.
5. Existing approved and exported versions remain unchanged.

## Agentic Governance Positioning

Date: 2026-07-15

- Position `Merchant Operations Dashboard` as an Agentic AI merchant-operations governance platform, not a passive reporting dashboard.
- Keep LangGraph as a roadmap item until implementation, tests, and run evidence exist. The current verified capability is a deterministic ten-node governance workflow covering source-card loading, field normalization, required-field and primary-key checks, grain compatibility, dataset merge, business rules, delivery payload generation, and run-ledger persistence.
- Preserve the current execution boundary: the governance workflow is dry-run-only, quality failure blocks delivery, and real external changes require human confirmation.
- Make the dashboard the primary work-experience narrative while keeping project bullets focused on architecture and governance implementation.
- Add the user-confirmed `视频剪辑` and `AIGC 内容生产` skills without inferring specific software, portfolio metrics, or commercial outcomes.

### Agentic Governance Acceptance Criteria

1. Work experience leads with merchant operations, anomaly governance, and the Agentic AI workflow.
2. LangGraph is absent from final resume claims and recorded as a project roadmap item.
3. The final resume states or preserves the dry-run and human-confirmation boundary.
4. `视频剪辑` and `AIGC 内容生产` appear in a dedicated content-production skill group.
5. Each regenerated JD resume keeps two distinct project entries and evidence-backed quantities.

### LangGraph Roadmap Correction

- User clarification on 2026-07-15: LangGraph is planned work, not an implemented project capability.
- Mark the former LangGraph skill evidence as rejected and the project-level roadmap evidence as draft.
- Skills with `planned`, `learning`, `draft`, or `rejected` levels must not enter final resume content.
- Reintroduce LangGraph only after source code, focused tests, and a dated workflow run are available.

## Verification

- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `DATABASE_URL=file:./dev.db npm run build`
- Browser verification at desktop and mobile widths
