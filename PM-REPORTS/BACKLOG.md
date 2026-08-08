# PM backlog

Standing record of open issues on the site. Maintained by the `/pm` skill. IDs are never reused.

Status values: `open`, `planned`, `done`, `parked`. A `parked` item carries its reason so a later sweep does not reopen a decision already made.

| ID | Opened | Severity | Status | Title | Last seen | Report |
|---|---|---|---|---|---|---|
| FM-001 | 2026-08-06 | critical | open | Admin password hardcoded in source in all three API handlers, committed to the repo | 2026-08-06 | seeded, pre-sweep |

## Notes on open items

**FM-001.** The shared admin password is a string literal at the top of `api/boxleague.js`, `api/pairings.js` and `api/noticeboard.js` rather than an environment variable. It is therefore in the git history of the repo and in every deployed function bundle. Anyone who can read the repo can post to the write endpoints as admin. Two parts to any fix: move the value to a Vercel environment variable alongside `GIT_TOKEN`, and change the password itself, since the current one must be treated as already disclosed. Rotating without moving it to an env var fixes nothing.

Seeded by hand on 2026-08-06 while setting up the `/pm` skill, so that the first sweep does not rediscover it.
