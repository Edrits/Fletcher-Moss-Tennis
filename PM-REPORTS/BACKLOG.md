# PM backlog

Standing record of open issues on the site. Maintained by the `/pm` skill. IDs are never reused.

Status values: `open`, `planned`, `done`, `parked`. A `parked` item carries its reason so a later sweep does not reopen a decision already made.

| ID | Opened | Severity | Status | Title | Last seen | Report |
|---|---|---|---|---|---|---|
| FM-016 | 2026-08-11 | low | open | Sign-up UI polish: stuck button label, discarded error messages, unreachable `closed` branch | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-015 | 2026-08-11 | low | parked | Homoglyph names defeat clash detection (needs a deliberate attacker, not a real member) | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-014 | 2026-08-11 | low | open | First names published verbatim and archived permanently to the public repo | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-013 | 2026-08-11 | medium | open | Overlapping refreshes: a slow stale response can overwrite a newer one | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-012 | 2026-08-11 | medium | open | A failed archive blocks both `open` and `reset` with no override | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-011 | 2026-08-11 | medium | open | `defaultOpensAt` uses server time, so 8 PM means 9 PM in British Summer Time | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-010 | 2026-08-11 | medium | done | Admin password check was an unlimited-rate oracle | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-009 | 2026-08-11 | medium | done | Polling could exhaust the Upstash daily command allowance | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-008 | 2026-08-11 | high | done | Organiser validated after the old list was already destroyed | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-007 | 2026-08-11 | high | done | No rate limiting: one script could take all 28 places in seconds | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-006 | 2026-08-11 | high | done | Stored XSS: pasted player names rendered unescaped in `pairings.html` | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-005 | 2026-08-11 | high | done | A played session stayed "Open now" for days and still accepted joins | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-004 | 2026-08-11 | high | done | Organiser cancel token was guessable from the publicly published date | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-003 | 2026-08-11 | critical | done | Re-opening a live session silently deleted everyone signed up | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-002 | 2026-08-11 | critical | done | Validator rejected "Ed R.", the format the page itself teaches and publishes | 2026-08-11 | [sweep](2026-08-11-sweep.md) |
| FM-001 | 2026-08-06 | critical | done | Admin password hardcoded in source in all three API handlers, committed to the repo | 2026-08-11 | seeded, pre-sweep |

## Notes on open items

**FM-001.** The shared admin password is a string literal at the top of `api/boxleague.js`, `api/pairings.js` and `api/noticeboard.js` rather than an environment variable. It is therefore in the git history of the repo and in every deployed function bundle. Anyone who can read the repo can post to the write endpoints as admin. Two parts to any fix: move the value to a Vercel environment variable alongside `GIT_TOKEN`, and change the password itself, since the current one must be treated as already disclosed. Rotating without moving it to an env var fixes nothing.

Seeded by hand on 2026-08-06 while setting up the `/pm` skill, so that the first sweep does not rediscover it.

**FM-001 closed 2026-08-11.** Moved to `process.env.ADMIN_PASSWORD` in all three handlers, each guarded so a missing variable returns 500 rather than falling through to an unauthenticated write, and the value was rotated. Confirmed live: the endpoint returns 401 to a wrong password rather than 500. The old value remains in git history permanently and must never be reused.
