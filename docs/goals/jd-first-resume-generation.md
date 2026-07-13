# JD-first Resume Generation

## Problem

The current resume pipeline can generate a draft from placeholder baseline data. It also treats the target company and role as the resume headline, while the candidate profile is not part of the tailoring input. This produces a formatted report instead of a job-directed resume.

## Goal

Generate a truthful, visually polished resume from four explicit sources:

1. The imported baseline resume as the primary personal-history source.
2. Career Profile as the candidate identity and positioning source.
3. The selected JD as the ordering and emphasis source.
4. Verified Career Project and evidence records as optional supporting material.

## Content Rules

- Reject placeholder baselines before generation.
- Preserve work experience, education, and baseline project facts.
- Reorder evidence by JD relevance without inventing responsibilities or outcomes.
- Include only JD skills supported by the baseline, skill matrix, or verified evidence.
- Use Career Project material only when it has usable evidence.
- Keep WIP, prototype, MVP, and semi-finished project status visible.
- Keep missing evidence in internal reports, never in the formal resume body.
- Use the candidate name as the resume headline; target company is context, not identity.

## Visual Direction

- Use OpenResume as a reference for restrained, ATS-friendly information hierarchy.
- Use Reactive Resume as a reference for reusable schema-driven templates.
- Do not copy source code or assets from either project.
- Keep A4 print output stable, readable, and suitable for browser PDF export.

## Acceptance Criteria

- Placeholder baselines cannot generate new drafts.
- Career Profile is included in the tailoring input.
- The generated summary explicitly targets the selected JD without unsupported claims.
- Work and project evidence is ranked by JD relevance.
- The formal resume headline is the candidate name, not the target company.
- The modern template has a professional A4 hierarchy and remains printable.
- Existing evidence validation, approval, and export guards continue to pass.
- Unit tests cover baseline rejection, profile integration, JD ordering, and safe rendering.
