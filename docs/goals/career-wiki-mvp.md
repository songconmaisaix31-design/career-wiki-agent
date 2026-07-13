# Career Wiki Agent MVP

## MVP Scope

- Career Profile: view and edit personal career wiki fields.
- Project Bank: create, edit, and view reusable project materials.
- Skill Matrix: maintain skills by category, level, evidence, and learning priority.
- JD Analyzer: manually input a JD and generate structured analysis.
- Learning Task Generator: generate a 7-day learning plan from JD analysis and skill gaps.
- Obsidian Markdown Export: export profile, projects, skills, JD analysis, and learning plan to a local vault.

## Out of Scope

- Automatic applications.
- Recruiting platform crawlers.
- Automatic login.
- Automatic HR messaging.
- Cookie management.
- Proxy pools.
- Captcha bypass.
- BOSS / Zhilian / LinkedIn automation.

## Data Model Design

- `CareerProfile`
  - `id`
  - `name`
  - `targetRoles`
  - `education`
  - `currentPosition`
  - `summary`
  - `strengths`
  - `weaknesses`
  - `createdAt`
  - `updatedAt`
- `CareerProject`
  - `id`
  - `name`
  - `status`
  - `description`
  - `techStack`
  - `highlights`
  - `resumeBullets`
  - `interviewStory`
  - `createdAt`
  - `updatedAt`
- `CareerSkill`
  - `id`
  - `name`
  - `category`
  - `level`
  - `evidence`
  - `learningPriority`
  - `createdAt`
  - `updatedAt`
- `CareerJdAnalysis`
  - `id`
  - `company`
  - `role`
  - `source`
  - `jdText`
  - `responsibilities`
  - `requiredSkills`
  - `bonusPoints`
  - `matchedProjects`
  - `skillGaps`
  - `matchScore`
  - `resumeSuggestions`
  - `interviewTips`
  - `createdAt`
  - `updatedAt`
- `CareerLearningTask`
  - `id`
  - `jdAnalysisId`
  - `title`
  - `description`
  - `relatedSkill`
  - `priority`
  - `dayIndex`
  - `estimatedTime`
  - `outputRequired`
  - `status`
  - `createdAt`
  - `updatedAt`
- `CareerExportLog`
  - `id`
  - `entityType`
  - `entityId`
  - `filePath`
  - `createdAt`

## Page Route Design

- `/career-wiki/profile`
  - Edit Career Profile.
- `/career-wiki/projects`
  - Manage Project Bank entries.
- `/career-wiki/skills`
  - Manage Skill Matrix entries.
- `/career-wiki/jd-analyzer`
  - Input JD text and view structured analysis.
- `/career-wiki/learning-tasks`
  - Generate and update 7-day learning tasks.

## API Design

- `GET /api/career-wiki/profile`
- `PUT /api/career-wiki/profile`
- `GET /api/career-wiki/projects`
- `POST /api/career-wiki/projects`
- `PATCH /api/career-wiki/projects`
- `GET /api/career-wiki/skills`
- `POST /api/career-wiki/skills`
- `PATCH /api/career-wiki/skills`
- `GET /api/career-wiki/jd-analyses`
- `POST /api/career-wiki/jd-analyses`
- `GET /api/career-wiki/learning-tasks`
- `POST /api/career-wiki/learning-tasks/generate`
- `PATCH /api/career-wiki/learning-tasks`
- `POST /api/career-wiki/export`

## JD Analysis Strategy

- First version uses a local rule engine.
- Optional AI enhancement can be added later behind existing AI readiness checks.
- Missing API key must not block profile, project, skill, JD analysis, task generation, or export workflows.

## Obsidian Export Plan

- Vault root is read from `CAREER_VAULT_PATH`.
- If `CAREER_VAULT_PATH` is missing, the API returns a user-facing configuration message instead of throwing an unhandled error.
- Export paths:
  - `00_Profile/profile.md`
  - `01_Project_Bank/{project_name}.md`
  - `02_Skill_Matrix/skill_matrix.md`
  - `03_JD_Library/{company}-{role}.md`
  - `04_Learning_Tasks/{company}-{role}-learning-plan.md`
- Markdown files include YAML frontmatter.
- Project and skill references may use Obsidian wikilinks such as `[[Finance-Agent-Lab]]`.
- Filenames are sanitized for Windows invalid characters.
- Existing files are not overwritten; exports append a timestamp suffix when needed.
- Export logs are stored in `CareerExportLog`.
- Secrets and recruiting platform account data are never included in export content.

## Acceptance Criteria

- Project starts normally.
- Career Wiki entry and pages are available.
- Career Profile can be viewed and edited.
- Project Bank entries can be created, edited, and viewed.
- Skill Matrix entries can be created, edited, and viewed.
- JD text can be manually entered and analyzed.
- A 7-day learning plan can be generated from JD analysis and skills.
- Obsidian Markdown export writes valid `.md` files into the configured vault.
- Export filenames are Windows-safe.
- Repeated export does not overwrite an existing file.
- No API key is required for baseline MVP workflows.
- No out-of-scope recruiting automation is included.
- Existing lint, test, typecheck, or build checks pass where available.

## Risks and Constraints

- The project was initialized from a source snapshot because direct Git clone failed in this environment.
- SQLite schema changes require Prisma generation before runtime verification.
- Large Obsidian exports should stay metadata-focused and avoid sensitive fields.

