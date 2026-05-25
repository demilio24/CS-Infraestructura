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

## Form submission contract
GHL credentials are shared across every version of the site: `LOCATION_ID = dYpRMKt41LMBrYEUoeLG`, PIT `pit-def64e41-d4d8-4838-b956-c7fd30031cd2`, API version `2021-07-28`. Per-version differentiation is by GHL contact tag only.

**Per-version tags:**
- `v6.html` (current canonical, primary site + Google Ads destination): `tags: ['site-v6']`. Inline confirmation on success (the editorial "Thank you for sharing your project with us…" message renders inside `#sentNote`); inline error + `mandy@velusinteriors.com` mailto fallback on failure. No redirect — this is the brand site, not a paid landing page.
- `v1.html` / `v2.html` (deprecated landing pages, kept for reference only): `tags: ['site-v1', 'google-ads']` / `['site-v2', 'google-ads']`. These pages redirected to `https://velusinteriors.com/thank-you` on success. No longer receive ad traffic as of 2026-05-23.

If a new variant of v6 is ever built (e.g. for a focused A/B test on a single CTA), inherit the v6 inline-confirm pattern and assign it a fresh `site-vN` tag so GHL segmentation stays clean.

## Deprecated landing pages (v1, v2)
Kept for historical reference only. Both are `noindex,nofollow`, both deprecated as of 2026-05-23 when Mandy chose to point Google Ads at the primary site (`v6.html`) instead of a separate landing page.

**v1 (deprecated):** 3-slide hero inquiry form with 11 fields total. Six section CTAs scroll back to the hero form. No mobile sticky CTA, no proof above the form. Redirected to `velusinteriors.com/thank-you` on success.

**v2 (deprecated, built 2026-05-20):** 1-slide hero form with 4 fields (`firstName`, `email`, `project_type`, `design_intent`). Editorial italic pull-quote (Nicole / Lincoln Park) above the form lede. Duplicated slim form replaces the final `Start Your Project` button. Hairline mobile sticky CTA `.v2-mobile-sticky` on `max-width: 768px`. Submission handler `v2SubmitForm(form)` posted to GHL `/contacts/upsert` and redirected to thank-you.

**Why deprecated:** Mandy reviewed both versions and concluded that a separate landing page broke the cohesive luxury brand experience she wanted from the first click. Her exact phrasing: "the original website better reflects the level of brand identity, emotional tone, and luxury positioning I want potential clients to experience from the very first interaction." The conversion-mechanics hypothesis behind v2 (form length is the leak) was never actually tested because no ad traffic was routed there before the decision.

## Open threads
- **Awaiting Mandy's sign-off to launch v6.** Draft email sent 2026-05-23 (Gmail draft, threaded under "Re: Google Ads Campaign Update") with the v6 link and two literal yes/no questions: launch v6 as the Google Ads destination? anything to adjust before routing traffic? Once she replies "yes", switch the live Google Ads campaigns to point at `https://velusinteriors.com/` (or whatever final URL she lands on) instead of `Mandy_VeLUS_Design/v1.html`.
- **Mandy bullet 4 — Google ad targeting refinement.** Not a site change; lives in the Google Ads UI. When v6 routing goes live, tighten: negative keywords for low-intent and DIY queries, geo-radius around Chicago + North Shore, household-income layering toward HHI ≥ $250k, ad-schedule weighting on weekday business hours. Measure combined effect after the destination switch.
- **Microsoft Clarity / GA4 segmentation per future variant.** Today the only thing distinguishing v6 submissions from a future variant is the GHL contact tag (`site-v6`). If Mandy ever wants a real A/B test on the primary site (e.g. v6 vs v6b with an even more compact form), wire a Clarity custom event or GA4 pageview ping per variant first — without per-variant impressions, conversion *rate* can't be computed, only raw counts.
- **v1.html / v2.html cleanup decision.** Both deprecated but kept on disk for reference. If Mandy never wants to revisit the landing-page concept, we can delete them in a future commit; if she wants them archived as historical references, leave them. Default: leave until she explicitly says otherwise (matches the conservative posture used when v2/v3/v4 drafts were deleted on 2026-05-20 — only delete on explicit user request).

## Changelog
## 2026-05-23 — Docs refresh: v6 is canonical, v1/v2 marked deprecated
Updated PROJECT.md to reflect the post-v6 state of the project. The "Form submission contract" section was rewritten as a single per-version tag table; the "Split-test variants (v1 vs v2)" section was renamed to "Deprecated landing pages (v1, v2)" with Mandy's exact rationale quoted from her 2026-05-20 email; "Open threads" now tracks the launch-sign-off ask, Mandy's ad-targeting bullet, future-variant analytics wiring, and the cleanup-vs-keep decision on the deprecated landing files. Memory `feedback_typography_tokens_only.md` updated to reference v6.html as the canonical file (was v5). No code changes.

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
