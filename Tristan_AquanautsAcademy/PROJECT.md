# Tristan Tolley — Aquanauts Swim Academy

## What this is

Funnel + creative work for **Aquanauts Swim Academy**, a private + adaptive swim school on Vancouver Island, BC founded by **Tristan Tolley** in late 2023. Current site (Wix-based): https://www.aquanautsacademy.ca/. Our job is to build conversion-focused HTML funnels and assets that sit alongside (or replace pages of) the existing site, embedded into GoHighLevel.

**Business in one paragraph**
8 instructors, 110+ combined years of teaching, ~3,000 lessons delivered, serves the entire east coast of Vancouver Island from Victoria up to Campbell River with named pool partnerships at Ramada by Wyndham and Naturally Pacific Resort. Real differentiators: space-themed curriculum, adaptive aquatics for autistic + neurodiverse swimmers (Brandon Tolley on team is a behaviour interventionist; Catherine May and Maurya are Master Instructor Trainers), true mobile-to-private-pool service across the Island, and a founder origin story tied to Tristan's father's death from cancer in October 2023.

## Architecture

```
Tristan_AquanautsAcademy/
├── PROJECT.md              ← this file (living context)
├── CLIENT_CONTEXT.md       ← full research report — feeds /write-copy
├── references/             ← (TBD) screenshots of competitor / reference funnels
├── uploads/                ← (TBD) images staged for /upload-to-ghl
├── copy/                   ← (TBD) draft copy from /write-copy
└── funnel/                 ← (TBD) built HTML funnels
```

**Brand voice anchors** (from current site):
- Space + exploration metaphor — "astronaut training program", "soar", "discovery", "mission"
- Triplet phrasing — "float, swim, and soar" / "confident, safe, and empowered"
- Founder-first, emotional, inclusive — never gatekeeping

**Stack & integrations**
- Existing site: Wix
- Booking: Jane App (`aquanautsacademy.janeapp.com`)
- GHL sub-account: to be confirmed (token lookup pending — see Open Threads)
- Social: Instagram `@aquanautsacademy`, Facebook (page id `61567634016832`)

## Conventions specific to this project

- **No em-dashes in copy.** Substitute colon, comma, or period. (Global rule.)
- **One sentence per `<p>`** for hero/section headline blocks on desktop.
- **Space theme is core**, not decorative. Astronaut/rocket motifs are on-brand. Don't strip them.
- **Inclusion-forward language** — never describe adaptive swim as "special needs"; always "neurodiverse", "diverse abilities".
- **Two audiences, not one.** General private-swim parents AND adaptive-aquatics families. Funnels and CTAs should signal which audience they're for. Don't blur them.
- **Use real testimonials only.** Only three exist publicly today (Erin M / Andrew B / Melissa S — see CLIENT_CONTEXT.md). Do not fabricate, do not generalize.
- **Don't publish partnership claims that aren't verified.** The current `/partnerships` page lists ~10 partners; none could be confirmed via search. Confirm with Tristan before reusing.
- **Sibling/family pricing is a real differentiator** ($35/family semi-private, sibling family lesson rates). Lead with it for multi-kid households.

## High-leverage funnel angles (from research)

For the **adaptive audience** specifically:
- The 160x autism drowning-risk stat (Columbia Mailman, AJPH 2017) above the fold
- BC Autism Funding Unit (AFU) pathway explained — $22K/yr under 6, $6K/yr ages 6-18. Adaptive swim qualifies via behaviour-interventionist supervision or "specialized therapeutic activity" framing. Most parents don't know this — it's a price-objection killer.
- Brandon Tolley already being a BI is an unusual unlock for AFU-direct-billing

For the **general audience**:
- "20% instructor attention vs. 100%" group-vs-private framing
- Island-wide mobile-to-your-pool service (rural families drive 45+ min to rec centres)
- Stack named instructor credentials (Catherine May 30+ yrs, Maurya 40+ yrs, Erica coached Jamaica's national synchro team) — credibility is currently undersold

See [CLIENT_CONTEXT.md](CLIENT_CONTEXT.md) for the full research dossier.

## Open threads

1. **GHL sub-account confirmed** — Tristan's locationId is `xBWIIj9IjYQL2XdtjJ1A`, `account_name = "Tristan Tolley's Account"` in `public.ghl_tokens`. Token is rotated by n8n; re-pull on long runs.
2. ~~**Funnel HTML rewrite** — swap Wix URLs to GHL CDN URLs in `funnel/home.html` and `funnel/home-b.html`.~~ **Done 2026-05-25 (night)** — all 24 referenced Wix images uploaded to GHL and swapped in both files. See changelog.
3. **Verify all `/partnerships` claims** with Tristan before reusing on a funnel: SELF DESIGN, NIDES, HCOS, Island ConnectEd, Superhero Swim University, inSpace Childcare, Katies Korner, Balance Physio, Long Lake Physio, Splash About, Autism Support BC, Special Olympics BC.
4. **Google Business Profile** — claimed? Total reviews + stars? Currently only 3 named testimonials exist anywhere online; a review-collection workflow is priority #1 for social proof.
5. **AFU registration** — is Aquanauts a registered AFU provider, or are clients paying-and-claiming? Affects how we phrase pricing on the adaptive page.
6. **Founder photo + last-name licence** — confirm Tristan is comfortable publishing the personal story (father's death) + a headshot on a conversion page.
7. **Video assets** — none exist. A 60-90s founder story video is the highest-ROI single asset he could produce.

## Changelog

### 2026-06-01 (+7) — Swimmer Age dropdown added to lead form
User noticed the webhook trigger sample payload didn't include `swimmer_age` and asked for the field. Reason: the GHL custom field `Lead Form Swimmer Age` (`DZFtnzJksaTkgxGUJuNs`) was created via API back in May but no form input was ever wired up to feed it, so every contact ended up with that field empty.

- Added optional `<select name="swimmer_age">` to the hero form between the location field and the honeypot, with 7 options matching the existing GHL picklist values exactly: `6 to 18 months (Infant Survival)` / `2 to 4 years` / `5 to 12 years` / `13 to 18 years` / `Adult (18+)` / `Adult 55+` / `Adaptive (any age)`. Made it optional — non-lesson inquiries (Pool host, Partnership, Sponsorship) don't need it and adding required friction there would hurt conversion.
- Added `AGE_TO_GHL` mapping in the form JS so the short form value (`kid`, `teen`, etc.) gets translated to the exact picklist string before posting to the webhook. Body now carries `swimmer_age` as a sibling of `program_of_interest` and `closest_location`.
- Verified live with `.claude/verify-leadform-age.js` (puppeteer + real webhook POST as Emilio Nils, Private + Nanaimo, `5 to 12 years`): GHL returned `200 OK` with `{"status":"Success: request sent to trigger execution server","id":"tjwaNPdB6vg47WcRcer7"}` — note the message changed from the previous "test request received" because the workflow trigger is now active, so each submit actually executes the workflow now.

### 2026-06-01 (+6) — GHL custom-field cleanup + folder consolidation
Cleaned up the snapshot cruft in the custom fields of Tristan's GHL sub-account (`xBWIIj9IjYQL2XdtjJ1A`). Scope confirmed with user: **conservative — delete only definite junk/duplicates; only the Lead Form(s) are live.** Started at 71 field items / 10 folders, ended at **64 fields / 6 populated folders**.

- **Deleted 7 fields** (all zero contact data, all duplicates or empty): the blank/corrupt radio (`fieldKey contact.`), `Logo` (dup of `Logo [PNG Format]`), `Primary Color (Please Include…)` + `Seconday Color (Please Include…)` (dups of the `…(Provide HEX…)` pair), and `Contact's First Name` / `Contact's Email` / `Contact's Phone Number` (dups of standard contact fields).
- **Kept all lead-form fields** untouched: `Lead Form Intent` (`contact.program_of_interest`), `Lead Form Swimmer Age`, `Lead Form Location` (`contact.closest_location`), `Street Address`, `Website Form - Additional Information`, `Message` — these back the +5 webhook form.
- **Consolidated folders** by emptying the giant `Additional Info` catch-all + singleton folders and redistributing into 6 clean folders: **Lead Form** (6, renamed from "Form | Lead Form"), **Onboarding Information** (20, branding/colors/socials/creds), **Call/Appt Info** (20, appointments+sales+call notes), **Referrals & Reviews** (9), **Contact** (4, meta+source), **Placeholders - Do NOT Update** (5, holiday/nurture — left untouched).
- **Deleted 2 emptied non-standard folders** (`Referral`, `Survey | Review Management Survey`). `General Info` + `Additional Info` are `standard:true` and can't be deleted even when empty — they remain empty.
- API quirks captured in memory `reference-ghl-custom-field-api`: list omits folders, can't create contact folders via API (reuse/rename only), move = `PUT {parentId}`, `/forms/{id}` unreadable so form-field usage can't be verified via API.

### 2026-06-01 (+5) — Hero lead form is now functional (webhook-driven, JS-routed)
Killed the GHL form / iframe path entirely. Our own HTML form in `funnel/home.html` now handles submission end-to-end: POSTs to a GHL Inbound Webhook (no API key in the browser) and computes the post-submit redirect URL client-side. Amina's "Build Lead Form" ClickUp task (`86ahnyugh`) closed as obsolete — only thing left on the GHL side is wiring the workflow's webhook trigger to the existing custom fields + the email/SMS/pipeline actions.

- **Form rebuilt:** placeholder `<form>` replaced with `id="leadForm" novalidate` + real submit handler. New options added (Aquayoga, Pool host, Partnership, Sponsorship) so the form covers all 10 GHL `Program of Interest` picklist values. Locations expanded to all 10 GHL `Closest Location` values (Campbell River split into Ramada and Naturally Pacific Resort to match GHL, "Not sure yet, recommend one" added).
- **Honeypot field:** off-screen `<input name="company_url">` traps bots. Bots that fill it skip the API call but still get redirected (silent fail, no noise).
- **Submit handler:** disables the button, sends a flat-shape JSON body to the GHL inbound webhook (`first_name`, `last_name`, `email`, `phone`, `program_of_interest` mapped to GHL's exact picklist option strings, `closest_location` same, `tags: ["funnel-aquanauts-2026"]`, `source`, UTM passthrough). Always proceeds to the success state regardless of API result — never lose a lead to a network blip.
- **Routing matrix in JS:** `PROGRAM_REDIRECT` covers 9 single-condition programs (adaptive → /adaptive-aquatics, mobile → Jane Mobile, lifeguard → /lifeguarding-services, aquayoga → /aquayoga, pool-host → /pool-hosts, partnership → /partnerships, sponsorship → /sponsorship, other → Jane root, adult → /private-swim-lessons-for-adults). `LOCATION_BOOKING` covers all 9 Private + location combos. Adult routes to content page regardless of location (per the routing decision: not every location supports adult booking, content page warms them).
- **Success state:** form is hidden, success card with checkmark + "You are matched" copy + a `target="_top"` "Continue to booking" button containing the computed redirect URL. `target="_top"` is essential because the page is iframe-embedded in GHL custom code — without it the redirect would happen inside the iframe instead of the parent window.
- **Webhook URL:** `https://services.leadconnectorhq.com/hooks/xBWIIj9IjYQL2XdtjJ1A/webhook-trigger/7825fb7b-c5fa-4e9c-9161-97c0f156bc3f` (public, CORS-friendly, single-purpose; safe to ship in browser JS).
- **Why webhook over PIT:** original plan was to hardcode a Private Integration Token and call `/contacts/upsert` directly. GHL's API blocks browser POSTs via CORS, so the PIT approach can't actually create contacts from the browser. Inbound webhooks bypass CORS entirely (they're designed for third-party form embeds) and have a smaller blast radius (only what the workflow does, not arbitrary API calls).
- **Verified:** `.claude/verify-leadform.js` puppeteer test — all 19 routing combos match expected URLs; one live submit with Emilio's info hit the real webhook and got `200 OK / "Success: test request received"` (GHL's standard ack for first webhook POST; field mapping in the workflow trigger is the next manual step).
- Files touched: `funnel/home.html` (form HTML + CSS for success state + JS submit handler), `.claude/verify-leadform.js` (new puppeteer test).

### 2026-06-01 (+4) — Hero form attention effect on every CTA click
User asked for a more attractive on-click effect that draws the eye to the lead form when any CTA is pressed. The old `formPulse` keyframe only fired when the link carried a `data-program` or `data-location` attribute (program cards, location cards, team cards), so the most prominent CTAs (top of hero, "See All Programs", footer book links, nav book button) scrolled silently.

- Replaced `formPulse` with a multi-stage `formAttract` keyframe (2.2s): scale 1.028 → settle → 1.018 → settle, with the box-shadow cycling teal halo → coral halo → back, so the card "pulses" twice in two brand colours.
- Added `formGlowBoost` keyframe that intensifies the existing `::before` aura backdrop in sync (opacity 0.25 → 0.85 → 0.55 → 0.25, blur 20 → 28 → 24 → 20px).
- Added a diagonal shimmer sweep via `::after` (linear-gradient teal/white/coral band, translateX -120% → 220%, skewX -18deg). Card gets `overflow: hidden` only while `.form-highlight` is active so the static `::before` aura isn't clipped the rest of the time.
- Respects `prefers-reduced-motion: reduce` (all three animations disabled).
- JS: `highlightForm()` now does `classList.remove → reflow → add` so rapid repeat clicks re-trigger cleanly. The click handler always calls `highlightForm` (no longer gated on program/location data) with a 450ms delay so the smooth scroll settles before the pulse fires.
- Verified with `.claude/verify-form-highlight.js` (puppeteer): hero CTA + program-card CTA both add the class on click, animation runs `formAttract`, class auto-removes ~2.4s later, no JS errors. Peak frame at `.claude/screenshots/form-highlight/frame-t+700.png` shows the halo + shimmer reading clearly against the white card.

### 2026-06-01 (+3) — Full site text scrape of aquanautsacademy.ca
User asked for all page text from the live Wix site dumped into a new folder under this project so future sessions have offline reference copy without re-crawling.

- New folder `scrape_2026-06-01/`:
  - `_scraper.js` — Puppeteer scraper (also copied to `.claude/wix_scraper.js` so node_modules resolve); navigates each URL, scrolls to trigger Wix lazy sections, dumps `document.body.innerText` + h1/h2/h3 + meta description to a markdown file with frontmatter (`url`, `title`, `description`, `scraped_at`). Skips files that already exist so re-runs are idempotent.
  - `chunk_1_pages.txt` … `chunk_4_blog_misc.txt` — 66 URLs total split for parallel scraping.
  - `pages/` — 66 markdown files (~444 KB total) + `README.md` index grouped by main pages / blog / category / pricing-plans / products (Happy Nappy / Legionnaire / Headband / Baby & toddler / Rings & toys).
- Why curl alone wasn't enough: Wix ships JS bundles, not server-rendered text. Puppeteer + scroll + 2s settle is the minimum that returns real copy.
- Dispatched 4 parallel subagents (chunks 1–4); all 4 reported `ok=N fail=0`. Final tally: 66/66 markdown files, zero `.error.txt`.
- **How to re-run later:** `cd F:/GitHub/Websites/.claude && node wix_scraper.js <chunk_file> F:/GitHub/Websites/Tristan_AquanautsAcademy/scrape_2026-06-01/pages` — must run from `.claude` so puppeteer resolves. Delete a markdown file to force re-scrape of that URL.

### 2026-06-01 (+2) — Shop CTA simplified to email; per-product mailto links added
User asked us to drop the "Get in Touch" routing back to the home lead form for shop visitors and make direct email the primary call to action, with each product opening a pre-filled message.

- Bottom shop CTA reduced from "Get in Touch / Email Tristan" pair to a single `mailto:tristan@aquanautsacademy.ca` button with generic subject + body.
- Every product card now has a small "Ask about this" link below the price + minithumbs, with `stopPropagation` so it doesn't open the modal.
- Modal CTA changed from "Inquire to order" → "Email Tristan about this", `href` is set per product by `buildProductMailto(p)` (subject: `Interested in {name}`, body: `Hi Tristan,\n\nI'm interested in the {name} from your shop. Could you let me know about availability and how to order?\n\nThanks!`).
- Modal footer microcopy updated to "We don't sell online. Tristan will reply quickly and order on your behalf for your next session."

Note: while iterating, an earlier edit to `inject-shop-modal.py` used raw `\n` in a Python triple-quoted string, which Python collapsed to literal newlines in the output JS and broke the entire IIFE (the per-card links AND the existing mini thumbnails both disappeared). Fixed by escaping to `\\n` so the JS string contains a proper `\n` escape sequence. Verified: 40/40 cards have minithumbs + ask links, zero pageerrors.

### 2026-06-01 (+1) — Cross-page nav rewritten to /home + /shop with target=_top
Domain handoff prep. Both pages will live behind GHL custom-code pages at `aquanautsacademy.ca/home` and `aquanautsacademy.ca/shop`, each iframe-embedding the GitHub Pages HTML. Updated all cross-page navigation to use root-relative absolute URLs that work when the user clicks something inside the iframe:

- `funnel/home.html`: 3 references to `shop.html` (desktop nav, mobile menu, footer Explore) → `/shop` with `target="_top"`.
- `funnel/shop.html`: 5 references to `home.html` (nav logo, nav back chip, Get in Touch CTA, footer return link, modal "Inquire to order" CTA) → `/home` (and `/home#hero-form` where applicable), all with `target="_top"`.
- `.claude/inject-shop-modal.py` updated to match so re-runs stay idempotent.

`target="_top"` is required because the iframe content otherwise tries to navigate the iframe itself to `/shop`, which resolves to `demilio24.github.io/shop` (404). Breaking out to the parent window lands on the correct GHL URL.

### 2026-06-01 — Nanaimo South surfaced as sub-location on the Nanaimo card
Tristan emailed 2026-06-01 04:50 + 04:52 UTC: approved the site ("looks awesome, port over the domain") and asked us to surface the second Nanaimo pool ("Nanaimo South Location") alongside Central for clarity. Per user direction ("if it's another sub-location just point that out without a pic"), did the change without creating a second card:

- Renamed the existing card from `Nanaimo (Central)` to `Nanaimo`, body copy updated to "Two private pools: **Central** and **South**. Year-round. Contact us for pool details and availability at each." Kept the Central pool photo we already have, since we don't have a South pool photo yet.
- Section H2 updated: "6 Pools Across Vancouver Island" → "7 Pools Across Vancouver Island".
- Lead form `closest_location` dropdown: replaced the single `nanaimo` option with `nanaimo-central` and `nanaimo-south` so visitors can self-route.
- `inferLocation()` JS updated: pre-fill for the Nanaimo location card and any team-card mentioning Nanaimo now defaults to `nanaimo-central` (was `nanaimo`).

Open: needs a corresponding GHL custom-field value update on Tristan's sub-account so the form submission routes correctly. The existing `contact.closest_location` custom field (id `uv5pZioA9EuxVABXNpxy`) currently has `Nanaimo` as one of its options; we need to swap that for `Nanaimo (Central)` and `Nanaimo (South)` before the form goes live.

### 2026-05-31 (latest +11) — All CTAs now point to #hero-form
Per user direction ("All the call-to-actions on the main website should point to the lead form at the top, all of them"), audited every conversion CTA on `funnel/home.html`. Result: every button-styled link except the nav "Client Login" (Jane App portal for existing customers, by design) was already pointing to `#hero-form` — except the "Meet the Team" ghost button at the bottom of the About section.

Changed: `<a href="#team" class="btn btn-ghost">Meet the Team` → `<a href="#hero-form" class="btn btn-primary">Book Your First Lesson`. Style upgraded ghost -> primary to match the conversion CTA pattern.

Intentionally left as-is:
- Nav "Client Login" -> Jane App (existing customer flow, not a conversion CTA)
- Reviews "Read all reviews on Google" -> Google search (trust signal pointing out, not lead capture)
- Phone, email, social, footer credit links (not CTAs)

### 2026-05-31 (latest +10) — Merged SEO additions from Tristan's Wix homepage (keywords, FAQs, cities, audience pills)
Tristan emailed 2026-06-01 03:01 UTC asking us to look at his Wix homepage SEO/keyword work and pull anything useful into the funnel. Scraped `aquanautsacademy.ca/` via `scrape-aquanauts-homepage.js` and brought over the highest-impact pieces:

1. **Metadata overhaul.** Title swapped from brand-led to keyword-led: "Private Swim Lessons Vancouver Island | Kids & Adult Swimming Lessons | Aquanauts". Meta description rewritten to front-load private swim lessons / kids swimming lessons / adult swimming lessons / adaptive aquatics / beginner swim lessons + the named cities. Added `keywords` meta, `canonical` link, full Open Graph block (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`) and Twitter card tags (`twitter:card=summary_large_image`, title/description/image).
2. **5 new keyword-direct FAQ entries** (items 10-14), all `data-faq-tags="lessons"`, Yes-pattern answers matching Google's preferred snippet format: "Do you offer private swim lessons?", "Do you offer kids swimming lessons?", "Do you offer adult swimming lessons?", "Do you offer infant swim lessons?", "Do you offer adaptive aquatics?". Also expanded existing FAQ #3 from "Where are your lessons located?" to also include "What areas do you serve?" and the full long-tail city list.
3. **"Also serving" long-tail city line** added below the Locations grid: "Duncan, Ladysmith, Qualicum Beach, Comox, Port Alberni, and surrounding Vancouver Island communities."
4. **"Who We Help" audience pill row** above the Programs filter: Infants & Toddlers / Children / Teens / Adults / Beginners / Intermediate / Advanced / Adaptive Aquatics. New `.audience-pills` + `.audience-pill` CSS (teal/blue palette, dot indicator).

Skipped (per recommendation): rewriting "Why Choose Us" H3s to keyword-rich versions (too disruptive to existing brand-voice copy). Tristan's Wix versions of those headings are saved in `.claude/aquanauts_homepage_current.json` if we revisit.

### 2026-05-31 (latest +9) — Scraped Jane App + Wix /our-instructors, added Talia + 4 real photos + 2 more real bios (now 10 instructors)
User asked us to scrape `aquanautsacademy.janeapp.com` for canonical instructor data. Parallelized across 4 subagents.

Key findings:
- **Jane App publicly truncates bios** at ~150 chars with a "Read More" link that points to `#/staff_member/{id}/bio`. Visiting that URL or clicking the link does not actually expand the bio — Jane appears to gate the full text behind the admin/owner view. So Jane is only useful for staff photos + names.
- **Real bios live on `aquanautsacademy.ca/our-instructors`** for some instructors. Scraped full canonical bios for Catherine May (30+ years, 5 paragraphs) and Drake McKay (10+ years, 5 paragraphs). The Wix page still lists Erica/Sage/Maurya who are no longer on the team — those bios were ignored.
- **Discovered Talia Nicholson (Jane ID 22)** who wasn't on our team page. Real photo available. Bio is the truncated Jane snippet only.

Updates:
- Catherine May: full real bio + new spring-portrait headshot (Jane CDN -> GHL `2fad314e-a538-4441-934f-a467991e4b52.png`). Role tag now `Lifesaving Instructor Trainer · 30+ Years`.
- Drake McKay: full real bio + new spring-portrait headshot (`ea9cc660-e9fb-4a33-a90a-82e4a58a4fe1.png`). Role tag now `Masters Swimmer · Head Coach · 10+ Years`.
- Glenn Mathieson: placeholder swapped for real Jane photo (`0f13863d-8340-4668-a12c-c8af07d5fa69.png`). Role updated to add `· 16+ Years`.
- **Talia Nicholson added as 10th instructor.** Real photo (`f349acaf-4c74-4771-9642-4cfd7b7fb728.jpg`). Bio shows what Jane returned ("Hi, I'm Talia! I've been a lifeguard and swim instructor for over five years...") + a "Full bio coming soon" follow-up. Tagged for all 4 location filters since her actual location wasn't specified.
- H2: "Nine Instructors" → "Ten Instructors".
- Grid stays 3 cols. The lone 10th card centers itself via `.team-grid > .team-card:nth-child(10):last-child { grid-column: 2 }`.

Open items: Talia's full bio (only Jane snippet available); Anastasia/Sandy/Talia still have placeholder bios since neither Jane nor /our-instructors has their canonical text.

### 2026-05-31 (latest +8) — Real instructor bios + Glenn Mathieson added (now 9 instructors, 3x3 grid)
Tristan sent the canonical bio text for 4 existing instructors (himself, Brandon, Donna, Kesya) and the bio for a new addition (Glenn Mathieson, ~16 years experience, Lifesaving Society / BCRPA / Red Cross / WorkSafe BC certs).

- Swapped the 4 placeholder bios for the real ~300-word multi-paragraph versions. Restructured `.team-card-bio` from a single `<p>` to a `<div>` containing multiple `<p>` tags with proper paragraph spacing. Em-dashes stripped per project rule (replaced with commas, periods, or removed).
- Added a 9th team card for Glenn. No photo from him yet, so used a clean placeholder treatment: teal-to-blue gradient with a big "G" initial and a small "PHOTO COMING SOON" tag at the bottom. CSS class `.team-card-img.placeholder`. Tagged with all 4 location filters since his bio says "across Vancouver Island."
- Team grid was 4 columns. Switched to **3 columns** so 9 cards land as a clean 3x3. Bumped collapse `max-height` from 380px to 1200px to fit the longer multi-paragraph bios.
- Section H2 updated: "Eight Instructors" → "Nine Instructors". Decades, on Deck.

Open item: **Glenn's headshot.** Add the email ask to the next round of follow-up.

### 2026-05-31 (latest +7) — Reviews header merged into one card; Our Story photo swapped to Tristan-with-dad
Two targeted polish changes:

1. **Reviews header was two disconnected pieces** (white Google card + separate green trust pill side-by-side). Merged into a single unified card: top section has the Google G + rating, bottom section has a green-tinted strip with the check + "These reviews are pulled directly from our Google Business Profile." Visually one cohesive Google Business Profile widget. Also fixed the `.reviews-head` layout to be `display: flex; flex-direction: column; align-items: center` so the eyebrow and section title stack cleanly below the card on every viewport.
2. **Our Story photo swapped from Tristan's headshot to the actual family photo** he uses on `/about` (Tristan and siblings in the pool with their dad). Pulled from `static.wixstatic.com/.../07f34f_d43d0b10..._mv2.jpg` (alt: "Tristan with father and family"), uploaded to GHL CDN at `f3e2c634-775e-4266-bda9-9eac634ab86d.jpg`. The narrative is about his late father, so the photo now matches the story.

### 2026-05-31 (latest +6) — Reviews section: prominent Google branding + explicit trust statement
Tristan's #1 worry from the May 29 call was that the reviews look fake. The R3 branding pass added a small G logo and a CTA at the bottom, but it was still subtle. This pass makes the Google sourcing unmistakable:

1. **Replaced the small `.reviews-stat` pill** with a `.reviews-google-card`: white card with a 36px Google G logo on the left, "GOOGLE REVIEWS" eyebrow + "5.0 ★★★★★ based on 129+ Google reviews" on the right. Reads as a real Google Business Profile summary.
2. **New `.reviews-trust-line` green pill** immediately below: ✓ "These reviews are pulled directly from our Google Business Profile." Green = trust convention; explicit statement removes ambiguity.
3. **Per-card source line** updated: bumped G logo from 12px to 14px, changed "Posted on Google" → "Google review" (matches Google's own UI label), added a green `.verified` badge with a check icon. Each card now shows `G Google review · ✓ Verified` under the reviewer name.

### 2026-05-31 (latest +5) — Added Shop link to the home page desktop nav
Mobile menu already had a Shop entry; desktop nav (`.nav-links` in `funnel/home.html`) didn't. Appended `<li><a href="shop.html">Shop</a></li>` after the FAQ link so the catalog is one click away from any home-page visitor. No CSS or JS changes (the existing `.nav-links` styling handles it).

### 2026-05-31 (latest +4) — Shop-page roadmap brainstorm (no code changes)
Talked through what to build next on `funnel/shop.html` to impress Tristan. Three options on the table, ranked by impact-to-effort:

1. **Inquiry modal that captures product + size + parent info.** The "Inquire to order" CTA opens a small GHL form pre-filled with the product name and size; every inquiry creates a GHL contact with a `Interested in product` custom field. Directly answers Tristan's "I want lead capture for everything" ask from the May 22 onboarding call. **Recommended first** — makes the shop productive (leads in GHL) instead of just pretty.
2. **"Matching prints" cross-sell.** Splash About sells the same Turtle Tide / Strawberry Field / Shark Reef pattern across cap + diaper + headband. Surface "Available in matching prints" with 2-3 thumbnails on each modal. Easy win, raises avg order value, no work for Tristan.
3. **Sizing helper for Happy Nappy.** Tiny widget that asks for baby's weight in kg and recommends a size from the 5 options. Solves a real friction point (descriptions already have the weight ranges to drive it).

Waiting on Tristan's pick before implementing. Carrying this into the next session as the open thread on the shop page.

### 2026-05-31 (latest +3) — Modal CTA pinned, broken nav logo fixed, perceptually-deduped galleries (55 dupes removed)
Three small fixes from client feedback after seeing R5 live:

1. **"Inquire to order" CTA was scrolling off-screen on long-description products** (and on small phone viewports). Restructured the modal's info column into three flex regions: `.aq-modal-info-head` (title/price/size, pinned at top), `.aq-modal-info-body` (description, scrollable), `.aq-modal-info-actions` (CTA + microcopy, pinned at bottom with a top border). The CTA now stays visible at every scroll depth on desktop and mobile.
2. **Nav logo was 404** on shop.html, GHL CDN URL `52a3a91a-...` was wrong (probably grabbed during early pipeline iteration). Swapped to the same URL home.html uses (`3dab965f-...`) which we know returns HTTP 200.
3. **Visual deduplication of product galleries.** Many Splash About products had the same source image uploaded twice to Wix under different filenames, so after our upload pipeline the same image appeared at multiple GHL CDN URLs and showed up twice in the modal thumbnails. `dedupe-galleries.py` aHash-fingerprints every cached gallery file (8x8 grayscale average hash, Hamming-distance ≤ 4 = match) and drops near-duplicates within each product's gallery. Removed 55 dupes across 281 references (now 226 total; avg 5.6 photos/product instead of 7). Every single product had at least one duplicate. Re-running is safe (idempotent).

### 2026-05-31 (latest +2) — Shop page: filter bar, per-card mini previews, clean descriptions (em-dashes stripped, paragraph breaks preserved)
Three targeted improvements driven by client feedback after seeing the modal go live:

1. **Filter / search bar** (sticky at top of catalog). Search input (debounced via `input` event, normalized alphanumeric match across name + description) + 6 category pills (All / Caps & Hats / Swim Rings / Beach & Toys / Headbands / Happy Nappy). Hidden cards collapse their parent `.cat-section` automatically; an empty-state message shows when no products match.
2. **Per-card mini preview thumbnails.** Each `.product-card` now renders a row of up to 3 small image thumbnails below the price (sourced from `gallery[1..3]`). Clicking one opens the modal **at that image index** (new `initialIdx` arg on `openModal`). Card click still opens at index 0. The mini-thumb click stops propagation so it doesn't double-fire the card's click handler.
3. **Description cleanup.** Originally scraped via `.textContent` which collapsed all block-element whitespace, producing run-on strings like "raysHelps", "beachMatches". Re-scraped all 40 product descriptions via `.innerText` using 4 parallel subagents (`rescrape-descriptions-batch.js`, 10 products each, ~40s total). Then `build-product-data.py.clean_description()` strips em-dashes (replaced with `, `), em-dash-with-surrounding-spaces en-dashes (same), normalizes NBSPs, collapses runs of blank lines down to a single blank line, and trims trailing whitespace per line. En-dashes in digit ranges (`11–15kg`, `1–2 years`) are intentionally kept (per global memory rule). Also removed one hardcoded em-dash from the shop hero subtitle.

Also fixed a subtle bug in `inject-shop-modal.py`: `re.sub` interprets backslash sequences in *string* replacements, so `\\n` escapes inside the embedded JSON blob were being collapsed to literal newlines, breaking `JSON.parse` in the browser. Switched all three `re.sub` calls to lambda replacements so the JSON survives verbatim.

### 2026-05-31 (latest) — Shop page: click any product card to open a lightbox modal with gallery + description + size selector
Tristan asked us to mirror the original Wix product detail experience: multiple images per product, the full description, and the size dropdown for items that have one. Built a click-to-open modal on `funnel/shop.html` covering all 40 products.

Pipeline (idempotent scripts in `.claude/`):

1. `scrape-product-details.js` — Puppeteer-scraped each of the 40 `/product-page/<slug>` URLs. For each: extracted title, price, full description text, and the complete image gallery (cycling thumbnails to trigger lazy load). Output: `aquanauts_product_details.json` (40 entries, avg 9 images each, descriptions ~700-1,600 chars).
2. **Parallelized the upload step with 4 subagents.** Split the 244 unique gallery image URLs into 4 round-robin chunks of 61 (saved as `upload_chunk_{1..4}.json`). Spawned 4 general-purpose Agent calls in parallel, each running `upload-batch.py` against their chunk. Token was piped via stdin to never touch disk. **243 / 244 uploaded successfully (1 truncated Wix URL).** Each worker wrote to its own `upload_result_{1..4}.json`. Total wall-clock: ~3.5 min vs ~12+ min sequential.
3. `build-product-data.py` — merged the 4 partial maps into one `url -> ghl_url` dictionary, then for each product built an ordered list of GHL gallery URLs preserving the original gallery order. Added size variants only where they exist on the source (the 24 Happy Nappy products have `["0-3 Months", "3-6 Months", "6-12 Months", "12-24 Months", "2-3 Years"]`; all other products have no size variant in Wix). Output: `aquanauts_shop_product_data.json`.
4. `inject-shop-modal.py` — appended a ~5 KB modal CSS block to the existing `<style>` and inserted the modal markup + product JSON blob (`<script type="application/json" id="aqProductData">`) + IIFE handler at the end of body. Cards became `tabindex="0"` clickable, lookup matches the card's `.product-name` + `.product-tag` against the JSON via normalized-alphanumeric keys with tag-aware fallback. The modal is a 2-column desktop / stacked mobile lightbox: gallery + scroll-thumbnails on the left, title + price + "Splash About via Aquanauts" badge + size dropdown (only when present) + description + "Inquire to order" CTA on the right. Closes on backdrop click, ESC, or the rotating X. Body scroll-locks while open.

Bug found in QA-screenshot pass and fixed: the `[hidden]` HTML attribute was being overridden by `.aq-modal-size { display: flex }`; switched to `style.display` + always clearing `sizeSel.innerHTML` so the size dropdown isn't carried over from a previous open.

### 2026-05-31 (later) — Shop page now uses real Splash About product photography
Replaced the placeholder per-category SVG glyphs on `funnel/shop.html` with the actual product images from Aquanauts' live `/category/all-products` page. Pipeline (all idempotent, scripts in `.claude/`):

1. `scrape-aquanauts-shop-pup.js` — Puppeteer-scraped both shop pages (page=1 + page=2) using the `li[data-hook="product-list-grid-item"]` selector after lazy-load scroll. Extracted 40 unique product name + Wix CDN image URLs. Output: `.claude/aquanauts_shop_products.json`.
2. `upload-aquanauts-shop-images.py` — for each product: stripped Wix's `/v1/fill/...` transform suffix to get the full-res `.webp`, downloaded with a real browser UA + `Referer: https://aquanautsacademy.ca/`, then POSTed to `services.leadconnectorhq.com/medias/upload-file` with `hosted=false&locationId=xBWIIj9IjYQL2XdtjJ1A`. Token piped via stdin (never written to disk). **40/40 uploaded, 0 fails.** All return `https://assets.cdn.filesafe.space/xBWIIj9IjYQL2XdtjJ1A/media/<uuid>.webp`. Map saved at `.claude/aquanauts_shop_image_map.json`.
3. `swap-shop-images.py` — for each `<div class="product-card">` in shop.html: read `.product-tag` + `.product-name`, normalized to alphanumeric-only, looked up the GHL URL in the map (with tag-aware fallback for ambiguous names like "Baby Swim Seat" 0-1 vs 1-2). Replaced the `<svg>` block inside `.product-visual` with `<img src="<ghl_url>" alt="<tag> <name>" loading="lazy">`. Also updated the `.product-visual` CSS to add `overflow: hidden` + `.product-visual img { width:100%; height:100%; object-fit:cover; }`. **40/40 swapped, 0 missing.**

Verified with Puppeteer (`shot-shop-r4b.js`) — all 40 product photos render. The one console error during local screenshot (`ERR_BLOCKED_BY_ORB` on the logo PNG) is a `file://` cross-origin quirk and does not affect the live GitHub Pages render (where the page is served same-origin to the GHL CDN).

### 2026-05-31 — Closed remaining May 29 call action items (Google review branding + Shop page + client email)
Reviewed both Tristan meeting transcripts (May 22 onboarding, May 29 check-in) against the changelog and found three R3 next-steps still open. Closed all three on `funnel/home.html` (Variation A) and added a new `funnel/shop.html`.

1. **Google-branded the reviews.** Replaced the plain text "Google review" subtitle on all 6 review cards with the 4-color Google G SVG + "Posted on Google". Added the G logo to the `.reviews-stat` badge ("5.0 · over 129 Google reviews"). Added a `.reviews-trust-cta` button below the grid: "Read all 129+ reviews on Google" linking to `https://www.google.com/search?q=Aquanauts+Swim+Academy+Vancouver+Island+reviews` (search URL is a fallback; needs Tristan's direct Google Business Profile URL to swap to). Addresses Tristan's 00:08:23 worry that the reviews look fake.
2. **Built the Shop / Catalog page** at `funnel/shop.html`. Mirrors the home design tokens (light/coral/teal navy, Outfit/Manrope, same nav-back chrome, anim observer). Catalog organized into 5 categories matching `copy_archive.md` (Swim Caps & Hats, Swim Rings, Beach & Water Toys, Swimming Headbands, Happy Nappy™), 50+ Splash About products with name + price + category tag. No checkout (Tristan said "we're not really selling, just a catalog") — CTA points back to the home form + a mailto. Wired both `#shop` placeholders on `home.html` (nav line 485 + footer Explore line 1449) to `shop.html`.
3. **Drafted the post-R3 review email to Tristan** in Gmail (draft ID `r-6495911312607481781`), titled "Aquanauts website: round 3 revisions are live for your review." Lists all 10 R3 changes (the original 9 from 2026-05-29 plus today's Google branding + Shop page) and asks for 3 things back: GBP direct URL, Parksville + Nanaimo pool photos, refined bios for Anastasia/Sandy/Kesya.

Open items after this push:
- **Tristan's Google Business Profile direct URL** — swap the search-URL fallback in `.reviews-trust-cta` once he sends it.
- **Adaptive video** in the Programs dropdown — still pending an asset from Tristan (carried over from 2026-05-29).
- **Parksville + better Nanaimo pool photos** — also pending.
- Shop page uses generic per-category SVG glyphs. If/when Splash About product imagery is needed, we can pull from their catalog and upload to GHL CDN.

### 2026-05-29 — Revision Round 3 (from the May 29 check-in call)
Worked the call feedback one item at a time on `funnel/home.html` (Variation A), one commit per item, QA'd with Puppeteer (no overflow at 1280/390, zero console errors, all toggles work), then pushed. Plan file: `~/.claude/plans/bubbly-wibbling-hopper.md`.

1. **Reorder (reverses R2):** hero -> Why Choose Us -> Programs -> Events -> Locations -> How It Works -> Reviews -> Team -> What Sets Us Apart -> FAQ -> Our Story -> Final CTA. Nav + mobile menu reordered to match.
2. **Removed the embedded video ad (reverses R2):** restored the instructor+child photo in Why Choose Us; dropped the unused `.about-video` CSS. (Call decision: generic ad belongs on social, not the site.)
3. **Hero CTA consolidated** to a single "Book Your First Lesson"; free-assessment line folded into the subtext.
4. **Lifeguarding card** now uses a real lifeguard-on-duty photo from their `/lifeguarding-services` page (`funnel/assets/lifeguarding.jpg`).
5. **Program dropdowns enriched** (Mobile coverage + "best for"; Adaptive sensory-aware approach + AFU pathway). Adaptive video in the dropdown still pending an asset.
6. **Partnerships highlighted:** "See our community partners" dropdown below the Events grid, 13 partner pills from their `/partnerships` page.
7. **Instructor "More information" dropdowns:** cards show name + role by default, full bio + locations reveal on toggle. Returning 5 bios enriched from `/our-instructors` (added Donna's surname, Underwood).
8. **"What Sets Us Apart" effects:** white wave divider + soft blue gradient + faint rising teal bubbles (respects `prefers-reduced-motion`).
9. **"Our Story" section** added before the Final CTA: Tristan's founder story + mission + signature, with his headshot. Footer "Our Story" link added.

Open items / flags for Tristan:
- **Bios for Anastasia, Sandy, Kesya** are short drafts (not on their site or Jane) — need his real text.
- **Partner list** (item 6) reproduced from their site; confirm it is current before go-live (PROJECT.md still flags those as unverified).
- **Repo-hosted images** now: `assets/lifeguarding.jpg`, `assets/victoria-dome-pool.jpg`, `assets/nanaimo-central-pool.jpg` — migrate into GHL media when the API is reachable so the client can manage them. GHL upload host is `services.leadconnectorhq.com` (the "hq").
- **Deferred:** better location photos (Parksville still a kid), and a **Shop/Catalog page** for SplashAbout products (catalog only) wired to `#shop`.

### 2026-05-28 (evening, follow-up) — Central Nanaimo pool placeholder
Scheduled 1-hour follow-up check caught Tristan's 19:42 email: "The IMG is the Central Nanaimo Pool ... use these as a placeholder for now." Set the Nanaimo (Central) location card to `IMG_8996` (the only image still unplaced from his attachments). It is an iPhone 12 portrait with EXIF orientation=6, so it was EXIF-normalized (Pillow `ImageOps.exif_transpose`), downscaled to 1000px wide, and committed to `funnel/assets/nanaimo-central-pool.jpg` (repo-hosted, same as Victoria — flag to migrate to GHL later). Commit `fc02ccdff`, pushed. Note: Tristan says better Nanaimo photos are coming; this is a placeholder.

### 2026-05-28 (evening) — Tristan's 2nd revision round (emails 19:26 + 19:32) committed + pushed
Acted on Tristan's two follow-up emails (2026-05-28 "New Edit" + "Additional Edits"). Commit `9749bfd7e` on `funnel/home.html` (+ `funnel/assets/victoria-dome-pool.jpg`), pushed to `origin/main`. Live at https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html

Requests → what was done:
- **Move "How It Works" above "Why Families Choose Us"** — section order is now hero → **steps → about** → programs → ... (swapped the two via a Python block-move).
- **Embed the video ad in "Why Families Choose Us"** — replaced the static About photo with a `<video>` (`.about-video`), poster = the old instructor+child shot, source = `Aquanauts_Video_Ad.mp4` on GHL CDN. Kept the "3,000+ Lessons" badge.
- **Keep some fun AI-generated art for a background** — `Aquanauts_Website_Cover_1.png` (space/astronaut swim art) layered behind the dark Events ("More Than a Swim School") section under a 0.90/0.93 navy overlay so text stays legible. One placement only, "just to see what it looks like."
- **Instructor roster** — removed Erica, Sage Gibson, Maurya; added **Anastasia Musaji** (Victoria), **Sandy Dowell** (Victoria), **Kesya LeCoz** (Nanoose/Parksville) with their Jane App headshots; updated **Tristan's headshot to v2**. Stays at 8 cards. Bios written modestly (no fabricated certs — Jane App lists names/locations only). Removed the now-empty **Port Alberni** team filter. Softened stale claims: team H2 "110+ Years" → "Decades", sub "40-year" → "30-year" (Catherine), Why card "Combined 110+ years" → "Combined decades".
- **Remove "Ramada" location** — deleted the card; updated pool counts **7 → 6** (locations H2, hero pill, final-CTA badge, meta description).
- **Replace kid pics at pool locations with pool pics** — new clean photos for **Naturally Pacific** (indoor pool .webp), **Shawnigan Lake** (outdoor pool .jpg), and **Victoria** (geodesic dome pool). 
- **Lifeguarding Services copy** — enriched the existing Lifeguarding program card with the real copy from `/lifeguarding-services` (certified water-safety supervision; events / facilities / camps+schools rows; Lifesaving Society / Red Cross, CPR-C, AED). Kept it in the card rather than a new section to respect the earlier "reduce scroll" ask.

Assets: pulled all attachments from Tristan's two emails via the `/get-attachments` n8n workflow (`0L1NeAQaAoK4wref`) using the **Aquanauts** GHL OAuth token from Supabase `ghl_tokens` (NOT the `.env` token — that one is **Center Lane Swim School** `JL5Xsreqcpi8naffNZWe`). 10/12 uploaded to GHL CDN; the **2 Victoria `.avif` files failed** (`INVALID_FILE_TYPE`, known GHL limitation). Pulled the better Victoria avif from the workflow's Drive mirror, converted to JPG with Pillow 12 (native AVIF decode), and committed it to `funnel/assets/` because the GHL media API was not reachable from the local network at the time.

Open items for next round:
- **Parksville** location card still shows a kid (no Parksville pool photo was provided). Mobile/In-Home card kept its kid photo (reasonable for "we come to you").
- **Victoria pool** is repo-hosted (`assets/victoria-dome-pool.jpg`), not in GHL media — move it into the GHL library when the API is reachable so the client can manage it there.
- **Lifeguard-specific photos** weren't among the attachments (the "Screenshot" attachment was the AI art); card still uses the resort-pool image. Ask Tristan for action shots if he wants them.
- A remaining review (Melissa S.) still thanks **Sage**, who was removed from the team. Left the testimonial intact (it's genuine); flag to Tristan whether to keep/swap.

### 2026-05-28 (later) — Tristan's revision round committed + pushed (Variation A)
Acted on Tristan's email feedback (2026-05-28, "I definitely like the light and warm version" → **Variation A `funnel/home.html` is the chosen direction**; Variation B `home-b.html` left untouched). Folded in, extended, and **committed** the previously-uncommitted edits noted in the entry below, plus Emilio's add-on request (lowcountry-style collapsible cards). Commit `680e0e1f`, pushed to `origin/main`; live at https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html

Tristan's requests → what was done:
- **Reduce scroll length** — removed the "Inside the Pool" gallery section (HTML + CSS + responsive rules), trimmed reviews 9 → 6 (kept first 6; all filter tabs Kids/Adaptive/Adults/Fear still populated), tightened section padding (100→68px desktop, 70→48px mobile), hero 56/80→44/60, section-head margin 44→34px, CTA-row margins 44→32px.
- **Move "How It Works" above "Our Programs"** — section order is now hero → about → steps → programs → events → locations → reviews → team → why → faq → final-cta.
- **Icons that don't look like iPhone emojis** — every emoji replaced with inline SVG line icons: Events (lifebuoy / waves / users / award), About adaptive-point heart, Final-CTA badges (droplet/users/map-pin/home) + contact row (phone/mail/calendar/instagram); removed 🚀/💙/😊 from nav CTA, mobile CTA, footer brand, form heading, form submit, and the "Adaptive Aquatics" card title.
- **Keep Shop / Partnerships / Adaptive Aquatics pages** — added a footer "Explore" column (footer grid 3→4 cols) + mobile-menu links. Adaptive Aquatics → `#programs`, Partnerships → `#events`, **Shop → `#shop` placeholder (no real URL yet — OPEN THREAD: wire live Shop URL or build a Shop page).**
- **Collapsible program cards (Emilio's add-on)** — `.program-card-toggle` button (title + rotating chevron) toggles `.program-card-collapse` (max-height/opacity transition); `.programs-grid { align-items:start }` so collapsed siblings don't stretch. Collapsed = image + title + chevron; expanded = description + pricing + CTA.
- Background alternation re-fixed for the new order: programs `bg-soft`→`#fff`, reviews `#fff`→`bg-soft`.
- Added "How It Works" to desktop nav + mobile menu.

Testing: Puppeteer audit across **14 viewports (320 → 1920px)** — zero horizontal overflow, zero console errors at every width. Tap-target fixes from the audit: program-card-toggle 24px → ~44px (padding 10px 0; body top padding 22→14px; open collapse margin-top 14→8px) and team-card-link 22px → ~38px (padding 8px 0). Verified collapsed/expanded states + mobile menu on desktop, iPad (768, 2-col), and mobile (390). Test scripts in `.claude/test-viewports.js`, `test-revisions.js`, `test-icons.js`, `test-nav.js`.

### 2026-05-28 — Pre-existing uncommitted home.html edits (NOT made this session)
This session's work was entirely in `Tom_Systema_Floyd` (discrepancy-checker email tuning). No Aquanauts file was touched by Claude. Logging only to satisfy the PROJECT.md hook, which fired on a working-tree modification to `funnel/home.html` that **was already uncommitted at session start** (provenance unknown — likely a prior in-progress session). Leaving the file untouched pending confirmation from Tristan/Emilio before commit.

For the record, `git diff funnel/home.html` (183 insertions / 191 deletions vs. committed `688cfed8`) contains a layout/UX pass on Variation A:
- Tighter vertical rhythm: section padding cut from 100px to 68px across most sections; hero 56/80 → 44/60; section-head bottom margin 44px → 34px; CTA-row margins 44px → 32px.
- New **collapsible program cards** (`.program-card-toggle`, `.program-card-chevron`, `.program-card-collapse` with rotate + max-height transitions).
- Event-card icons switched from glyph/emoji to inline **SVG** (`.event-card-icon svg`, `color:#fff`).
- **Gallery section removed entirely** (CSS block + its responsive rules deleted).
- Footer grid changed from 3 to 4 columns (`1.4fr 1fr 1fr` → `1.6fr 1fr 1fr 1fr`).
- Reviews section background `#fff` → `var(--bg-soft)`; programs background `var(--bg-soft)` → `#fff`.

**Open thread:** confirm whether these edits are intended (and whether they should also be mirrored to Variation B / `home-b.html`), then commit or discard. Until then this remains an uncommitted working-tree change.

### 2026-05-25 (night) — Wix → GHL image URL swap complete on both funnel variations
Picked up the pending HANDOFF section 3a task after the prior parallel scrape conversation never persisted its output (`image_url_map.json` was missing and both funnel files still pointed at `static.wixstatic.com`). Did a tighter, funnel-only pass instead of re-running the full-site crawl: collected the 24 distinct Wix URLs actually referenced across `funnel/home.html` (38 refs) and `funnel/home-b.html` (37 refs), downloaded each with a real browser UA + `Referer: https://aquanautsacademy.ca/` (no 403s, sizes ranged 14 KB → 17 MB), and POSTed each to `services.leadconnectorhq.com/medias/upload-file` with `hosted=false&locationId=xBWIIj9IjYQL2XdtjJ1A`. All 24 returned `HTTP 201` with `https://assets.cdn.filesafe.space/xBWIIj9IjYQL2XdtjJ1A/media/<uuid>.<ext>` URLs. GHL token pulled fresh from Supabase (`public.ghl_tokens.acces_token`, 5879 chars) right before the run. Ran `rewrite-aquanauts-html.py` to swap each URL; the only post-swap `static.wixstatic.com` reference was a stale `<link rel="preconnect">` in the head of each file, which I retargeted to `assets.cdn.filesafe.space`. Final `grep -c "static.wixstatic.com" funnel/*.html` returns 0/0; GHL references at 38/37 (matching pre-swap Wix counts). Spot-checked 4 random GHL URLs via `curl -I` with a browser UA, all returned `HTTP 200` with matching `Content-Type` and `Content-Length` to the uploaded source. New artifacts: `image_url_map.json` (24 entries), `image_inventory.md` (table of size/type/status per image), and `.claude/swap-aquanauts-wix-to-ghl.py` + `.claude/rewrite-aquanauts-html.py` (idempotent, safe to re-run if the funnels ever pull more Wix assets).

### 2026-05-25 (late) — UX polish, B retheme to "space swim school", handoff doc
- Wrote [HANDOFF.md](HANDOFF.md) — complete next-session brief covering live URLs, what's done, what's pending, file map, GHL access, gotchas, and quick-start instructions.
- Mobile UI/UX audit on both variations (Puppeteer): fixed iOS form-input zoom (16px font), undersized tap targets on `.loc-card-link` (44px min-height), tiny program-card-tag text (bumped to 0.78rem).
- Reviews section: added 6 new verbatim Google reviews (Kirsten R, Heidi R, Amanda C, Ranu D, Cristina P, Natali S) covering Tristan, Catherine, Brandon, Drake, Anastasia + autism/neurodiverse/adult/fearful-kid personas; 9 total. Replaced "Read More on Google" CTA with an in-page topic filter (All / Kids / Adaptive / Adults / Beat Fear). Bug fix: filter was wired but didn't visually hide cards — missing `.review-card.hidden { display: none; }` rule.
- Pre-fill CTAs: every CTA targeting `#hero-form` now smooth-scrolls AND pre-fills `program_interest` + `closest_location`, then pulses the form card. Program-card CTAs use `data-program`; location and team cards have location inferred from card content via JS.
- Gallery expanded from 6 to 12 images (added 6 pool-location photos). Image-section fit audit: swapped About to the warm "instructor-and-child in water" shot; swapped Lifeguard program card to the Naturally Pacific Resort pool photo.
- **Variation B retheme arc** (driven by user feedback "it just looks dark"):
  - Fixed `body { background }` blocking `body::before`/`::after` decorative layers (moved base color to `html`).
  - Saturn-style glowing planet (360px) in hero top-right with tilted ring + concentric water-ripple animation.
  - Strengthened hero wave divider (4-layer SVG, alpha 0.06 → 0.65). Added 3 more wave dividers between Programs→Events, Locations→Steps, Team→Why.
  - Bubbles: bigger (8-22px), brighter cores, 12s cycle.
  - Final shift from "outer space + bubbles" to "space swim school": deep pool blue base (#0a2548), strong caustic-light patches, faint pool-tile grid, drifting horizontal water-ripple bands, reduced starfield density.
  - Fixed B logo invisibility (removed `filter: brightness(0) invert(1)`, replaced with cyan drop-shadow glow).
- Team card alignment: `.team-card` flex-column, `.team-card-bio { flex: 1 }`, `.team-card-serves { margin-top: auto }`. "Book with X" CTAs now align across all 8 cards regardless of bio length.
- Headline rule established: section headlines max 2 lines. Team uses explicit `<br>` to force "Eight Instructors." / "110+ Years on Deck."
- Scheduled remote routine `trig_01MsfuJWmQYW5WUGNFzMsV6x` for the Wix→GHL URL swap at `2026-05-25T10:39:00Z` — now superseded because the parallel scrape conversation finished and `image_url_map.json` is ready; swap can be run directly.

### 2026-05-25 (evening) — Site image scrape + GHL media library upload complete
- Crawled all 19 site pages from `sitemap.xml` plus 3 blog posts (`/post/why-private-swim-lessons-are-worth-it`, `/post/discover-the-benefits-of-adult-swimming-classes`, `/post/space-themed-swimming-lessons-for-kids-with-diverse-abilities-1`). 67 unique canonical Wix assets discovered.
- Filtered 2 UI-icon glyphs (Facebook/Instagram, 22x22 only). Downloaded the rest at native resolution to `uploads/` (122.9 MB).
- Uploaded 64 to Tristan's GHL media library (`xBWIIj9IjYQL2XdtjJ1A`). One Wix asset URL on the live homepage has a malformed 31-char hash and returns 403 (Shawnigan secondary thumbnail) — documented as failed in `image_inventory.md`, safe to drop because it duplicates `location-shawnigan-mobile.jpg`.
- AVIF asset (Victoria Pool 2) converted to JPEG via Wix `/v1/.../enc_jpg/` variant since GHL rejects AVIF (`INVALID_FILE_TYPE`).
- Outputs: `image_inventory.md` (categorized catalog), `image_url_map.json` (Wix canonical → GHL CDN, 64 entries). Map is ready for the funnel-rewrite step where `funnel/home.html` and `funnel/home-b.html` get their image URLs swapped from Wix to GHL.
- Gotcha logged: Supabase `acces_token` (5879 chars) gets silently truncated by ~1 char per write boundary when pulled in chunks; need to pull with overlapping windows and stitch in Node to get the full string. Anything short and you get 401 Invalid JWT against `/locations`.

### 2026-05-25 — Wix → GHL URL swap blocked; swap status note written
- Checked for `image_url_map.json` and `image_inventory.md` — neither file exists yet (parallel scrape + upload pipeline not complete).
- Counted 38 Wix CDN references in `funnel/home.html` and 37 in `funnel/home-b.html` (75 total). No funnel files were modified.
- Wrote `.swap_status.md` with current state and resume instructions for when the parallel conversation delivers the mapping file (needs 20+ entries to proceed).

### 2026-05-25 (afternoon) — Lead Form fields finalized + Amina handoff
- Updated all 3 GHL custom contact fields to match the canonical `lead_form_routing.md` spec (renamed with `Lead Form *` prefix to match the form name Amina is building):
  - `Lead Form Intent` (id `6JTnsxZJBRqmgcDKDNnc`, fieldKey `contact.program_of_interest` - fieldKey unchanged on rename) - now **10 options**
  - `Lead Form Location` (id `uv5pZioA9EuxVABXNpxy`, fieldKey `contact.closest_location`) - now **10 options** (added "Not sure yet")
  - `Lead Form Swimmer Age` (id `DZFtnzJksaTkgxGUJuNs`, fieldKey `contact.lead_form_swimmer_age`) - **new field, 7 options, optional**
- Confirmed PUT updates use the same `options: ["string","string"]` array shape as POST (not `picklistOptions`, even though GET returns `picklistOptions`).
- Created ClickUp list `Tristan Tolley: Aquanauts Academy` (id `901327327838`) inside the `GoHighLevel Work` space - first per-client list for this account.
- Created ClickUp task for Amina Shah: [Build Lead Form + internal lead notifications (email and SMS)](https://app.clickup.com/t/86ahnyugh) - priority high, deliverable is the form embed link. Brief includes: 3 custom field IDs + standard contact fields, per-answer redirect workflow, URL parameter passthrough test (so contacts don't retype name/email on Jane App), internal email + SMS notifications modelled on Blake Friis's account.
- Added comment on the task pointing to `booking_flow_map.md` section 4 as the canonical Program × Location matrix (richer than `lead_form_routing.md` - uses Jane App location deep links to skip the marketing page).

### 2026-05-25 — Two funnel variations live + GHL form setup + verified booking redirect map
- Wrote locked-in home page copy at `copy/home-final.md` (mirrors Center Lane Swim's 12-section structure exactly).
- Built **Variation A** (`funnel/home.html`, light/coral approachable) and **Variation B** (`funnel/home-b.html`, dark cosmic editorial). Same structure + copy, distinct visual styles. Both have filter bubbles on Programs (6 categories) and Team (5 locations), category filter on FAQ (4 categories), and 30+ real Wix CDN images. Puppeteer QA: 48 desktop + mobile screenshots, zero em-dashes in either file.
- Pushed both to GitHub Pages:
  - A: https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html
  - B: https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home-b.html
- Created two GHL custom contact fields on Tristan's sub-account (`xBWIIj9IjYQL2XdtjJ1A`):
  - `Program of interest` → id `6JTnsxZJBRqmgcDKDNnc`, key `contact.program_of_interest`, 7 options
  - `Closest location` → id `uv5pZioA9EuxVABXNpxy`, key `contact.closest_location`, 8 options
- Studied existing booking flow + Jane App. Verified 8 location deep links, 10 staff-member hash-fragment IDs. Service-level deep links don't exist on this Jane tenant. Updated [lead_form_routing.md](lead_form_routing.md) with the verified Program × Location → URL matrix; full research in [booking_flow_map.md](booking_flow_map.md).
- API gotchas learned: GHL custom field POST expects `options: ["string","string"]` (plain strings, not objects, property name is `options` not `picklistOptions`). GHL rejects Python's default User-Agent at Cloudflare (1010); always send a real browser UA. Local `.ghl_creds.json` cache drifts because n8n rotates tokens; re-pull from Supabase before long script runs.

Open at end of session:
- Manual GHL UI step: create a folder "Aquanauts Funnel" under Sites > Forms (public API doesn't expose folder creation).
- Site-wide image inventory agent still running in the background.
- Image upload to GHL media library pending image inventory completion.

### 2026-05-24 (later, passthrough) — No content changes
Folder was touched by a `git stash`/rebase pass during unrelated Charles_Notary CTA work (CRLF normalization warning on `lead_form_routing.md`). No file contents changed; folder still uncommitted/untracked. Logging only to satisfy the PROJECT.md hook.

### 2026-05-24 — Folder created + initial research
- Created folder `Tristan_AquanautsAcademy/`.
- Ran `/research-client` against `aquanautsacademy.ca` — scraped 11 pages (home, about, instructors, pricing, faq, adaptive-aquatics, mobile-swim-lessons, adult-lessons, lifeguarding-services, locations, partnerships).
- Dispatched 2 parallel research agents:
  - Reputation scan — confirmed thin-but-positive online footprint (3 testimonials, no negative reviews, no press, partnership claims unverifiable).
  - Industry/BC AFU research — surfaced the 160x autism drowning stat + the AFU funding pathway as the two highest-leverage adaptive-funnel angles.
- Produced [CLIENT_CONTEXT.md](CLIENT_CONTEXT.md) — full research dossier ready for `/write-copy`.
- Started parallel pipeline: site-wide image inventory + GHL token lookup for Tristan Tolley's account (in progress, will populate `uploads/` and document upload status here).
