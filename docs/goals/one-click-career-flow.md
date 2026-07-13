# One-click Career Flow

## Problem

The Career Wiki exposes internal modules as equal navigation destinations. New users must understand JD import, Project Fit, evidence review, Resume Tailor, versions, and export before they can produce a first draft.

## Goal

Make the default product path a single guided action:

1. Select a baseline resume.
2. Select an imported JD or paste a new JD.
3. Generate Project Fit results, a tailored draft, and a draft resume version with one click.
4. Review the draft before approval and export.

## Constraints

- Preserve all existing routes and advanced tools.
- Do not bypass evidence validation, approval, or export checklists.
- Do not add recruiting-platform automation.
- Keep the flow usable without an LLM key.
- Do not overwrite approved versions.

## Acceptance Criteria

- `/career-wiki` redirects to `/career-wiki/quick-start`.
- The primary navigation contains no more than three destinations.
- Existing tools remain available under an advanced disclosure.
- One click runs Project Fit, Resume Tailor, and draft version creation in order.
- Errors are shown beside the primary action.
- The result links to draft review and does not approve or export automatically.
- Desktop and mobile layouts remain usable.
