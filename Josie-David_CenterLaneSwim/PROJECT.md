# Center Lane Swim School — Swim lessons (MD), single-page marketing site

## What this is
Single-page marketing site for Center Lane Swim School (Josie & David), serving Edgewater / Calvert / St. Mary's / Severna Park, MD. One long scrolling home page with sections for the program, locations, levels, instructors, and lesson booking. Two versions of the same page exist — one for standalone hosting, one tuned for GoHighLevel direct embed.

## Architecture
Plain HTML + embedded CSS/JS, one file per version. Custom HWT Artz display font self-hosted in `fonts/`; Montserrat from Google Fonts for body. Hero photos load from GHL's `assets.cdn.filesafe.space` CDN.

Key files:
- `home.html` — canonical standalone version (3,823 lines). References `fonts/hwt-artz.otf` and local assets via relative paths.
- `home-direct.html` — GHL direct-paste version (3,868 lines). Same page but with absolute `https://demilio24.github.io/Websites/Josie-David_CenterLaneSwim/...` URLs for fonts/images, and a comment header explaining it's for paste-in.
- `fonts/hwt-artz.otf` — custom display font (used for h1/h2).
- `Photos/` — ~270+ raw client photo dump from CLSS_26 shoot (multi-GB, all original JPGs); has its own `.gitignore`.
- `Old/` — archived design assets (3-lane rope SVG/PNG tiles, old pool photo).
- `Level selector.pdf` — reference doc from client showing how their level system maps.
- `www.centerlaneswim.com_.png` — full-page screenshot of the client's old/original site for reference.
- `st marys pool (1).jpg` — current hero candidate.

## Conventions
- Design tokens: `--coral: #faa56b`, `--teal: #3ad8d4`, `--dark: #0f3634`. Both `--lime` and `--coral` actually resolve to the same orange (#faa56b) — a quirk left in the token set.
- Type: HWT Artz (display, h1/h2) + Arboria (body, currently commented out / falling back to Montserrat) + Montserrat (fallback / nav).
- Button system: `.btn-lime`, `.btn-coral`, `.btn-outline`, `.btn-white`, `.btn-nav-cta`.
- 1200px max-width container, 24px padding.
- Hosted on GitHub Pages, embedded in GHL via the standard iframe wrapper.

## Open threads
- Arboria @font-face block is commented out in `home.html` — body type currently falls back to Montserrat. Keep an eye on whether client wants Arboria self-hosted.
- `Photos/` is huge and unsorted — eventual cleanup / pick-and-upload pass likely needed.

## Changelog
## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.
