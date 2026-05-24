# Nils Digital organic-traffic website, design spec

**Date:** 2026-05-24
**Status:** Approved, ready for plan
**Implementation folder:** `Nils/website/`
**Spec author:** Brainstorming session with Emilio

## What this is

A new public-facing website for Nils Digital, hosted on GitHub Pages, designed to capture **organic search traffic** and route it to the two existing VSL funnels (Marketing + Automation). The site is the **SEO front door** and trust layer for the agency. It is not a sales funnel itself, and it is not the target for paid-ad traffic (ads continue to bypass this site and go directly to the VSLs).

The site is also the home for the blog (auto-published via BabyLoveGrowth) and for the about/proof content that warms cold visitors before they decide to click into a VSL.

## Why this exists

Nils Digital currently has two highly-converting VSL funnels:
1. **Marketing VSL** (`Nils/funnel/vsl.html`) — websites + Google Ads + review automation
2. **Automation VSL** (`Nils/funnel/automation-vsl-funnel-direct.html`) — AI/automation audit + blueprint

Both are paid-traffic destinations. There is currently no organic-search front door for the agency, no central "this is who we are" page, and no place for SEO content to live. The new website fills those gaps without forking the existing sales story (the VSLs remain the conversion engines).

## Buyer (single avatar for both offers)

**Owners of $1M+ local service businesses.** They feel both pains (need more leads AND drowning in manual work), so they are treated as one persona with two doors, not two separate personas.

## Architecture

### Site structure (5 pages)

```
nilsdigital.com/
├── /                  Home (router + story + brand)
├── /about             Operator story + team + how we work
├── /proof             Case studies + testimonials for both offers
├── /blog              SEO content feed (BabyLoveGrowth)
│   └── /blog/<slug>   Individual post template
└── /contact           Calendar embed or short contact form
```

### Routing flow

```
Organic search traffic
        │
        ▼
   Blog post  ─────────┐
        │              │
        ▼              ▼
   Home page  ──►  Marketing route card  ──►  Marketing VSL (existing)
        │       \
        │        ─►  Automation route card  ──►  Automation VSL (existing)
        ▼
   About / Proof  ──►  trust layer, back to home or directly to VSL
```

The website never sells directly. Every primary CTA either routes to a VSL or to the blog. The VSLs handle the actual conversion (book a call, sign up).

### Tech stack

- Static HTML / CSS / JS, no build step (same pattern as the rest of the `Websites/` repo)
- Hosted on **GitHub Pages** at the existing repo URL (e.g. `demilio24.github.io/Websites/Nils/website/...` until a custom domain is wired up)
- Google Fonts loaded via `<link>` (Google Sans, DM Sans, Instrument Sans, Instrument Serif)
- **Pagefind** for blog search: generates the search index from static HTML at build time, drop-in autocomplete UI, zero backend, free
- BabyLoveGrowth handles auto-published blog posts; each post template has an inline CTA at the end that routes to the matching VSL based on the post's primary tag

### Out of scope (at launch)

- No new offer pages or sales pages (the VSLs are the offers)
- No email capture / nurture sequence (can be added later)
- No paid-traffic landing pages
- No e-commerce or product pages
- No multi-language support

## Visual identity

Editorial style on white, with each route card carrying brand DNA from its parent VSL.

### Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page background, card background |
| `--ink` | `#0A0A0A` | Body text, near-black headlines |
| `--ink-soft` | `rgba(0,0,0,0.6)` | Sub-headlines, meta text |
| `--ink-line` | `rgba(0,0,0,0.1)` | Borders, dividers |
| `--marketing` | `#046BD2` | Blue, Marketing route + links |
| `--marketing-dark` | `#0358B0` | Marketing gradient end |
| `--automation` | `#0FBF7A` | Green, Automation route + links |
| `--automation-dark` | `#087A4D` | Automation gradient end |

### Typography stack

Pulls directly from the Marketing VSL stack, with Instrument Serif added as the editorial headline accent.

| Token | Value | Use |
|---|---|---|
| `--font-serif` | `'Instrument Serif', Georgia, serif` | Hero headlines, section H2s |
| `--font-display` | `'Instrument Sans', sans-serif` | CTAs, eyebrows, wordmark, UI labels |
| `--font-body` | `'Google Sans', 'DM Sans', sans-serif` | Body copy, nav, meta |

Italic accent words inside Instrument Serif headlines should color-encode their associated offer (Marketing words in blue italic, Automation words in green italic) where it reads naturally.

### Decorative cues (lifted from existing VSLs)

- **Dot-grid radial overlays** in blue (`#046BD2` at low opacity) on Marketing-flavored sections, masked to fade at the edges. Signature pattern of Marketing VSL.
- **Binary code-rain text** in green (`#0FBF7A` at low opacity) as a subtle texture on Automation-flavored sections. Echo of the Matrix canvas hero in Automation VSL.
- Subtle hover lift on cards (`translateY(-3px)` + soft shadow)
- No heavy gradients in page chrome, no shadows in the nav

### Layout rules

- Generous whitespace, content-forward
- White background everywhere except inside route cards (which are full-bleed colored)
- Light borders + soft shadows for elevation
- Mobile-first responsive from day one

## Page-by-page design

### 1. Home (`/`)

**Sections (top to bottom):**

1. **Nav** — White bg, Instrument Sans wordmark, link list to About / Proof / Blog / Contact
2. **Hero** — White background with soft blue dot-grid radial overlay
   - **Eyebrow:** `For local service businesses` (Instrument Sans, blue pill)
   - **H1 (Instrument Serif):** `If you want to get more clients and automate your busywork, you're in the right place.`
   - **H2 (DM Sans, lighter):** `We run super profitable Google Ads and build custom automations that eliminate your manual work by up to 100%, so you can focus on growing the business, not just maintaining it.`
3. **Route halves** — Full-bleed dual columns, edge-to-edge under the hero
   - **Left (Marketing):** Blue gradient (`#046BD2 → #0358B0`), white dot-grid overlay. Heading "Get more clients." Sub: "Website + Google Ads + reviews. Built and managed for you." CTA: "See the marketing system →" links to `Nils/funnel/vsl.html`
   - **Right (Automation):** Green gradient (`#0FBF7A → #087A4D`), faint binary code-rain texture. Heading "Save time on ops." Sub: "AI + automation audit. Department by department." CTA: "See the audit →" links to `Nils/funnel/automation-vsl-funnel-direct.html`
4. **Proof teaser** — 3-4 client logos or one-line testimonials, links to `/proof`
5. **About teaser** — Short "who we are" block with portrait of Emilio, links to `/about`
6. **Latest from the blog** — 3 most recent posts, links to `/blog`
7. **Footer** — Nav links, social, copyright

### 2. About (`/about`)

**Sections:**
1. Hero — Eyebrow `Who runs this`, H1 about Nils Digital's origin, H2 with the why
2. Operator story — Emilio's background, what the agency does differently
3. Team — Existing `team.html` content (operator-led, not faceless agency, not one-man army)
4. How we work — High-level process (scan site, scope, build, support)
5. CTA back to home routes — "Pick a system to start" with the two-card pattern

### 3. Proof (`/proof`)

**Sections:**
1. Hero — Eyebrow `Receipts`, H1 about results, H2 about variety of business types
2. **Marketing proof block** — Blue accent, case studies for the Marketing system (lead growth, conversion lifts, screenshots of split tests)
3. **Automation proof block** — Green accent, case studies for the Automation audit (Savvy Compliance "40 hours every week" type wins)
4. Logo wall
5. CTA back to home routes

### 4. Blog (`/blog`)

**Sections:**
1. Nav (shared)
2. **Section header** — Crumb `nilsdigital.com/blog`, H1 (Instrument Serif): `Growth and systems insights for $1M+ local service business owners`
3. **Toolbar** — Tag pills on the left (All, Marketing, Automation, Local SEO, Google Ads, AI tools, Reviews), **compact search box inline on the right** (`Search` + `⌘K` kbd, opens Pagefind overlay)
4. **Post grid** — Card per post, each with thumbnail, title, tag pill (color-coded blue or green), read time
5. Footer (shared)

**Blog post template (`/blog/<slug>`):**
- Standard editorial layout: hero (eyebrow = tag, H1 = post title, H2 = subtitle), body, author byline
- **Inline CTA at the bottom**, color-coded by post's primary tag:
  - Marketing-tagged post → blue card linking to `vsl.html`
  - Automation-tagged post → green card linking to `automation-vsl-funnel-direct.html`
- "Related posts" block at the end (3 same-tag posts)

### 5. Contact (`/contact`)

**Sections:**
1. Hero — Eyebrow `Talk to us`, H1, H2
2. Calendar embed (existing `Calendars/strategy.html` or `Calendars/emilio.html` pattern)
3. Backup contact form (email, message, dropdown for "what are you interested in: Marketing / Automation / Both / Not sure")
4. Footer

## Build rule: variations per section

**For every section on every page**, the build phase must produce **2-4 visual or copy variations** (meaningfully different, not cosmetic tweaks). The user picks one variation per section before the page is finalized. This applies to hero, problem framing, proof, FAQ, CTA, footer, blog card layout, etc.

This is non-negotiable for this project. It's faster for the user to pick from variations than to review and revise a single attempt.

Variations should be presented via the visual companion (when active) or as toggleable inline blocks the user can review. After picks are made, the variations are removed and the chosen one is consolidated into the final page.

## Copy rules

These apply across every page and blog post template.

- **No em-dashes** (`—` or `&mdash;`). Substitute with comma, colon, period, or parentheses. En-dashes (e.g. `3–6` for ranges) are allowed.
- **One sentence per `<p>`** in editorial sections. Desktop forces single-line via `white-space: nowrap` + full-viewport breakout; mobile resets to natural wrap.
- **No `text-align: justify`** on body copy.
- **Headline formula** for hero sections, every page:
  - Eyebrow: avatar callout (`For local service businesses`, `For owners doing $1M+...`)
  - H1: outcome / value promise (Instrument Serif, italic accent words optional)
  - H2: "so that you can" phrasing (the reason why), DM Sans lighter weight

## BabyLoveGrowth integration

The blog at `/blog` will be the publishing target. To confirm before build:

- Does BabyLoveGrowth's publishing config support a single static directory target (e.g. push HTML files into `Nils/website/blog/`)?
- Can it embed the inline-CTA template (or do we need a post-publish script that injects the CTA based on the post's tag)?
- What's the tag/category vocabulary BabyLoveGrowth uses, and does it map cleanly to our pills (Marketing, Automation, Local SEO, Google Ads, AI tools, Reviews)?

If BabyLoveGrowth can only publish to a single path with a generic template, we need a thin post-publish script (Node or Bash) that:
1. Wraps the BabyLoveGrowth-generated body in our site template (nav + footer + brand styles)
2. Reads the post's primary tag and injects the matching inline CTA
3. Rebuilds the Pagefind search index

## Open questions (to resolve in plan phase)

1. **Custom domain:** Is `nilsdigital.com` already pointed at GitHub Pages, or does the site launch under `demilio24.github.io/Websites/Nils/website/...`? Affects sitemap URLs and SEO config.
2. **Existing pages relationship:** Do we keep the existing `Nils/team.html`, `Nils/nils-proof.html`, etc. as they are, or migrate their content into the new About/Proof pages and deprecate the originals? Recommendation: migrate the content, then leave the old files alone (they may be linked from GHL or elsewhere).
3. **Contact form backend:** If we add a contact form (separate from the calendar), where do submissions go? Email forward? GHL contact?
4. **Analytics:** Microsoft Clarity is the default per `reference_clarity_tracking_ids.md`. Need a new Clarity project ID for this site.

## Success criteria

A launch is successful when:

- All 5 pages exist, are mobile-responsive, pass `/qa-master`, and feel like a single brand
- Pagefind search works on `/blog` and indexes new posts on rebuild
- BabyLoveGrowth can publish a post that lands in `/blog` with the correct inline CTA injected
- Home page route cards link to the correct existing VSL files with no broken handoffs
- The site is indexable (sitemap.xml, robots.txt, meta tags, schema)
- Page weight stays under 200KB per page (excluding fonts and any post imagery)

## Related references

- [[project_nils_automation_funnel]] — green theme + Matrix hero context for the Automation VSL
- [[feedback_no_emdashes]] — copy rule applied across all pages
- [[feedback_one_sentence_per_line]] — editorial layout rule
- [[feedback_no_justify]] — body-copy alignment rule
- [[feedback_section_variations]] — build rule (2-4 variations per section per page)
- [[reference_clarity_tracking_ids]] — where to register the new Clarity project ID
- [[feedback_typography_tokens_only]] — token discipline (no hardcoded px sizes)

## Next step

Hand off to the `superpowers:writing-plans` skill to produce a concrete, ordered implementation plan that breaks this design into shippable steps (folder scaffold → tokens + components → page-by-page builds with variations → blog template + Pagefind → BabyLoveGrowth integration script → SEO + analytics → QA + launch).
