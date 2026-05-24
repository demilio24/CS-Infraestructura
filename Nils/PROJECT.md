# Nils — agency funnel + client-portal pages

## What this is
This folder holds every web asset built for **Nils Digital** (Emilio's own agency). It's a mix of (a) outbound sales funnels selling Nils' services to local-business prospects, (b) post-sale client-facing pages (onboarding, calendar, revision portal, presentations), (c) Instagram carousel exports, and (d) the snippet that locks down GHL agency access for client users. Everything is static HTML + embedded CSS/JS hosted on GitHub Pages and embedded into GoHighLevel via iframe.

## Architecture

### Top-level layout
- `funnel/` — the active sales funnel pages and their variations
  - `vsl.html` — current main VSL (websites + Google Ads pitch, blue token system)
  - `nils-vsl.html`, `nils-vsl-fast.html`, `nils-vsl-fast-direct.html` — VSL iterations
  - `nils-quiz-fast-direct.html` — quiz-led variant (spec in `docs/superpowers/specs/`)
  - `automation-vsl-funnel-direct.html` — green-themed automation pitch with Matrix code-rain hero (see Conventions)
  - `review.html` — `$27` review-filtering product sales page (gold token system)
  - `review-onboarding-calendar.html` — post-purchase onboarding + GHL calendar embed for the review product
  - `hero-variations/v1...v5*.html` — five hero design experiments (editorial-bold, dark-glass, magazine-serif, vibrant-gradient, apple-minimal)
  - `images/` — `hero-bg.png`, `guarantee-bg.png` (locally referenced bg art)
  - `screenshots/` — QA / proof screenshots from build iterations (gitignore-eligible)
  - `survey-log.json` — captured submissions from the qualifier survey
- `Calendars/` — standalone booking-calendar pages embedded in GHL: `strategy.html`, `support.html`, `emilio.html`
- `GHL/` — `config.json` + `script.js` for the agency-dashboard lockdown (limits `supportAccessList` users to the HL Help widget and `aiAccessList` users to Ask AI only). Edit `config.json`, push, no script changes needed.
- `Posts/results.html` — Instagram carousel slide variations rendered at 1080x1350 for export as PNGs
- `Prompts/Prompt1.txt`, `Prompt2.txt` — saved prompts (likely for Imagen / copy work)
- `docs/superpowers/plans/` + `specs/` — design specs and implementation plans (e.g. `2026-04-24-nils-quiz-fast-direct-design.md`)
- `offer.pdf` — current Nils offer doc

### Top-level pages (client-portal + sales support)
- `team.html` — Nils Digital team directory (Inter, light slate background, sticky card list + examples panel)
- `presentation.html` — full-screen slide deck of "The Offer" (black bg, keyboard/click navigation)
- `nextchapter.html` — fullscreen slide deck pitch ("The Next Chapter")
- `nils-proof.html` — proof / case-study display (Trustpilot green `#00b67a`)
- `urgency.html` — "Why decide today" page (white, narrow column)
- `revision-request.html` — portal for clients to submit website revision requests (blue token system)
- `onboarding-form-widget.html` — small fixed bottom-right widget panel embedded inside GHL
- `onboarding-completed-google-ads.html` — confirmation page after Google Ads onboarding
- `onboarding-completed-pipelines-phone.html` — confirmation page after pipelines/phone onboarding
- `Website-onboarding-form-completed.html` — confirmation page after website onboarding

### Tech stack
- Static HTML, embedded `<style>` + `<script>` (no build step, no bundler)
- Google Fonts loaded via `<link>` (Google Sans, Instrument Sans, DM Sans, Instrument Serif, Inter)
- Hosted on **GitHub Pages**: `https://demilio24.github.io/Websites/Nils/<path>.html`
- Embedded into **GoHighLevel** custom-code elements via the iframe wrapper from `~/.claude/CLAUDE.md` (preserves `?email=` passthrough)
- Booking widgets pull from `https://link.nilsdigital.com` (GHL calendars)
- Some pages preload videos from `assets.cdn.filesafe.space` (GHL media CDN)

### Hosting / how things go live
Push to `main` → GitHub Pages serves the file → paste the GH Pages URL into the standard iframe embed wrapper → paste embed into GHL custom-code element.

## Conventions

### Design token systems (varies by file family)
- **Blue token system** (`vsl.html`, `presentation.html`, `revision-request.html`, `Calendars/strategy.html`) — Nils' agency brand
  - `--blue: #046bd2`, `--blue-dark: #0358b0`, `--blue-rgb: 4, 107, 210`
  - Fonts: `--font-main: "Google Sans"`, `--font-secondary: "DM Sans"`, `--font-emphasis: "Instrument Sans"`
- **Gold token system** (`funnel/review.html`, `funnel/review-onboarding-calendar.html`) — $27 review product
  - `--gold: #c9963b`, `--gold-dark: #9a6d1f`, `--gold-light: #e8b84b`
  - Fonts: Instrument Sans + Google Sans
- **Green/Matrix token system** (`funnel/automation-vsl-funnel-direct.html`) — automation pitch
  - Token names kept as `--blue*` for code stability but values are green: `#0fbf7a / #087a4d / #34d399`
  - Sections 1-2 dark with Matrix code-rain canvas, sections 3+ flipped via `class="theme-light"`
- **Trustpilot green** (`nils-proof.html`) — `#00b67a` body bg

### Animation pattern
Most funnel pages use `.anim` + `.anim.visible` with `IntersectionObserver` (opacity + translateY transition). Delay classes `.d1` through `.d5` add 0.1s stagger increments.

### Copy rules (apply everywhere)
- **No em-dashes** (`—` / `&mdash;`). Use colon, comma, period, or parentheses. En-dashes for ranges (`3–6`) are fine.
- **One sentence per `<p>`** in editorial sections. On desktop, full-viewport breakout + `white-space:nowrap` renders each sentence on its own line; mobile resets to natural wrap.
- No `text-align:justify` on body copy.

### Posts/ caveat
Slides in `Posts/results.html` are exported as static PNGs via html2canvas for Instagram. **Never** add CSS animations to slide content; only OK on UI chrome that's hidden during export (variation label, dots).

### Naming
- Filename suffix `-direct` = no qualification gating, every path leads to the calendar
- Filename suffix `-fast` = trimmed/condensed variant of the prior version
- Hero variation files prefixed `v1...v5` with a short style descriptor
- `onboarding-completed-*.html` = post-form thank-you pages, one per onboarding flow

## Open threads
- The 2026-04-24 memory file references the automation funnel as `NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html`; current canonical location is `Nils/funnel/automation-vsl-funnel-direct.html`. Memory note is stale, file content matches the green-theme + matrix-hero direction described.
- `funnel/screenshots/` accumulates dozens of build-iteration PNGs, candidate for `.gitignore` cleanup.
- **New: `Nils/website/` implementation pending.** Design spec approved on 2026-05-24 (see `docs/superpowers/specs/2026-05-24-organic-website-design.md`). Next step is `superpowers:writing-plans` to produce the implementation plan. Four open questions inside the spec to resolve in plan phase: custom domain status, what to do with existing top-level `team.html`/`nils-proof.html` (migrate vs keep), contact form backend, new Clarity ID.

## Changelog

### 2026-05-24 — Approved design spec for new organic-traffic website
Full brainstorming session with Emilio (via `superpowers:brainstorming` visual companion) produced a complete design spec for a new Nils Digital website at `Nils/website/`. The site is a SEO front door + warm-up + routing layer for the two existing VSL funnels (Marketing + Automation), NOT a new sales funnel. Key decisions locked in:
- **Positioning:** one brand, "Growth & Systems Partner" for $1M+ local service business owners (single avatar, both pains)
- **Conversion goal:** warm-up hub that routes organic traffic to existing VSLs; site never sells directly (paid traffic continues to bypass and go straight to VSLs)
- **Pages (5):** Home, About, Proof, Blog, Contact
- **Home hero pattern:** Netflix-style full-bleed dual route halves (blue Marketing card + green Automation card) under an Instrument Serif headline on white
- **Hero copy (V1):** eyebrow "For local service businesses" / H1 "If you want to get more clients and automate your busywork, you're in the right place." / H2 "We run super profitable Google Ads and build custom automations that eliminate your manual work by up to 100%, so you can focus on growing the business, not just maintaining it."
- **Visual identity:** white bg, Instrument Serif headlines, Instrument Sans for CTAs/labels, Google Sans + DM Sans for body. Marketing accent `#046BD2` with dot-grid texture (signature from Marketing VSL); Automation accent `#0FBF7A` with binary code-rain texture (echo of Matrix hero in Automation VSL)
- **Blog:** single feed at `/blog` with tag filters + compact inline search bar in the tag toolbar. **Pagefind** as the search backend (static, zero backend, generates index from HTML at build time). BabyLoveGrowth pumps posts into `/blog`; per-post inline CTA at end routes to matching VSL by tag
- **Build rule:** every section on every page must be produced as 2-4 variations for Emilio to pick from, NOT a single attempt. Saved as `feedback_section_variations.md` memory
- Spec is at `Nils/docs/superpowers/specs/2026-05-24-organic-website-design.md` (uncommitted, pending Emilio's review)

### 2026-05-18 — Synced local working tree with remote main
Pulled ~3,300 remote commits. No file-level conflicts in this folder; the merge incorporated remote changes cleanly. No structural decisions made here — no code or copy edits this session.

### 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state. Folder currently contains: 11 top-level HTML pages (team, presentation, urgency, nextchapter, nils-proof, revision-request, onboarding-form-widget, three onboarding-completed variants, Website-onboarding-form-completed) + `offer.pdf`; `funnel/` with 8 active HTML pages, 5 hero variations, images, screenshots, survey log; `Calendars/` with 3 booking pages; `GHL/` agency-lockdown script + config; `Posts/results.html` carousel slide variations; `Prompts/` saved prompt files; `docs/superpowers/` with a quiz-funnel design spec and plan.
