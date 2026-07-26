# Fletcher Moss Design System

A premium refresh of the visual language for **Fletcher Moss Social Tennis Club** (FMST) — a free, volunteer-run community tennis group playing at Fletcher Moss Park, Didsbury, Manchester, in partnership with **McrActive**. This system exists to make the club's existing site (and any future surfaces) feel more considered and premium, while keeping the club's actual colours, structure and copy intact.

**Mission for this refresh** (from the brief): keep the palette recognisable, introduce subtler tonal/gradient transitions between page sections, keep wording and content as-is but let Claude apply it more creatively, and remove emoji — the current site leans on them for section markers and buttons, which reads as generic "AI slop" rather than considered design.

## Source material

- Attached local codebase: `first-project/` (mounted, read-only) — a static, no-build, no-framework website: three self-contained HTML pages (`index.html`, `box-league.html`, `pairings.html`) each with inline `<style>`/`<script>`, plus Vercel serverless functions in `api/` backing a noticeboard, a box league, and a court-pairing generator.
- No Figma file or separate native mobile app was attached — the club has **one product**: a responsive website used on both phones (most traffic, per `NEXT-STEPS.md`) and desktop. This design system treats "mobile" and "web app" as the same product's two breakpoints, not separate products.
- Real assets pulled from that codebase: the club badge (`fletcher-moss-logo.png`), the McrActive partner logo, and three photographs (drone aerial of the courts, a night match shot, an autumn park path). All copied into `assets/`.
- `first-project/CLAUDE.md`, `NEXT-STEPS.md` — engineering + product context (British English throughout; current priority is growing membership via WhatsApp sign-ups).

There is no Figma or GitHub link in scope for this project — if one exists, attach it via the Import menu so this system can be cross-checked against it.

## The product

**Fletcher Moss Social Tennis Club — club website**, three surfaces:
1. **Home** (`index.html`) — hero, about/values, session times, community noticeboard, live weather check, how-it-works, WhatsApp join CTA, location/map.
2. **FMST Singles League** (`box-league.html`) — box-league standings tables, match-result submission, admin player/score management.
3. **Pairings** (`pairings.html`) — a session-night tool: paste or type a player list, generate randomised court pairings/sitting-out rotations, drag-and-drop to adjust, tally games played.

Content is served by three Vercel functions reading/writing JSON files in the repo as a lightweight "database" — no user accounts; a single shared admin password gates edits.

## What's in this system

- `tokens/` — colour, type, spacing and effects (shadow/radius/gradient/motion) custom properties, imported by root `styles.css`.
- `assets/` — real club + partner logos and photography copied from the source codebase.
- `guidelines/` — specimen cards for the Design System tab (colour, type, spacing, gradient, brand).
- `components/core/` — Button, Card family, Badge/Pill, SectionHeading, Icon.
- `components/navigation/` — TopNav (with mobile menu), Footer.
- `components/forms/` — TextField, Select, PasswordField.
- `components/feedback/` — Banner (notices/alerts), StatusPill.
- `ui_kits/site/` — an interactive click-through recreation of the three real screens, restyled with the system, at both mobile and desktop widths.
- `templates/` — starter scaffolds for new pages built on this system.

See each directory's own README/prompt files for details; the Design System tab in this project surfaces every card.

## Content fundamentals

**Voice:** first-person-plural, matter-of-fact community volunteer, not a corporate club. The existing copy already does this well — e.g. "Community-run tennis organised by volunteers who give their time freely" and "An inclusive, friendly environment where fun and social connection are at the heart of every session." Keep sentences short and concrete; state logistics plainly (times, cost, postcode) rather than "marketing" them.

**Person & address:** mostly "we" for the club, direct "you" for the reader/prospective member — e.g. "Just turn up, introduce yourself." Never third-person distancing ("members can...").

**Spelling:** British English throughout — *organised*, *favourite*, *metre* — per the source `CLAUDE.md` instruction. Keep this.

**Tone markers to keep:** reassuring and low-pressure ("no membership fees or contracts", "play at your own risk" stated plainly, not legalistically), understated pride in the location ("beautiful outdoor courts"), practical logistics given without ceremony (score formats, kit needed).

**What to change:** the current site uses emoji as de-facto icons and exclamation-heavy CTA copy (❌/✅ in alerts, 🎾 in body copy, "Free Social Tennis in Didsbury!"). Drop emoji entirely — replace with the Icon set (see Iconography) or plain type. Let punctuation and hierarchy (not exclamation marks or emoji) carry emphasis. Headlines can be more textured/editorial (e.g. treat "Didsbury Social Tennis" as a small kicker line under the wordmark, rather than repeating "Free Social Tennis" as an exclaimed headline) as long as the underlying facts and wording options aren't invented — reuse the club's existing phrases, just choose and arrange them with more restraint.

**Numbers/logistics stay literal:** session days/times, £ contribution, box-league scoring (3/1/0), postcode — always exact, never rounded or vague.

## Visual foundations

**Palette:** deep park green is the brand anchor (`--green-800` / `#2d5016` on the real badge and header), with a mid action green (`--green-600`) for primary buttons/links. The refresh adds a fuller tonal ramp (`--green-950`…`--green-50`) so sections can shift shade gradually instead of hard-cutting between a white card and a flat green block. Warm neutrals (`--ink-*`, `--paper-*`) replace pure black/white/grey for a warmer, less "web-template" feel. Secondary accent families are inherited as-is: brown/gold for the noticeboard (cork-board conceit), sky blue for the weather widget, a muted terracotta for alerts (softened from the original saturated red), and a muted teal for WhatsApp (softened from the neon brand green so it sits inside the palette).

**Type:** `Lora` (serif) for all headings/display — this is what gives the club warmth and a "park noticeboard" feel rather than a generic SaaS look; `Plus Jakarta Sans` for body/UI text. Both already used in the source; kept exactly. Headings set a touch larger and looser than the source for premium presence; body stays at comfortable reading size (17px base) with generous line-height (1.65).

**Backgrounds:** the source uses flat, saturated section backgrounds (solid pale-green body background, solid brown noticeboard, solid blue weather block) with hard edges between them. The premium refresh's central move is **replacing hard section boundaries with directional gradients** — every full-bleed band (hero scrim, green CTA band, gold noticeboard, sky weather panel) is a tonal gradient in its own hue family, and the page background itself ramps from pale green to warm paper to white down the scroll (`--gradient-page`) so the white content card never sits on a flat, unrelated backdrop. Photography is full-bleed only in the hero and one mid-page "moment" band (never tiled/patterned); no hand-drawn illustration exists in the source, so none is invented.

**Cards:** white or near-white surface, no border in the premium system (the source mixes 2px borders and shadow-only cards — standardise on shadow-only), soft two-layer shadow (`--shadow-sm`/`--shadow-md`, warm-tinted rather than pure black), 12–18px radius depending on size. Hover raises a card slightly (`translateY(-3px)`) with the shadow deepening, not lightening.

**Buttons:** solid fill in green for primary, deep-green outline for secondary/"home" nav-style actions, softened-teal fill for the WhatsApp CTA. Radius 8–10px (never pill-shaped for rectangular buttons; pills are reserved for status/weather chips). Hover deepens the fill by one step and lifts 2–3px; press flattens the lift and settles the shadow — no scale/bounce.

**Borders:** used sparingly and only at `--border-subtle`/`--border-strong` (low-contrast warm grey), mainly for input fields and table rules — never as a coloured accent stripe on cards.

**Shadows:** one consistent soft, warm, two-layer elevation scale (`--shadow-xs` → `--shadow-lg`); the source's heavy near-black shadows on the sticky header (`0 6px 20px rgba(0,0,0,.35)`) are toned down to keep the whole system feeling light rather than "boxed."

**Radii:** consistently soft — 8px small controls, 12–18px cards, pill (999px) for status chips and the circular logo mark. Nothing sharp-cornered.

**Gradients:** the signature device of this refresh. Vertical, low-contrast, tonal-within-hue (green→deeper green, gold→pale gold, sky→deep sky) — never a rainbow/brand-mismatched gradient, never used on text.

**Motion:** gentle fades/slides on scroll-into-view (kept from source, timing smoothed to `--duration-slow`/`--ease-standard`), smooth-scroll for in-page nav, a slow parallax on the mid-page photo band. No bounce, no spin easing except the existing loading spinner (kept, softened colour).

**Transparency & blur:** frosted/blurred glass (`backdrop-filter: blur(--blur-glass)`) reserved for panels sitting on top of photography (weather chips over the hero, the pairings/league container over the drone-shot background) — never on flat-colour backgrounds where it adds no value.

**Imagery:** real photography only — a drone aerial of the courts (green/gold, autumn litter, warm evening light), a night match under floodlights, and an autumn park path. Warm, natural, slightly moody (evening/autumn light) — not staged or heavily saturated. No stock "generic tennis" photography was introduced.

**Corner cases kept as-is:** the box-league admin panel, table layouts, and form structure are functional/utility UI — restyled with the same tokens but not visually reinvented (the brief asks to keep all functions).

## Iconography

The source codebase has **no icon font or SVG icon set** — it uses emoji (📋🌤️📱🎾💰🤝🌳) as ad-hoc icons throughout, plus one hand-coded inline WhatsApp glyph SVG. Per the brief, emoji are being removed.

**Substitution:** this system adopts **[Lucide](https://lucide.dev)** (MIT-licensed, CDN-available, thin 1.5–2px stroke — a close match to the racket/leaf linework in the club badge) as the icon set, loaded from `unpkg` at runtime (`https://unpkg.com/lucide@latest/dist/umd/lucide.js`). This is a flagged substitution, not something found in the source — **flag to the user**: if the club has a preferred icon style, or wants iconography hand-drawn to match the badge's tree/racket linework, let us know and we'll swap it.
The `Icon` component (`components/core/icon/`) wraps Lucide's `data-lucide` attribute + `lucide.createIcons()` — see its prompt file for the exact glyph names in use (calendar, users, map-pin, message-circle, trophy, cloud-sun, shuffle, shield, x, plus, chevron-right, megaphone).
The one real brand asset that must stay hand-drawn/photographic rather than iconified is the **club badge** itself (trees + racket + "FM" monogram) — never redrawn, only ever used as the supplied PNG.

## Intentional additions

Components with no direct counterpart in the source (which has no component library, only page-level HTML/CSS) were added because the source's structure clearly implies them:
- **Icon** — wraps the Lucide substitution described above.
- **Button** — the source repeats `.btn`/`.btn-secondary`/hero-button/WhatsApp-button patterns inline on every page; consolidated into one component with variants.
- **Badge/StatusPill** — generalises the source's weather pill, sitting-out pill, and box-league tally chip into one small-status primitive.
- **SectionHeading** — generalises the repeated `<h2>` + optional kicker pattern used to open every section.

## Fonts

`Lora` and `Plus Jakarta Sans` are loaded from Google Fonts (`tokens/fonts.css`), exactly as the source site already does — no substitution needed, both are freely available, no local font files to vendor.

## Index

```
styles.css                     → root stylesheet (import-only)
tokens/colors.css               → colour custom properties
tokens/typography.css           → type scale, weights, tracking
tokens/spacing.css              → spacing + container widths
tokens/effects.css               → radius, shadow, gradient, motion tokens
tokens/fonts.css                 → @font-face / Google Fonts import
assets/logo/                     → club badge, McrActive logo, favicon
assets/imagery/                  → drone aerial, night match, autumn path photography
guidelines/                      → colour/type/spacing/gradient/brand specimen cards
components/core/button/          → Button
components/core/card/            → Card, InfoCard, NoticeCard
components/core/badge/           → Badge / StatusPill
components/core/section-heading/ → SectionHeading
components/core/icon/            → Icon (Lucide wrapper)
components/navigation/topnav/    → TopNav (desktop + mobile menu)
components/navigation/footer/    → Footer
components/forms/text-field/     → TextField
components/forms/select/         → Select
components/feedback/banner/      → Banner (notice/alert)
ui_kits/site/                    → interactive Home / League / Pairings recreation
templates/                       → starter page scaffolds
SKILL.md                         → Claude Code–compatible skill for this brand
```

## Caveats & open questions

- No Figma file or native mobile app codebase was provided — if either exists, please attach it so components/screens here can be checked against the real source rather than the responsive website alone.
- No icon set exists in the source; Lucide is a flagged substitution (see Iconography) — confirm or provide a preferred set.
- The muted terracotta alert colour and softened WhatsApp teal are deliberate tone-downs of the source's saturated red/neon-green for the "premium" brief; if the club wants the original saturated alert red and WhatsApp brand green kept exactly, say so and we'll revert those two tokens.
