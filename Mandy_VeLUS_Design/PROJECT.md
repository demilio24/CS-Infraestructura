# Mandy VeLUS Design — Luxury interior design studio site (VELUS Interiors)

## What this is
This folder holds the website for VELUS Interiors, Mandy Velus's luxury interior design studio (Chicago-based, editorial / restraint aesthetic). The site is a single-page, multi-"page" HTML experience (home, collections, about, services, contact) styled in a quiet, considered editorial voice. It has been iterated through five versions; `v5.html` is the canonical, currently-shipping file. Earlier versions (`v1`–`v4`) are kept as historical reference for layouts Mandy has rejected or evolved past. `thankyou.html` is the post-contact confirmation page. The site is published via GitHub Pages and embedded in GoHighLevel via the standard iframe wrapper.

## Architecture
- **Canonical file:** `v5.html` (single-page, in-page section routing via `[data-page]` + `.page.active`)
- **Version history:** `v1.html` (early multi-section), `v2.html`, `v3.html`, `v4.html` (statement-led), `v5.html` (current — page-router pattern with Collections viewer)
- **Other pages:** `thankyou.html` (post-form confirmation)
- **Assets:**
  - `Fonts/` — Canela family (serif display) + Neue Haas Grotesk family (body/UI), self-hosted `.otf` trials, plus Google `Inter` + `Playfair Display` fallbacks
  - `Logo/` — Velus wordmark + monogram, PDF/PNG/SVG/EPS/AI variants (black, white, on-bg)
  - `collectionsphotos/` — project photography for the Collections grid + lightbox viewer (badger, cooper, valmont, IMG_xxxx)
  - `comparisons/` — dated reference screenshots from Mandy's revision emails (one folder per revision feedback), source of truth when working a specific change
  - `miscellaneous/` — extra source media (HeroVideo.mov, HomeImage1/2 crops, New Images, uploads)
  - `badger.jpeg` — top-level hero/preview asset
- **Tech stack:** Vanilla HTML + embedded `<style>` and `<script>` (no build step). Self-hosted fonts. Hosted on GitHub Pages, embedded inside GHL via the iframe wrapper from project CLAUDE.md.
- **Typography token system (the only sizes allowed for text):**
  - `--fs-h1` (page titles): 30px mobile / 34px desktop
  - `--fs-h2` (section titles, project step titles, dropdown titles): 27px mobile / 31px desktop
  - `--fs-p` (body, quotes, info): 16px both
  - `--fs-cta` (buttons, eyebrows, labels, footer, copyright, small caps): 13px both
- **Spacing tokens:** `--sp-xs` / `--sp-sm` / `--sp-md` / `--sp-lg` (mobile defaults, desktop overrides at `min-width:769px`). Section-to-section gap is naturally `--sp-md * 2`.
- **Color tokens:** `--bg #F6F3EF`, `--ink #1A1A1A`, `--choc #4a2f24`, `--editorial #D1C7BC`.
- **Collections viewer pattern:** Grid cards display project name + location ONLY (no per-card numerals, no per-card counter). The lightbox viewer has its own `#vCount` counter element (56px desktop / 32px mobile) that shows "Image N of M". `.coll-num` / `.coll-count` on grid cards have been removed and must not be reintroduced.
- **Scroll-reveal pattern:** `.fu` class is toggled with `.in` by an IntersectionObserver. Defaults set so layout never wobbles even if the observer is slow (see `.fu phantom gaps` note in Conventions).

## Conventions
Non-negotiable rules, established through repeat feedback. Read before editing.

- **Screenshot is the spec.** Mandy's revision emails attach both a screenshot and a Gemini-generated CSS block. The screenshot is ground truth; the Gemini code is a context-blind hint and often contradicts its own picture. Always screenshot the page after a change and visually compare to her screenshot at the same viewport before claiming done.
- **Only 4 typography tokens.** Every `font-size:` on a text element MUST be `var(--fs-h1)`, `var(--fs-h2)`, `var(--fs-p)`, or `var(--fs-cta)`. Never hardcode a new px value. If something needs to look smaller than `--fs-cta`, keep the token and reduce visual weight via `opacity` or `color`. (UI glyphs like nav-trigger icon, scroll indicator, viewer close button are exempt — they are not text content.)
- **Mobile vs desktop scope.** Mandy's mobile screenshots = mobile-only changes (edit inside `@media(max-width:768px)`). Desktop stays untouched unless she explicitly mentions desktop or it's a global brand decision (color, font family, logo).
- **One sentence per line on desktop.** Each sentence is its own `<p>`. On desktop the container uses the full-viewport breakout (`width:100vw; margin:0 calc(50% - 50vw)`) with `white-space:nowrap` so each sentence renders as one unbroken horizontal line. Mobile overrides reset to a normal narrow column with `white-space:normal`. Never mash two sentences into one `<p>` because they "feel related". Exception: testimonial quotes and About bio paragraphs wrap naturally on both viewports.
- **Collections grid stays clean.** No `.coll-num` numerals, no `.coll-count` "Image N of M" on grid cards. The `#vCount` counter exists ONLY inside the lightbox viewer. If Mandy says "counter on collections", she means the viewer — confirm if ambiguous.
- **No em-dashes.** Never `—` or `&mdash;` in any copy, heading, CTA, or FAQ. Substitute with colon, comma, period, or parentheses. En-dashes (`–` / `&ndash;`) for ranges are fine.
- **No `text-align:justify` on body copy.** Always left-align paragraphs and descriptions. Justified text creates word-spacing rivers on narrow viewports.
- **`.fu` phantom layout gaps.** When spacing looks asymmetric but measurements say equal, suspect a `.fu` element sitting at `opacity:0` while still consuming layout space. Universal fix: keep `.fu { opacity:1 }` as the default so layout is stable regardless of observer timing (`.in` becomes a no-op).
- **GHL embed:** When returning a public link, always wrap the GitHub Pages URL in the iframe embed template from the project CLAUDE.md — never a bare URL.

## Open threads
(none — v5 is current; no TODO/FIXME markers in v5.html)

## Changelog
## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state. v5.html confirmed as canonical (last touched 2026-05-17). Captured token system, collections viewer pattern, and the seven non-negotiable conventions accumulated through Mandy revision feedback.
