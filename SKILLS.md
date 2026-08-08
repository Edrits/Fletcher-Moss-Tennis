# SKILLS.md

Index of project-specific Claude Code skills for this repo. Skills live under `.claude/skills/<name>/SKILL.md` and are invoked with `/<name>`.

| Skill | Invoke | Purpose |
|---|---|---|
| [grill-me](.claude/skills/grill-me/SKILL.md) | `/grill-me` | Interviews you relentlessly about a plan or design, one decision branch at a time, until reaching shared understanding. |
| [pm](.claude/skills/pm/SKILL.md) | `/pm` | Project manager for the site. Sweeps for issues across security, correctness, data, frontend, SEO and design drift, dedupes against the standing backlog, and hires planning agents to work up the items worth doing. Writes to [PM-REPORTS/](PM-REPORTS/) only, never edits site code. |
| [fletcher-moss-design](.claude/skills/fletcher-moss-design/SKILL.md) | `/fletcher-moss-design` | Designs on-brand interfaces and assets using the Fletcher Moss Design System. Points at the brand kit in `design-system/`. |
