# Site UI kit

Interactive recreation of the Fletcher Moss Social Tennis Club website's three real screens — Home, FMST Singles League, Pairings — restyled with this design system. Built from `first-project/index.html`, `box-league.html`, `pairings.html` (source codebase), not from screenshots.

Open `index.html`; the floating switcher (bottom-left) moves between screens, matching the source site's own top-nav links between the same three pages. Weather/standings/pairings data here are static demo values (the real site fetches live weather + reads/writes JSON via Vercel functions) — this kit is a visual/interaction recreation, not the production app.

Composed entirely from this system's `components/` (TopNav, Footer, Card/InfoCard/NoticeCard, Button, Badge, SectionHeading, Select, TextField, Icon) — no bespoke one-off styling beyond section layout.
