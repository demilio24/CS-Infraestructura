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

1. **GHL sub-account confirmation** — looking up Tristan Tolley's locationId + `acces_token` from `public.ghl_tokens` in Supabase (`nroeiabeirifurdaybyo`).
2. **Site image scrape + upload to GHL media library** — in progress, parallelized into agents 2026-05-24.
3. **Verify all `/partnerships` claims** with Tristan before reusing on a funnel: SELF DESIGN, NIDES, HCOS, Island ConnectEd, Superhero Swim University, inSpace Childcare, Katies Korner, Balance Physio, Long Lake Physio, Splash About, Autism Support BC, Special Olympics BC.
4. **Google Business Profile** — claimed? Total reviews + stars? Currently only 3 named testimonials exist anywhere online; a review-collection workflow is priority #1 for social proof.
5. **AFU registration** — is Aquanauts a registered AFU provider, or are clients paying-and-claiming? Affects how we phrase pricing on the adaptive page.
6. **Founder photo + last-name licence** — confirm Tristan is comfortable publishing the personal story (father's death) + a headshot on a conversion page.
7. **Video assets** — none exist. A 60-90s founder story video is the highest-ROI single asset he could produce.

## Changelog

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
