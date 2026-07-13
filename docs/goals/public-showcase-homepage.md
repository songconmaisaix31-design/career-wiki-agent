# Public Showcase Homepage

Date: 2026-07-11
Status: implemented

## Product Positioning

Career Wiki Agent is a local-first job preparation workspace for new graduates and professionals with one to three years of experience. Its primary promise is to turn an existing resume and a target JD into an evidence-aware, role-specific resume and a focused interview preparation plan.

The public homepage must work for three audiences in sequence:

1. The creator and nearby testers using the local product.
2. Social media viewers evaluating the product in a short video.
3. Competition judges evaluating product completeness, differentiation, and delivery potential.

## Primary User Outcome

The primary showcase flow is:

1. Upload or manually complete a baseline resume.
2. Paste a target JD.
3. Review project fit and application recommendation.
4. Generate a tailored resume draft.
5. Confirm evidence-backed content.
6. Switch resume templates.
7. Export a final PDF.

The homepage must communicate that the product improves job matching efficiency without claiming guaranteed interview or offer outcomes.

## Page Sequence

1. Navigation and product identity.
2. Hero promise and primary actions.
3. Interactive six-step product demo.
4. Complete workflow overview.
5. JD fit intelligence: application recommendation, competitiveness, and recommended projects.
6. Evidence-aware tailoring and human confirmation.
7. Resume template preview and final deliverables.
8. Seven-day interview-focused learning plan.
9. Target audience, local-first trust, and current product boundary.
10. Creator story and future proof placeholders.
11. Final call to action and footer.

## Visual Direction

- Mood: intelligent, premium, precise, and suitable for a product video or competition demo.
- Structure: bold editorial sections for the public homepage; the existing compact operational UI remains unchanged inside `/career-wiki/*`.
- Palette: high-contrast ink and white, electric blue for primary actions, acid green for validated states, and warm coral for risk or attention states.
- Typography: existing Geist stack with large, direct headings and compact product labels.
- Shape: flat blocks, restrained 8px radius, visible borders, and stable dimensions.
- Motion: short interaction transitions only; no decorative infinite animation; respect reduced-motion preferences.
- Media: fixed-ratio labeled placeholders until final generated assets are approved.

## Media Placeholders

- Hero visual: product workspace motion or product overview still.
- Product image: JD fit result interface.
- Flow diagram: resume-to-JD-to-final-resume sequence.
- Scenario image: seven-day interview preparation use case.
- User avatar: creator story or future verified user proof.
- Social preview image: video cover or social post preview.
- Delivery image: final resume templates and PDF output.

## Interaction Scope

- The homepage demo supports step selection and template selection using static representative data.
- Primary calls to action navigate to existing Career Wiki routes.
- The homepage does not submit data, call AI APIs, or create database records.
- Existing workflow guards, evidence validation, and export behavior remain the source of truth.

## Constraints

- Do not add Wiki or Obsidian import to the primary public flow.
- Do not add job-board crawling, automatic applications, account login, HR messaging, cookie handling, proxies, or captcha behavior.
- Do not use fabricated testimonials, customer counts, interview rates, or offer rates.
- Do not expose real personal or sensitive data in showcase content.
- Do not change backend APIs, database models, or `.env`.

## Acceptance Criteria

- `/` presents a complete Chinese public product homepage.
- The six-step demo and three-template selector are interactive.
- Every required future visual has a labeled placeholder with stable dimensions.
- The main CTA opens the existing Career Wiki dashboard.
- The page is usable at 375px, 768px, 1024px, and 1440px widths.
- Keyboard focus is visible, touch targets are at least 44px, and reduced motion is respected.
- Typecheck, tests, lint, and production build pass.
- Existing Career Wiki routes and backend behavior remain unchanged.
