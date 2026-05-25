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
- `sample-blueprint-systema-floyd.html` — **prospect-facing HTML version of the example deliverable.** Editorial long-read styled as a sibling to `presentation-audit.html` (same blue token system, Instrument Serif italic display for big headings, Instrument Sans for labels, DM Sans body). Sticky-sidebar TOC with scroll-spy on desktop (collapses to a card on mobile), warm off-white background (`#fbfaf7`), color-coded risk pills, phase timeline cards, decision cards, real architecture diagram (boxes + arrows instead of ASCII). Footer CTA routes to the 14-Day Audit booking. Zero em-dashes. Same content as the .md but designed to be less intimidating for non-technical SMB owners. Use this as the link in sales conversations.
- `sample-blueprint-systema-floyd.md` — **markdown version of the same example deliverable.** Markdown doc (~10 rendered pages) structured exactly like a real audit-engagement deliverable: cover note, exec summary with ASCII architecture diagram, current-state diagnosis, target-state architecture, 8 subsystem specs, tool stack, data model, 12-week phased build, decision log, risk register, out-of-scope, appendices. Built from the actual Tom_Systema_Floyd engagement but scrubbed for prospect-facing use (no internal IDs, no exact balances, no Nils-internal jargon). Framed as "the plan delivered on Day 14" before any build work begins. User pastes into a Google Doc to show prospective audit clients what they'd get for $3,000.

### Top-level pages (client-portal + sales support)
- `team.html` — Nils Digital team directory (Inter, light slate background, sticky card list + examples panel)
- `presentation.html` — full-screen slide deck of "The Offer" (black bg, keyboard/click navigation)
- `presentation-audit.html` — full-screen slide deck for the **14-Day Audit** ($3,000 standalone deliverable; bumped from $1,400 on 2026-05-25). Sibling visual to `presentation.html` (blue glassmorphism, same fonts). 7 slides: Hero, Problem, Metaphor, Offer, Process, Questions, Investment. Built-in EN/ES toggle (top-right pill) with manual Latin American Spanish translation; selection persists in `localStorage` under key `nils-audit-deck-lang`. Translation map lives in the inline `<script>` as a single `i18n = { en, es }` object keyed by `data-i18n` attrs.
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
- **14-Day Audit offer handoff (2026-05-25):** Full handoff document for the new $3,000 audit offer + pitch deck + sample blueprint deliverable is at [`docs/superpowers/handoffs/2026-05-25-audit-offer-handoff.md`](docs/superpowers/handoffs/2026-05-25-audit-offer-handoff.md). Read it first if picking up audit-offer sales work. Two named follow-ups still open: (1) the §2.1 detail table in the sample blueprint still shows per-campus numbers vs the network-wide stats now in the exec summary (70+ locations / 7,000+ students); Emilio to pick "scale §2.1 up" vs "frame §2.1 as the one campus we audited." (2) Refund/guarantee language from the automation funnel is not currently on the audit deck; reconsider if conversion lags.
- The 2026-04-24 memory file references the automation funnel as `NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html`; current canonical location is `Nils/funnel/automation-vsl-funnel-direct.html`. Memory note is stale, file content matches the green-theme + matrix-hero direction described.
- `funnel/screenshots/` accumulates dozens of build-iteration PNGs, candidate for `.gitignore` cleanup.
- **`Nils/website/` build status (2026-05-25): live on GitHub Pages, NOT yet on `nilsdigital.com`.** The site builds successfully and serves at `https://demilio24.github.io/Websites/Nils/website/` (verified HTTP 200, latest content live). However the apex `nilsdigital.com` domain still 301s into GHL-hosted pages (e.g. `nilsdigital.com/home-104085`), not GitHub Pages, despite the Task 0 resolution claim that the domain was already pointed. **Action needed:** if the new website is meant to live at `nilsdigital.com`, GHL needs to release the DNS/CNAME and GitHub Pages needs the custom domain configured. Until then, the canonical for the site stays GitHub Pages and the working URL to share is the demilio24.github.io path.
- **Full handoff document for the website lives at `Nils/website/HANDOFF.md`** (covers architecture, file structure, design system, real assets, blog publishing flow, SEO, open threads, common edits, git workflow, and people/clients referenced). Read it first when picking the project up in a future session.
- Architecture pivoted on 2026-05-25 from a 5-page site to a single-page-with-anchors layout (#offers / #proof / #about / #contact) plus separate `/blog/`. The standalone `about.html` / `proof.html` / `contact.html` files are now meta-refresh redirects to the matching home anchor.
- Production page picked is **V1b** style (`tokens.css` `--container-max` = 1400px, equal-height proof columns, closing route-halves before mailto in contact, plus real Nils logo + Emilio portrait + 3 real testimonials).
- New content blocks added on 2026-05-25 (commit `cc12fc0c` → live at `750fa646`): a Recognition row inside #proof (presentation + funnels award + $2.4M+ ad-spend dashboard tiles), a Reviews wall at the bottom of #proof (9 real Trustpilot screenshots), and a Behind-the-scenes section between #about and the blog teaser (IMG_3074 + IMG_3160 real client-meeting photos). All assets pulled from the NILS GHL media library (locationId `stoLOEGDIvEDY3xQI4B8`).
- About-section FAQ uses Variation D (magazine longform single column, no accordion, "Question 01" eyebrow above each H3).
- Variation history is preserved in `Nils/website/_drafts/` (landing-v1a / v1b / v2 / v3 / home-hero / home-route-halves / proof-* / about-* / contact-page / blog-index / about-faq-variations / ghl-media-gallery) for reference; none are reachable from the live site.

## Changelog

### 2026-05-25 — 14-Day Audit offer shipped end to end: pitch deck + sample blueprint deliverable + handoff doc
Closed out the audit-offer build track that started 2026-05-24 and continued today. Three assets live and pushed:
1. **`Nils/presentation-audit.html`** — 7-slide audit pitch deck, EN/ES toggle, $3,000 price. Iterated through the day: headline 3-line cap, centering fix on the problem-slide paragraph, hero proof bar ("100+ Audits delivered" + 5-star Trustpilot), mobile arrow hiding + scroll-on-overflow, ES slide-5 headline simplified to "Plan completo en 14 días." Verified at 1920/1440/390 in EN+ES via `.claude/shot-audit-deck.js`.
2. **`Nils/sample-blueprint-systema-floyd.html`** — prospect-facing HTML version of the example deliverable. Editorial long-read styled (Instrument Serif italic display headings, warm off-white bg `#fbfaf7`, sticky sidebar TOC with scroll-spy, color-coded risk pills, phase timeline cards, boxes-and-arrows diagram, footer CTA card). Cover-note section removed mid-session per Emilio's request. Tool Stack H2 had cost callout removed. Each of the 8 component cards got a collapsed `<details class="tech">` "+ Implementation details" dropdown with deeper technical specs (triggers, file lists, schemas, fingerprint format, row lifecycle diagram, sales tax matrix, recovery RPCs, GHL custom-field conventions, slug-to-file maps). Stats row updated to network-wide scale: 70+ Locations / 7,000+ Active monthly students / 8 Distinct programs. Verified visually via `.claude/shot-blueprint.js` and `.claude/shot-blueprint-tech.js`.
3. **`Nils/sample-blueprint-systema-floyd.md`** — markdown twin of the HTML deliverable. Same content, designed for `pandoc → .docx → Google Drive` paste path.

**Handoff document** written at [`docs/superpowers/handoffs/2026-05-25-audit-offer-handoff.md`](docs/superpowers/handoffs/2026-05-25-audit-offer-handoff.md): the full reference for whoever picks this work up next (live URLs, file paths, offer spec, decision history, open follow-ups, resume instructions, commit-by-commit history). Linked from the Open Threads section above so it surfaces immediately.

**Open at session close (carried into the handoff doc):**
- §2.1 detail table in the sample blueprint still shows per-campus numbers vs the network-wide stats now in the exec summary. Emilio to pick scaling vs reframing.
- Refund/guarantee language from the automation funnel is not currently on the audit deck. Worth adding if conversion lags.
- Both CTAs route to `nilsdigital.com/client`. If a dedicated audit-call calendar gets created, swap 3 hrefs total (2 in `presentation-audit.html`, 1 in `sample-blueprint-systema-floyd.html`).

### 2026-05-25 — Handoff doc for the new website
Wrote `Nils/website/HANDOFF.md` as a single-file reference for whoever picks the website up next (future-me, another contributor, the user himself). Covers what the site is, the live URL + repo path, the single-page architecture and every section in `index.html` top-to-bottom, the design system (tokens / typography / B3 brutalist button / copy rules), every real GHL asset in production with media IDs, the BabyLoveGrowth blog publishing flow + Pagefind rebuild step, SEO setup, four open threads (DNS migration to nilsdigital.com, Clarity post-launch wire-up, blog content seeding, third-proof-card name mismatch), a "how to make common changes" table for the most likely edits, mobile + functional test checklist, git workflow with race-condition guardrails, and a roster of all people/clients referenced in the site copy. PROJECT.md now points at HANDOFF.md in the Open Threads bullet so it's discoverable.

### 2026-05-25 — `Nils/website/` shipped to GitHub Pages (single-page architecture, real GHL assets)
Built and shipped the organic-traffic website. Path live at `https://demilio24.github.io/Websites/Nils/website/` (HTTP 200, latest content verified). Architecture pivoted mid-build from a 5-page site to a single long landing page with anchor nav (#offers / #proof / #about / #contact) plus a separate `/blog/` page; the standalone subpage HTMLs (`about.html`, `proof.html`, `contact.html`) now redirect via meta-refresh to the matching anchor. Production page is the V1b variation:
- **Tokens:** `--container-max` 1200→1400px so wide monitors stop letterboxing
- **Hero:** real Nils logo wordmark in nav (`67af965f2ba94ec985a2603c.png`), placeholder client-logo strip removed
- **#offers:** dual route halves with V2 copy + B3 brutalist button style (white pill with hard offset shadow, presses on hover) propagated to `components.css` as the new default
- **#proof:** Recognition row (3 tiles: presentation photo `14.jpeg` + funnels award `14.JPG` + ad-spend dashboard `22.jpg`), two-column cases with equal-height columns (Wendy Cox video + Jessica Schlenz video on marketing, Keila Mulero review screenshot + Savvy Compliance text on automation), Reviews wall with 9 real Trustpilot screenshots
- **#about:** V2 portrait-led hero with Emilio's actual portrait (`emilionils.png`), V2 timeline (2019/2021/2023/2025), Variation D magazine-longform FAQ (no accordion, "Question 01"-style eyebrows)
- **Behind-the-scenes section** (new, between #about and blog teaser): 2-photo grid using IMG_3074 + IMG_3160 client-meeting shots
- **Blog teaser V4** (wide featured + 2 narrow grid)
- **#contact:** "Book a call" hero (V3 copy) + closing route-halves echo + mailto footnote
- **SEO:** trimmed `sitemap.xml` to 2 URLs (home + blog), Organization JSON-LD inlined in `<head>`, smooth-scroll + `scroll-margin-top` on anchored sections in `globals.css`, robots.txt allows root, disallows `_drafts/` `scripts/` `pagefind/`

Open: `nilsdigital.com` still 301s into GHL-hosted pages, so the site isn't yet at the apex domain. If we want it there, the DNS needs to come off GHL and point at GitHub Pages, then GH Pages needs the custom-domain config. Filed in Open Threads above.

Working notes for next session: variation drafts live in `Nils/website/_drafts/` (landing-v1a / v1b / v2 / v3 / home-hero / home-route-halves / proof-* / about-* / contact-page / blog-index / about-faq-variations / ghl-media-gallery). GHL media inventory at `_drafts/ghl-media-inventory.md` + `_drafts/ghl-media-gallery.html`. Token file `.claude/.ghl-nils-token.tmp` is gitignored via `**/.ghl-*-token.tmp`.

### 2026-05-25 — Sample audit deliverable for prospect-facing use: `sample-blueprint-systema-floyd.md`
Created a polished, prospect-facing example of what a 14-Day Audit deliverable looks like. Source material was the actual Tom_Systema_Floyd engagement (PROJECT.md + every doc under `Tom_Systema_Floyd/App_documentation/`), synthesized into a single ~10-page markdown document the user can paste into a Google Doc. Structured like a real consulting deliverable: cover note, executive summary with ASCII architecture diagram + 12-week phase table, current-state diagnosis (6 fragmented surfaces, 15-25 hrs/wk leakage estimate, 6 specific data risks observed), target-state architecture with failsafe pattern table, detailed spec for each of the 8 subsystems (Registration, Camp Day Validator, Camp Dashboard, Billing Dashboard, School Enrollment Router, Waiver Matcher, Forms System, Client-Facing Funnel), tool stack with alternatives-considered table, data model, 6-phase 12-week build sequence, 7-entry decision log with tradeoffs, 12-row risk register with mitigations, out-of-scope list, appendices (glossary, monthly tool cost ~$20-50, operator runbook index). Scrubbed for prospect use: no internal Nils notes, no script IDs, no exact billing balances, no GHL location IDs or OAuth tokens, no in-flight changelog references. Framed as "the plan delivered on Day 14" before any build work begins, so prospects see what they get for $3,000. To produce a polished .docx for Drive, run `pandoc sample-blueprint-systema-floyd.md -o sample-blueprint-systema-floyd.docx`; otherwise the markdown pastes into Google Docs with headings + tables + bullets translating cleanly (ASCII diagrams come through as monospace code blocks). Architecture line added above pointing at the file.

### 2026-05-25 — Audit deck polish: price bump, centering fix, hero proof bar, mobile
- **Price bumped from $1,400 → $3,000** on the Investment slide of `presentation-audit.html`. Same currency, same layout, just the displayed amount.
- **Centering fix:** `.center-stack` is now `display: flex; flex-direction: column; align-items: center` so the subtext block actually centers under the headline instead of left-aligning within the wider implicit container.
- **Hero proof bar added** under the CTA: "100+ Audits delivered" · five-star "Rated Excellent on Trustpilot". Translated for ES.
- **Headlines capped at 3 lines max** across all slides: global `.headline` font cap dropped 58 → 48px with `text-wrap: balance`; hero override dropped 68 → 42px with widened column (`1.35fr 1fr`). Verified at 1440 and 1920.
- **Mobile fixes** (found while expanding test coverage): nav arrows were clipping into the centered paragraph on slide 2 at <640px → hidden on mobile (swipe still works); slide 5 timeline was taller than viewport with content clipped above the headline → `.slide` now `overflow-y: auto` and `justify-content: flex-start` on mobile.
- **Test coverage:** `.claude/shot-audit-deck.js` now sweeps 3 viewports (1920 / 1440 / 390) × 2 languages × 7 slides = 42 shots per run.

### 2026-05-24 — Built `presentation-audit.html` (14-Day Audit pitch deck)
New sales-deck sibling to `presentation.html` for selling the **14-Day Audit** as a standalone $1,400 deliverable (no credit toward future build; positioned as the diagnosis step before any quote). 7 slides: Hero ("The first step towards automation isn't tools. It's an automation blueprint"), Problem (tools-without-plan), Metaphor (surgeon-without-diagnosis pivot to "we can't quote without research"), Offer (single document with every integration / automation / code node / decision), Process (5-phase timeline: Days 1-2 Kickoff, 3-4 Deep Dive, 5-9 Architecture, 10-12 Blueprint Build, Day 14 Walkthrough), Questions (4 Q&As), Investment ($1,400 one-time, 7 bullets, CTA). Visual = sibling to marketing deck (blue glassmorphism, glass orbs, Google Sans / DM Sans / Instrument Sans, same chrome). Voice extracted from `funnel/automation-vsl-funnel-direct.html` (the existing Nils-authored automation funnel where the audit pitch lived as embedded sections). **EN/ES toggle baked in** (top-right pill, persists via `localStorage`) with manual Latin American Spanish translation, not auto-translated — every Spanish string hand-tuned to read naturally. Verified visually in both languages via `.claude/shot-audit-deck.js` (14 screenshots, layout clean across all density-heavy slides like the 5-phase timeline and 2×2 questions grid). Open: deck still pushes to `nilsdigital.com/client` for booking; if a dedicated audit-call calendar gets created, swap the CTA hrefs (2 places).

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
