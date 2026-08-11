# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Writing style

Use British English spelling in all content, copy, and comments (e.g. "colour" not "color", "organise" not "organize").

## What this is

A static marketing/community website for Fletcher Moss Social Tennis Club, deployed on Vercel. There is no build step, no bundler, and no frontend framework — each page is a single self-contained HTML file with inline `<style>` and `<script>` blocks. Data persistence is handled by Vercel serverless functions in `api/` that read/write JSON files directly in this GitHub repo via the GitHub Contents API (the JSON files act as the "database").

## Page naming

`box-league.html` is the **FMST Singles League**. The file and route keep the old `box-league` name, only the product was renamed.

`signup.html` is the session sign-up page. It does **not** use the GitHub-as-a-database pattern the other pages use. See "Session sign-up" below before changing it.

## Data flow

Each data-backed page follows the same pattern: `<script>` in the HTML calls `fetch('/api/<name>')` on load to GET the current JSON, renders it, and POSTs updates back through the same endpoint. There is no database — `api/*.js` functions read and write the corresponding root-level JSON file (`noticeboard.json`, `boxleague.json`, `pairings.json`) in this repo using the GitHub Contents API, so every save creates a commit to this repo.

Each `api/*.js` handler requires `GIT_TOKEN` as a Vercel environment variable (a GitHub token with contents write access to this repo) — there is no local `.env` file, so these functions only work when deployed on Vercel, not run locally as plain Node.

Write operations (POST) are gated by a shared admin password checked server-side inside each handler; GET requests are unauthenticated and public. `boxleague.js` additionally accepts an unauthenticated `submit_score` request type for players to record match results without the admin password.

The admin password comes from the `ADMIN_PASSWORD` environment variable, not a literal in the source. It used to be hardcoded, and because this repo is public it was readable by anyone; that value is burned and must never be reused. Each handler returns a 500 if the variable is missing rather than falling through to an unauthenticated write.

**Important operational caveat:** the live noticeboard, league and pairings backends each commit to `main` whenever someone uses the site, so `origin/main` frequently moves under you. Always `git pull --rebase origin main` before pushing (a plain push will often be rejected as non-fast-forward). These auto-commits only touch the JSON data files, so they rebase cleanly against code/markup changes.

### League scoring (domain logic in `api/boxleague.js`)

`recalculateBox()` is the single source of truth for standings, re-run server-side after every change. Points: **3** for a win (walkovers included), **1** for playing and losing, **0** for a no-show. Matches store `winner` and an optional `noShow` (there is no game-score field — scores were removed). Players self-report results including walkovers; only roster edits and match deletion require the admin password. Leagues hold any number of players (blank admin rows are dropped).

## Session sign-up (`signup.html`, `api/signup.js`)

**This is the one feature that does not store its live state in the repo, and the exception is deliberate.** Sign-up opens at a set time the night before and everyone taps at once. The GitHub Contents API accepts one PUT per file version, so thirty simultaneous writers means one winner and twenty-nine conflicts, then twenty-eight, and so on: roughly 450 write attempts to seat thirty people, plus GitHub's secondary rate limits and a Vercel redeploy per commit. Do not "simplify" this back onto a JSON file in the repo.

- **Live state: Upstash Redis**, via the Vercel marketplace integration. `api/_lib/redis.js` is a thin REST client and reads `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or the `UPSTASH_REDIS_REST_*` spelling).
- **History: the repo.** `api/_lib/archive.js` writes the finished list to `signups/<date>.json` once, when the session is reset. One commit per session, not one per tap.

The queue is a single Redis list and **its order is the queue**: positions 1-16 are main players (4 courts of 4), 17-18 are subs, 19-28 are the waiting list. Removing anyone shifts everyone below up one, which is exactly the club's promotion rule (next in line becomes a sub, sub 1 becomes main 16) with no separate promotion code.

`JOIN_SCRIPT` in `api/_lib/redis.js` is Lua and runs inside Redis. Joining checks the token, checks capacity, and resolves a display-name clash in **one atomic step**. Splitting any of that into separate commands reintroduces the race.

Names are published as first name plus an initial ("John Smith" becomes "John S."). A clash becomes "John S.2". This is not cosmetic: the pairings tool matches players by name string, so two identical names would be renamed and swapped as one person.

Cancel tokens are never returned by the API. They are the only thing stopping a stranger cancelling someone else's place, and the endpoint is public. The caller sends its own token and gets a `mine` flag back.

The server decides whether sign-up is open, by comparing its own clock to `opensAt`. Never gate the button on the browser clock.

## Editing data-backed pages

When changing the shape of data used by a page (e.g. adding a field to a box-league player), update three places together: the inline `<script>` in the HTML page, the corresponding `api/*.js` handler's read/write logic, and — if you want existing data to reflect it immediately rather than waiting for the next save — the root JSON file itself.

## Design system

The `design-system/` directory is the **Fletcher Moss Design System**, a self-contained brand kit and reference export. It is a *reference*, **not** wired into the live site: the production pages do not `<link>` its `styles.css` or import its `.jsx` components, and there is no build step that consumes them. Apply the system by hand-translating its tokens and rules into each page's inline `<style>`. Treat the `.jsx`/`ui_kits` files as design specimens, not shippable code.

Token source of truth is `design-system/tokens/*.css` (also flattened in `design-system/_ds_manifest.json`). Core values already reflected in the pages: park green `--green-800` `#2d5016` (brand/header) and `--green-600` `#4a7c2c` (primary action); `Lora` for all headings, `Plus Jakarta Sans` for body/UI; warm ink/paper neutrals rather than pure black/white/grey.

Key principles of the "premium refresh" when restyling (full rationale in [design-system/readme.md](design-system/readme.md)):

- **No emoji.** The original pages used emoji as ad-hoc icons/section markers (📋🎾✅❌ etc.); the refresh removes them. Use plain type or hand-inlined Lucide-style SVG line icons (the production pages inline the SVG paths directly rather than loading the Lucide runtime). Don't reintroduce emoji into markup or alert copy.
- **Tonal gradients, not hard edges.** Full-bleed section bands transition within one hue family (`--gradient-*` tokens); the page background ramps pale-green to paper to white down the scroll.
- **Shadow-only cards** (no coloured accent borders), soft warm two-layer shadows (`--shadow-*`), 12–18px radii; pills reserved for status chips and the circular logo.
- The club **badge** (`fletcher-moss-logo.png`) is the one mark that stays photographic — never redraw or iconify it.

All three production pages have been converted to the system (tokens copied into each page's inline `:root`). Keep them in sync when a shared token or the header/footer changes.

**Copy style:** plain and human. No em dashes as parenthetical breaks (write two sentences instead); write time ranges as "6:00 to 8:00 PM". Reuse the club's existing phrasing rather than inventing marketing lines.

**Homepage feature bands:** full-bleed photographic `.feature-band` sections punctuate the content (kicker + serif headline over a scrimmed photo). Full-bleed is done inside the single `.page-wrap` container with `width:100vw; margin-left:calc(50% - 50vw)` (`body` has `overflow-x:hidden`). Keep band backgrounds static — do **not** use scroll parallax on them (an earlier parallax attempt caused a white-bar bug). Only four real club photos exist, so imagery is scarce; reuse thoughtfully.

## No build/test/lint tooling

Verify changes by running a static file server from the repo root and checking behaviour in a browser:

```
python3 -m http.server 8000
```

(`.claude/launch.json` already defines this as the `static-site` preview server on port 8000.) Note that `api/*.js` functions do **not** run under a plain static server — they need `GIT_TOKEN` and only work deployed on Vercel. To exercise data-backed pages locally, mock `fetch('/api/...')` in the browser console against the root JSON file. Vercel deploys `api/*.js` automatically as serverless functions on push; there's no separate deploy command.

## SEO/sitemap

`sitemap.xml` lists the three public pages. When adding a new page, add it here too. `google705e088e9a41894e.html` is a Google Search Console site-verification file — leave it as-is, it is not a real page.

## Skills

Project-specific Claude Code skills live under `.claude/skills/<name>/SKILL.md` and are indexed in [SKILLS.md](SKILLS.md). Check there before creating a new skill, and add a row when adding one.

`fletcher-moss-design` generates on-brand interfaces and prototypes from the design system. The loadable skill is [.claude/skills/fletcher-moss-design/SKILL.md](.claude/skills/fletcher-moss-design/SKILL.md), which points at the brand kit in `design-system/`. The original export also ships a `design-system/SKILL.md`, but Claude Code only scans `.claude/skills/`, so that copy never loads. Leave it as part of the untouched export and keep the `.claude/skills/` copy as the live one.
