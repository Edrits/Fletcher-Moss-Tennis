# Next steps for the site

Agreed 16 July 2026. Goal: **grow membership**. Audience: **prospective members** who've never heard of the club. Conversion = **joining the WhatsApp group**.

Expected channels: Google search, word of mouth + QR posters, park footfall (mobile-first matters).

## 1. Analytics (do first — establishes the baseline)

- Enable **Vercel Web Analytics** in the Vercel dashboard (free tier, cookieless, no consent banner needed).
- Add the analytics script tag to all public pages (`index.html`, `box-league.html`, `pairings.html`, and the new page below).
- Add a **custom event on WhatsApp link clicks** (the floating widget and any inline join links) so conversions are countable, not just page views.

## 2. New page: first session + FAQ combined

- Single new self-contained HTML page following the existing pattern (inline `<style>`/`<script>`, shared nav/footer, favicon set).
- Structure: **"Your first session"** story up top (do I need to be good? what do I bring? is it really free? just turn up), then a **general FAQ accordion** below (weather policy, ball contributions, box league, finding the courts).
- Targets beginner-intent searches ("free tennis didsbury", "social tennis manchester beginners") while also serving members.
- Add to: `sitemap.xml`, desktop nav + mobile dropdown on all three existing pages, canonical/meta tags, structured data (FAQPage schema).
- Clear WhatsApp join CTA on the page — it's a conversion surface, not just content.

## Parked (deliberately not now)

- **Google Business Profile** — likely the highest-leverage growth action overall, but off-site; revisit later.
- Social media presence, contact-details sign-up form, member-facing feature work, several separate topic pages.

## How we'll judge it

WhatsApp click events and referrer data from analytics, compared against the pre-page baseline (hence analytics ships first).
