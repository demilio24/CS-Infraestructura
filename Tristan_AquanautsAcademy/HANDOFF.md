# Aquanauts Swim Academy — Handoff

_Last updated: 2026-05-25_

A complete picture of where the Tristan Tolley / Aquanauts Swim Academy build sits today, so any future Claude session (or human teammate) can pick up without archaeology. Read this top to bottom, then dip into the linked docs only as needed.

---

## 1. Live URLs

Two HTML funnel variations are pushed to GitHub Pages and embedded into GHL via the standard iframe wrapper from `~/.claude/CLAUDE.md`:

| Variation | Style | URL |
|---|---|---|
| **A** | Light / coral / approachable | https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html |
| **B** | Deep pool / space accents (astronaut training in an underwater pool) | https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home-b.html |

Both render the same 12 sections in the same order (mirroring Center Lane Swim's home page). Same copy. Different visual treatment.

GitHub Pages typically takes 1-2 minutes to redeploy after a push.

---

## 2. What's done

### Research + content
- **`CLIENT_CONTEXT.md`** - full client research dossier (business overview, pricing, team, voice, pain points, BC AFU funding, sources)
- **`copy_archive.md`** - 1,325 lines verbatim site copy across 25+ pages of aquanautsacademy.ca + 3 blog posts + external review scan
- **`copy/home.md`** - draft copy with 3 variations per section
- **`copy/home-final.md`** - locked-in copy hand-off doc

### Funnel HTML (both variations)
- 12 sections: Nav, Hero, About, Programs, Events, Locations, Steps, Reviews, Gallery, Team, Why, FAQ, Final CTA, Footer
- 9 verbatim Google Reviews (Erin M, Andrew B, Melissa S + Kirsten R, Heidi R, Amanda C, Ranu D, Cristina P, Natali S)
- 12 gallery images, 8 location photos, 8 instructor headshots, hero + about + service section imagery — all sourced from the client's Wix CDN
- Filter bubbles on Programs (6 categories), Team (5 locations), FAQ (4 categories), Reviews (5 topic filters)
- Hero placeholder lead form with the right field set: First name, Last name, Email, Phone, Program of interest, Closest location
- **Per-CTA pre-fill**: clicking any program-card "Book X" link or any location/team "Book here" link smooth-scrolls to the hero form and pre-fills `program_interest` and `closest_location` (inferred from card context). The form card pulses to confirm.
- Mobile responsive (audited via Puppeteer, screenshots in `.claude/screenshots/aquanauts/`)

### Variation B's "space-swim-school" visual layer
- Deep pool blue base (`#0a2548`) instead of dark space navy
- Underwater perspective gradient (cyan glow at top fading to deep blue at bottom — like looking up from underwater)
- 4 visible caustic-light patches across the page (sunlight refracting through water)
- Faint pool-tile grid texture (80px squares, masked at edges)
- Drifting horizontal water-ripple bands (18s cycle)
- Big rising pool bubbles (up to 22px, 12s cycle, white cores fading to cyan)
- Saturn-style planet (360px) glowing in the hero top-right corner with concentric water ripples
- Multi-layer ocean wave SVG dividers between Hero→About, Programs→Events, Locations→Steps, Team→Why
- Reduced starfield density so stars now read as "tiny lights visible above the water" rather than "outer space"
- Editorial Fraunces serif headlines vs Variation A's Outfit sans

### GHL setup
- Two custom contact fields created on Tristan Tolley's sub-account (locationId `xBWIIj9IjYQL2XdtjJ1A`):
  - **Program of interest** — id `6JTnsxZJBRqmgcDKDNnc`, key `contact.program_of_interest`, 7 options
  - **Closest location** — id `uv5pZioA9EuxVABXNpxy`, key `contact.closest_location`, 8 options
- Field option values match the funnel form's `<select>` values exactly so the GHL form embed can be a 1:1 swap

### Verified post-submit redirect map
Studied the existing booking flow (full notes in **`booking_flow_map.md`**). Findings:
- Jane App exposes 8 location-specific deep links (all verified HTTP 200)
- Staff deep links exist as hash fragments (`#/staff_member/{id}`) — 10 instructor IDs harvested
- Service-level deep links DO NOT exist on this Jane tenant (visitor still picks duration on the booking widget)
- Existing site CTAs all point to Jane root with zero segmentation — our funnel closes that conversion gap

The verified Program × Location → Jane URL matrix is in **`lead_form_routing.md`**.

### GHL Workflow spec
**`ghl_workflow_spec.md`** lays out the post-submit GHL Workflow:
- Trigger config (Form Submitted)
- 5-branch IF/ELSE on `program_interest` (adaptive, lifeguard, "not sure", mobile, location-aware private/family/adult)
- Sub-branching on `closest_location` for the 3 location-sensitive programs
- Internal notification email template with merge tags
- Auto-reply SMS template
- Pipeline + tag config
- Testing checklist

### ClickUp coordination
- The form build is tracked at https://app.clickup.com/t/86ahnyugh ("Build Lead Form + internal lead notifications") assigned to Amina Shah
- A comment on that task references the funnel as the visual spec and pastes the GHL custom field IDs

---

## 3. What's pending

Three open items, in priority order:

### a) Image scrape + GHL media library upload (running in a separate Claude conversation)
- The user opened a fresh Claude Code conversation to download every Wix CDN image used in the funnel and upload it to Tristan's GHL media library
- That conversation is producing two files in this folder when done:
  - `image_inventory.md` — full deduplicated image list
  - `image_url_map.json` — `{ <wix_url>: <ghl_url> }` mapping
- A **one-time scheduled remote agent** (routine `trig_01MsfuJWmQYW5WUGNFzMsV6x`) was set to fire at `2026-05-25T10:39:00Z` UTC to auto-swap the URLs in both funnel files. If you're reading this after that time, check the most recent commits — the swap may already be done. If not, see "How to resume" below.

### b) Manual GHL UI step: create the "Aquanauts Funnel" folder
The GHL public API does NOT expose form-folder creation. Someone needs to log into Tristan's GHL sub-account, go to **Sites → Forms**, and create a folder named "Aquanauts Funnel". 10 seconds of clicking. The form Amina is building goes inside it.

### c) Swap the placeholder form embed for the real GHL form (once Amina ships it)
The hero right column currently has a styled placeholder `<form>` so the visual landing-pad is correct. Once Amina has the GHL form built:
1. Get the form ID from her (or pull it via GHL API)
2. Replace the inner `<form>` block in `funnel/home.html` and `funnel/home-b.html` with the GHL iframe embed
3. Detailed swap steps are in `ghl_workflow_spec.md` under "After the form is built"

---

## 4. File map

```
Tristan_AquanautsAcademy/
├── PROJECT.md                  ← living project doc (this folder's source of truth)
├── HANDOFF.md                  ← this file
├── CLIENT_CONTEXT.md           ← full research dossier
├── copy_archive.md             ← 1,325-line verbatim site scrape
├── booking_flow_map.md         ← Jane App deep-link research
├── lead_form_routing.md        ← verified Program × Location → URL matrix
├── ghl_workflow_spec.md        ← post-submit Workflow spec
├── copy/
│   ├── home.md                 ← copy draft (3 variations per section)
│   └── home-final.md           ← locked-in copy
├── funnel/
│   ├── home.html               ← Variation A (light/coral)
│   └── home-b.html             ← Variation B (deep pool + space accents)
├── uploads/                    ← downloaded image binaries (gitignored)
├── .ghl_creds.json             ← GHL access token cache (gitignored)
├── .ghl_form_setup.json        ← record of created custom fields (gitignored)
├── image_inventory.md          ← (pending) deduplicated image list
└── image_url_map.json          ← (pending) Wix → GHL URL mapping
```

## 5. How to resume each pending item

### To check / finish the URL swap
1. `git pull` — confirm you have the latest
2. Check whether `image_url_map.json` exists in this folder and contains 20+ mappings
3. Check whether `funnel/home.html` and `funnel/home-b.html` still reference `static.wixstatic.com`:
   ```bash
   grep -c "static.wixstatic.com" Tristan_AquanautsAcademy/funnel/*.html
   ```
   If the count is 0, swap is done. If non-zero, run a small replace script that loads `image_url_map.json` and rewrites both files.
4. Verify a few of the new GHL CDN URLs return 200 with a real browser User-Agent (`Mozilla/5.0...`)
5. Commit + push

### To wire the real GHL form
1. Get the GHL form ID from Amina (or list forms via GHL API: `GET https://services.leadconnectorhq.com/forms?locationId=xBWIIj9IjYQL2XdtjJ1A`)
2. In both `funnel/home.html` and `funnel/home-b.html`, find `<div id="ghl-form-placeholder">` and replace its contents with the GHL iframe embed (template in `ghl_workflow_spec.md`)
3. Re-screenshot both variations to verify the iframe sits well in the hero
4. Push

### To build the GHL Workflow
1. Confirm the form exists and the "Aquanauts Funnel" folder was created (manual step b above)
2. Go to GHL → Automation → Workflows → New
3. Follow the step-by-step spec in `ghl_workflow_spec.md`
4. Test by submitting the form with each (program × location) combination and confirming the redirect lands on the right Jane URL

---

## 6. GHL access (for future scripted work)

Credentials never live in this repo. Fresh access tokens are in Supabase:
- Project: `nroeiabeirifurdaybyo`
- Table: `public.ghl_tokens`
- Lookup: `WHERE "locationId" = 'xBWIIj9IjYQL2XdtjJ1A'`
- Token column is named `acces_token` (typo intentional, do NOT rename)
- n8n rotates the token periodically, so always re-pull from Supabase before a long script run

API base: `https://services.leadconnectorhq.com`
Required headers on every call:
```
Authorization: Bearer <acces_token>
Version: 2021-07-28
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36
```
(Cloudflare blocks Python's default User-Agent with HTTP 403 / error 1010. Always set a real browser UA.)

## 7. Known gotchas (debug breadcrumbs)

- **GHL custom-field POST shape:** the working request body uses `options: ["String1", "String2"]` (array of plain strings, NOT `{label, value}` objects, and the property is `options` NOT `picklistOptions` — docs disagree, the server is the source of truth).
- **JWT truncation:** long Bearer tokens can get truncated by certain write paths. After saving a token locally, verify `len(stored)` matches Supabase's `LENGTH(acces_token)` before using. If short, fetch the tail with `SUBSTRING(acces_token FROM N FOR M)` and concatenate.
- **B's `body { background: #color }` blocks `body::before/::after`:** keep the base color on `html` and let `body` be `transparent` so the pool gradient, caustic light, and drifting bubbles all render. This is why B looked "just dark" before the fix.
- **`body::after` z-index:** body::after is at `z-index: 0`. All `<section>` elements set `position: relative; z-index: 1;` so they sit ABOVE the bubble layer (otherwise the bubbles would render in front of section content).
- **Wave divider clipping:** every section hosting a wave-divider needs `overflow: hidden` set; otherwise the divider bleeds past the section boundary.
- **`.review-card.hidden` and similar:** filter cards rely on a `.hidden { display: none; }` rule per card type. Forgetting it means clicks toggle the class but nothing visually changes. All four card types (program, team, faq, review) have this rule now.
- **Headline rule:** section headlines must wrap to a maximum of 2 lines. The Team section uses an explicit `<br>` to force the break ("Eight Instructors." / "110+ Years on Deck.").

## 8. Tooling scripts in `.claude/`

Reusable Python scripts that produced the current build state. Idempotent — safe to re-run.
- `ghl-setup-aquanauts.py` — creates / verifies GHL custom fields
- `add-prefill-ctas.py` — injects per-card pre-fill CTAs and the JS handler
- `add-reviews-filter.py` — adds review filter bubbles + per-card tags
- `fix-b-space-water.py` — first-pass B theme fixes (body bg, logo, planet, bubbles)
- `add-more-water-effects.py` — caustic shimmer, extra wave dividers, planet ripples
- `make-b-space-pool.py` — final shift from "outer space" feel to "space swim school" feel

Plus screenshot scripts: `shot-aquanauts.js`, `shot-aquanauts-live-full.js`, `audit-aquanauts-mobile.js`, `shot-b-water.js`.

## 9. Stuff worth confirming with Tristan before launch

These are flagged in `CLIENT_CONTEXT.md` and `PROJECT.md` open threads:
- Verify all `/partnerships` page claims (SELF DESIGN, NIDES, HCOS, Island ConnectEd, Superhero Swim U, inSpace, Katies Korner, physio clinics, Autism Support BC, Special Olympics BC) — none of these are publicly verifiable via search
- Confirm Google Business Profile state (he has 129+ 5-star reviews — verify count, claim if not already)
- Confirm AFU registration status (is Aquanauts a registered AFU provider, or do clients pay-and-claim?)
- Get explicit OK to publish his father's-death origin story on a conversion page
- Decide whether to capture a 60-90s founder story video (highest-ROI single asset he could produce — none exists today)
- AquaYoga: confirm whether those leads should route to Tristan or directly to Katherine Winge's external site

## 10. Quick start for a fresh Claude session

If you're a fresh Claude opening this folder for the first time:

1. `cd F:\GitHub\Websites`
2. Read this file (HANDOFF.md), then `PROJECT.md`, then skim `CLIENT_CONTEXT.md` for the research voice
3. Open one of the two funnel files (`funnel/home.html`) and grep for `<section` to map the structure
4. If you need GHL access: query Supabase `public.ghl_tokens` (see section 6 above)
5. Don't reinvent — the tooling scripts in `.claude/` capture every transformation we've already run
