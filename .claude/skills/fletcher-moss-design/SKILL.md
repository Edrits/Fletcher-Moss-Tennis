---
name: fletcher-moss-design
description: Use this skill to generate well-branded interfaces and assets for Fletcher Moss Social Tennis Club (FMST), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colours, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

The brand kit itself lives in `design-system/` at the repo root. Start by reading
`design-system/readme.md`, then explore the other files there:

- `design-system/tokens/*.css` — token source of truth (also flattened in `_ds_manifest.json`)
- `design-system/guidelines/` — brand, type and colour guideline cards
- `design-system/components/` — React component specimens (reference only, not shippable)
- `design-system/ui_kits/site/` — interactive recreation of the three real screens
- `design-system/assets/` — logo and imagery

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and
create static HTML files for the user to view. If working on production code, read the
rules here and hand-translate the tokens into the target page's inline `<style>`. The
production pages do not link `design-system/styles.css` or import its `.jsx` files.

If the user invokes this skill without any other guidance, ask them what they want to
build or design, ask some questions, and act as an expert designer who outputs HTML
artifacts or production code, depending on the need.
