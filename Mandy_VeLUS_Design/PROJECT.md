# Mandy VeLUS Design — Luxury interior design studio site (VELUS Interiors)

## What this is
This folder holds the website for VELUS Interiors, Mandy Velus's luxury interior design studio (Chicago-based, editorial / restraint aesthetic). The site is a single-page, multi-"page" HTML experience (home, collections, about, services, contact) styled in a quiet, considered editorial voice. It has been iterated through five versions; `v5.html` is the canonical, currently-shipping file. Earlier versions (`v1`–`v4`) are kept as historical reference for layouts Mandy has rejected or evolved past. `thankyou.html` is the post-contact confirmation page. The site is published via GitHub Pages and embedded in GoHighLevel via the standard iframe wrapper.

## Architecture
- **Canonical file:** `v6.html` (single-page, in-page section routing via `[data-page]` + `.page.active`). Built 2026-05-23 by copying `v5.html` and applying Mandy's 2026-05-20 revision bullets directly to the primary site instead of using a separate landing page.
- **Google Ads destination:** `v6.html` (per Mandy's 2026-05-20 decision to point ads at the primary site, not a separate landing). `v1.html` and `v2.html` retained as historical reference only; ads no longer route to them.
- **Version history:** `v1.html` (deprecated early landing page / A/B control), `v2.html` (deprecated A/B variant from 2026-05-20), `v5.html` (last pre-revisions canonical, kept for diff/reference), `v6.html` (current canonical, applies Mandy's prominence + SEO + "what we do" + shortened-form revisions).
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

## Form submission contract (v1 + future split-test variants)
These pages are **Google Ads landing pages only** — every contact created from a form here must be attributable to that source.

- **GHL contact tags:** every upsert MUST include `'google-ads'` plus a per-variant tag (`'site-v1'`, `'site-v2'`, …). Tag array lives in the upsert payload, e.g. `tags: ['site-v1', 'google-ads']`.
- **Post-submit redirect:** on final-slide success, redirect to `https://velusinteriors.com/thank-you` via `window.location.href`. Do NOT show an inline thank-you note. The legacy inline "Thank you for sharing your project with us…" message has been removed from v1 and must not be reintroduced.
- **Error handling stays inline:** on upsert/update failure, keep the existing inline error note + mailto fallback (`mandy@velusinteriors.com`). Don't redirect on error.
- **GHL credentials (v1 + v2):** `LOCATION_ID = dYpRMKt41LMBrYEUoeLG`, PIT `pit-def64e41-d4d8-4838-b956-c7fd30031cd2`, API version `2021-07-28`. Both variants reuse the same location/token; differentiation is by tag only.

## Split-test variants (v1 vs v2)
Both files share identical typography, palette, sections, copy, and animation system. Only the conversion mechanics differ.

**v1 (control):** 3-slide hero inquiry form with 11 fields total (`firstName`, `email`, `phone`, `location`, `project_type`, `project_stage`, `design_intent`, `design_direction`, `lifestyle`, `prior_designer`, `estimated_budget` required on slide 3). Six section CTAs across the page all scroll back to the hero form. No mobile sticky CTA. No proof above the form. Tag: `['site-v1', 'google-ads']`.

**v2 (variant, built 2026-05-20):** 1-slide hero form with 4 fields (`firstName`, `email`, `project_type`, `design_intent`) — all required, no phone/location/budget. Editorial italic pull-quote (Nicole / Lincoln Park) sits above the form lede inside `.hero-form-card`, separated by a hairline rule. Reassurance microcopy "No obligation. We reply within two business days." sits under the submit. A duplicated slim form (same 4 fields, brand-styled for the taupe `.cta-section` background) replaces the final `Start Your Project` button. Hairline mobile sticky CTA `.v2-mobile-sticky` (Begin a Project →, hairline top border, safe-area-aware bottom padding) reveals on `max-width: 768px`. Page is `noindex,nofollow`. Tag: `['site-v2', 'google-ads']`. Submission handler `v2SubmitForm(form)` works for both `#v2InquiryForm` and `#v2CtaForm` and posts to the same GHL `/contacts/upsert` endpoint.

**Hypothesis being tested:** the leak is form length + form coldness, not the visual page. The 4-field form, the proof-above-form, the duplicated bottom form, and the always-reachable mobile CTA together should lift contact submissions without changing the dainty editorial brand.

## Open threads
- **A/B traffic routing not yet wired.** v2.html is built and live-ready but Google Ads still needs to be configured to split traffic 50/50 between v1.html and v2.html (or whatever ratio Mandy wants). Until then v2 sees zero traffic.
- **Microsoft Clarity data not yet reviewed.** v2's hypothesis was built on conversion-mechanics intuition, not behavioral data. Once both variants accumulate sessions, pull Clarity heatmaps for each and compare scroll depth, form-field abandonment, and rage clicks. Next iteration of v2 should be data-driven.
- **No analytics differentiation between v1 and v2.** The only thing distinguishing submissions is the GHL contact tag (`site-v1` vs `site-v2`). Confirm Mandy can pull a tag-segmented report in GHL to compare conversion rates, or wire a lightweight pageview ping (GA4 / Clarity custom event) so impressions are countable per variant — without impressions, conversion *rate* can't be computed, only raw counts.

## Changelog
## 2026-05-23 — v6.html: Mandy's 2026-05-20 revisions applied to the primary site
Copied `v5.html` → `v6.html` and applied Mandy's email-bulleted revisions directly to the canonical site (her stated preference was no separate landing page — ads point at the main site). Four surgical changes:

1. **More prominent Inquiry button.** New `.cta-primary` modifier — a hairline-bordered pill (1px ink border, 14×30px padding, 12×24px on mobile) with a `→` arrow that translates on hover. Hover state inverts (background `--ink`, text `--bg`). Applied to the two Inquiry CTAs (finalcta + services exit). The base `.cta` underline style is untouched everywhere else (Discover, View Collections), preserving editorial restraint elsewhere on the page. Button copy changed from "Inquiry" to "Begin an Inquiry" for clarity.
2. **Tighter SEO.** Title and OG/Twitter titles now lead with "Chicago" + service type. Description rewritten to include "new construction, renovation, and full home furnishing" + Mandy's name. Added `keywords`, `canonical`, `geo.region`/`geo.placename`, `og:url`, `og:locale` meta tags. Added a full `InteriorDesignFirm` JSON-LD block (founder, areaServed Chicago/Illinois, address, knowsAbout, sameAs Instagram, phone, email, logo).
3. **"What we do" line above the fold.** New `.what-we-do` editorial eyebrow inserted directly under the `VELUS Interiors` statement-section h1 — reads `LUXURY INTERIOR DESIGN · CHICAGO` at `--fs-cta`, .28em tracking, 72% opacity. Uses the existing 4-token typography system; no hardcoded sizes. Wraps to two centered lines on mobile, stays one line on desktop.
4. **Shortened questionnaire.** 11 fields → 7 fields, 3 slides → 2 slides. Slide 1 unchanged (firstName, email, phone, location). Slide 2 collapses old slides 2 + 3 into the three highest-signal qualifying questions: project_type, design_intent, estimated_budget. Dropped `project_stage`, `design_direction`, `lifestyle`, `prior_designer` (low-signal duplicates). `GHL_FIELD_MAP` and `SLIDE_KEYS` trimmed to match. Slide-1 CTA changed to "Continue"; slide-2 CTA stays "Submit". Slide progress reads `01 / 02`.

Form submissions tag contacts with `'site-v6'` instead of `'site-v5'` so Mandy can segment the new revision's leads in GHL. Reuses the same location ID + PIT as v1/v2/v5. Visual QA on desktop (1440) and mobile (390): statement, finalcta button (idle + hover), both form slides all render as intended.

## 2026-05-20 — v2 CTA-section form: card-styled, reassurance removed
Tightened the v2 CTA-section form per Mandy's feedback. (a) Removed the "We reply within two business days." microcopy under the submit button so the form is just the form. (b) Restyled the form so it unmistakably reads as a fillable form on the taupe `.cta-section` background: wrapped in a warm-off-white card (`background: var(--bg)`, hairline border, soft shadow, 28px padding), and replaced the editorial bottom-border-only inputs with white-filled boxed inputs (1px hairline border, 12×14px padding, non-italic placeholders, focus ring). The hero form remains untouched — its editorial bottom-border input style still belongs in the `.hero-form-card` context. Brand language preserved: same warm-off-white, same choc-tinted borders, hairline weight, no color buttons.

## 2026-05-20 — Built v2.html (A/B variant)
Created `v2.html` as the split-test variant against `v1.html`. Cloned from v1 to preserve every brand token (Canela display, Neue Haas body, warm off-white/ink/choc palette, hairline CTAs, editorial restraint), then made four surgical changes targeting conversion mechanics:
1. **Hero form: 3 slides → 1 slide, 11 fields → 4 fields.** Kept Name, Email, Project type, and a "Tell us about your project" textarea. Dropped Phone, Location, Project stage, Design direction, Lifestyle, Prior designer, and Budget. Submit copy is "Begin Your Project" with a centered reassurance line "No obligation. We reply within two business days." underneath.
2. **Editorial pull-quote above the form.** Nicole / Lincoln Park testimonial styled as an italic Canela pull-quote inside the same `.hero-form-card`, separated by a hairline rule. Gives a cold form a trust anchor before any field is touched.
3. **Slim form embedded in the final CTA section.** Replaced the lone "Start Your Project" gold button with the same 4-field form, styled for the taupe `.cta-section` background (choc-tinted borders/placeholders). Users who scroll to the bottom can convert without travelling back to the hero.
4. **Mobile sticky CTA.** Hairline `.v2-mobile-sticky` link bar at viewport-bottom on `max-width: 768px`, with `safe-area-inset-bottom` padding and a 56px body padding-bottom reservation so it never overlaps content. Says "Begin a Project →" in the same letter-spaced caps as every other CTA.

Submission JS rewritten as `v2SubmitForm(form)` — a single upsert (no multi-slide state), tags `['site-v2', 'google-ads']`, redirects to `https://velusinteriors.com/thank-you` on success, inline error + mailto fallback on failure. Same GHL location/PIT as v1. Page is `noindex,nofollow` since it's paid-traffic only. Visual QA passed on desktop (1440) and mobile (390) — pull-quote, CTA-section form, and mobile sticky all render as intended.

## 2026-05-20 — Google Ads form contract + v2 split-test plan
v1.html form now (a) tags every GHL contact with both `site-v1` and `google-ads`, and (b) redirects to `https://velusinteriors.com/thank-you` on final-slide success instead of showing the inline thank-you note. These pages are Google Ads landing pages only, so the tag is unconditional. Documented the contract under a new "Form submission contract" section. Added v2 split-test plan (4-field form, hero pull-quote, duplicate form in final CTA, mobile sticky CTA, brand unchanged) to Open threads — not yet built.

## 2026-05-20 — Deleted v2/v3/v4 historical drafts
Removed `v2.html`, `v3.html`, `v4.html` at user request. v1.html kept as the only pre-v5 reference; v5.html remains canonical. Updated Architecture/Version history to reflect the trimmed set.

## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state. v5.html confirmed as canonical (last touched 2026-05-17). Captured token system, collections viewer pattern, and the seven non-negotiable conventions accumulated through Mandy revision feedback.
