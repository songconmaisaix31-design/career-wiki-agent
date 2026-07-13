---
name: Career Wiki Agent
description: Evidence-aware career preparation for early-career candidates
colors:
  ink: "#111318"
  canvas: "#F7F8FB"
  surface: "#FFFFFF"
  primary-blue: "#2457FF"
  primary-blue-soft: "#DFE7FF"
  proof-lime: "#B9F227"
  proof-lime-soft: "#D5FF70"
  risk-coral-soft: "#FFD9D2"
  line: "#D9DCE3"
typography:
  display:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "normal"
  headline:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section-mobile: "80px"
  section-desktop: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-accent:
    backgroundColor: "{colors.proof-lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-blue}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

## Overview

Career Wiki Agent uses one visual system in two registers. The public root route is a high-contrast brand surface for social video, demos, and competition presentations. The `/career-wiki/*` routes are a calm operational workspace for repeated job preparation tasks. Both registers share the same semantic colors, typography, shape rules, icon family, evidence language, and accessibility baseline.

The creative north star is **The Decision Lens**: a precise instrument that turns an ambiguous job description into visible choices, verified claims, and a concrete next action. The interface should feel intelligent, direct, and premium without looking like a generic AI dashboard.

Public-page design dials are `DESIGN_VARIANCE 7`, `MOTION_INTENSITY 5`, and `VISUAL_DENSITY 4`. Product-page density is higher and motion is lower. Existing routes, primary navigation labels, evidence rules, and export semantics are preserved.

## Colors

- **Instrument Ink (`#111318`)** is the primary text and dark-surface color. It communicates scrutiny and avoids pure black.
- **Working Canvas (`#F7F8FB`)** is the neutral page background. It is cool and low-chroma, not cream or beige.
- **Decision Blue (`#2457FF`)** is reserved for primary navigation, selected controls, links, and forward action.
- **Verified Lime (`#B9F227`)** communicates evidence passed, approval, and high-confidence completion. It is semantic, not decoration.
- **Soft Decision Blue (`#DFE7FF`)** supports explanatory sections and selected low-emphasis surfaces.
- **Soft Risk Coral (`#FFD9D2`)** marks missing evidence or review risk. Risk must also include text or an icon.
- Muted text uses opacity of the local ink color instead of unrelated gray on colored backgrounds.
- Do not introduce purple gradients, multicolor glows, or new accent families. Blue is action; lime is verified state; coral is risk.

## Typography

Geist is the single UI family. Chinese falls back to PingFang SC and Microsoft YaHei. The product does not use decorative serif or monospace as shorthand for intelligence.

Display headings use weight 600, balanced wrapping, and a maximum of two lines in the hero. Body copy is capped near 65 characters per line and uses pretty wrapping. Data uses tabular numerals. Letter spacing stays at the font default.

Public copy is concise and outcome-oriented. Chinese is primary. English appears only for stable product terms such as JD, ATS, PDF, template names, and technical file formats.

## Elevation

The system is predominantly flat. Hierarchy comes from color fields, spacing, borders, and typographic scale. Cards use either a visible one-pixel border or a restrained shadow, not both. Resume sheets may use a stronger shadow because they represent a physical document above a work surface.

Corner radius is 8px for cards, controls, media frames, and panels. Pills are limited to tags and compact semantic states. Nested decorative cards are not allowed.

Motion uses a small fixed budget. Hero copy and the first media frame receive one coordinated entrance. Interactive tabs receive a short content transition. Buttons receive hover and press feedback. Animations use opacity and transform, complete within 500ms, and become instant under `prefers-reduced-motion`.

## Components

- **Navigation:** 64px high on desktop, stable on one line, with a single clear workbench CTA.
- **Buttons:** minimum 44px touch target, 8px radius, visible focus ring, 160ms interaction feedback, and 1px press translation.
- **Tabs:** native buttons with `role="tab"`, `aria-selected`, strong selected contrast, and no layout shift.
- **Workflow sequence:** numbers are allowed because order is meaningful. Other sections do not use numbered decoration.
- **Media placeholders:** fixed aspect ratio, dashed boundary, explicit asset label, and production brief. They are temporary contracts, not final artwork.
- **Resume preview:** real readable representative content, never gray skeleton bars pretending to be a screenshot.
- **Icons:** Lucide is the only runtime icon family because it is already installed throughout the project. Use consistent 16px, 20px, and 24px sizes with the library default stroke.
- **Status:** verified, warning, blocked, draft, approved, and exported states always pair color with text or an icon.

## Do's and Don'ts

Do:

- Lead with the concrete decision the product improves.
- Show the complete resume-to-JD-to-export sequence.
- Keep real product constraints visible: evidence, confirmation, privacy, and no automatic application.
- Use representative, sanitized data for public demos.
- Preserve user-facing focus states, keyboard behavior, and 44px touch targets.
- Test 375px, 768px, 1024px, and 1440px layouts.

Don't:

- Do not fabricate testimonials, user counts, interview rates, offer rates, or customer logos.
- Do not repeat tiny uppercase English labels above every section.
- Do not use decorative dots, fake terminals, fake dashboards, or gray-bar screenshot simulations.
- Do not animate layout properties, large blur surfaces, or continuous scroll listeners.
- Do not mix icon families, component primitive systems, or unrelated visual languages.
- Do not expose phone numbers, account data, local private paths, API keys, cookies, or tokens in public assets.
- Do not add crawler, auto-login, auto-apply, captcha, proxy, or HR messaging concepts to the public product story.
