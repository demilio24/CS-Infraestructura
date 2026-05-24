# Aquanauts — Lead Form Routing Map

The new funnel will have a Center Lane style embedded GHL form in the hero. After submit, route the visitor to the right destination page on the existing Aquanauts site (or a future dedicated landing page).

This file is the single source of truth for the form's redirect logic. Pair it with the GHL form builder: each "Interested in…" or "Location" answer maps to a Custom Redirect URL on form submit (GHL supports per-answer redirects via workflow).

---

## Primary intent → destination

The first form field is "What are you looking for?". One required selection. Each option maps to one redirect.

| Form option (visitor sees) | Audience | Redirect URL |
|---|---|---|
| Private swim lessons for my child | General | https://www.aquanautsacademy.ca/swim-lessons |
| Private swim lessons for my child with autism, ADHD, or sensory needs | Adaptive | https://www.aquanautsacademy.ca/adaptive-aquatics |
| Swim lessons for me (adult) | Adult | https://www.aquanautsacademy.ca/private-swim-lessons-for-adults |
| Mobile lessons at my private pool | General + Premium | https://www.aquanautsacademy.ca/mobile-swim-lessons |
| Lifeguard for a private event or facility | B2B | https://www.aquanautsacademy.ca/lifeguarding-services |
| Aquayoga (gentle in-water yoga) | Adult wellness | https://www.aquanautsacademy.ca/aquayoga |
| Pool host (rent my pool to Aquanauts) | B2B | https://www.aquanautsacademy.ca/pool-hosts |
| Partnership for our school or organization | B2B | https://www.aquanautsacademy.ca/partnerships |
| Sponsorship for a swimmer or family | B2B | https://www.aquanautsacademy.ca/sponsorship |
| Just exploring, talk to me first | All | https://aquanautsacademy.janeapp.com/ (free assessment booking flow) |

---

## Secondary field — Location

Captured for instructor matching, but does NOT change the redirect URL. Used downstream by the workflow to route the contact to the right instructor's pipeline in GHL.

| Form option | Maps to instructor(s) |
|---|---|
| Nanaimo (Central) | Donna, Tristan, Brandon, Sage |
| Nanoose Bay (Pacific Shores Resort) | Tristan, Brandon, Sage, Erica |
| Parksville (Oceanside Manor) | Tristan, Brandon, Sage, Erica, Maurya (fall + winter) |
| Victoria (near Hillside Mall) | Drake McKay |
| Shawnigan Lake (summer mobile) | Drake, Tristan |
| Campbell River — Ramada by Wyndham | Catherine May |
| Campbell River — Naturally Pacific Resort | Catherine May |
| Port Alberni (seasonal) | Maurya (summer) |
| Mobile / in-home pool | Mobile-capable instructors only |
| Not sure yet, recommend one | Default routing: Tristan or central scheduler |

---

## Tertiary field — Swimmer age (optional, for matching only)

| Bucket | Note |
|---|---|
| 6-18 months (Infant Survival) | Tristan specializes |
| 2-4 years | Most instructors |
| 5-12 years | All instructors |
| 13-18 years | Drake, Catherine, Tristan |
| Adult (18+) | Sage, Drake, Donna, Erica, Maurya |
| Adult 55+ | Maurya, Catherine |
| Adaptive (any age) | Catherine, Brandon, Maurya, Tristan |

---

## Hidden / contact fields

Standard GHL fields on the form:
- First name (required)
- Last name (required)
- Email (required)
- Phone (required)
- Source = "Funnel — Home Hero" (hidden, hardcoded)
- UTM campaign / source / medium (hidden, captured from URL)

---

## Per-redirect post-submit experience

Each destination page should auto-scroll to or surface its own booking CTA so the visitor's next action is one click away.

| Destination | Recommended post-submit CTA on landing |
|---|---|
| /swim-lessons | "Book a Private Lesson" → Jane App |
| /adaptive-aquatics | "Book Your Free 30-Min Assessment" → Jane App |
| /private-swim-lessons-for-adults | "Book Your First Adult Lesson" → Jane App |
| /mobile-swim-lessons | "Check Mobile Availability in My Area" → contact form |
| /lifeguarding-services | "Get a Quote for My Event" → contact form |
| /aquayoga | "Reserve a Spot" → Jane App |
| /pool-hosts | "Apply to Host Aquanauts at My Pool" → contact form |
| /partnerships | "Schedule a Partnership Call" → calendar embed |
| /sponsorship | "Apply for Sponsorship" → contact form |
| Jane App fallback | Open assessment-type booking screen |

---

## Why this works

- One form, one submission, immediate routing. No second screen.
- The destination page is already a fully-built brand-aligned page on the existing site, so we are not waiting on new content for V1.
- Contact + UTM still flow into GHL for follow-up, regardless of where the visitor lands next.
- When we eventually build dedicated post-submit landing pages (e.g. a custom "Thanks, here is what happens next" page per program), we just swap the redirect URL. The form logic stays identical.

---

## Open questions for Tristan before go-live

1. Confirm `/aquayoga`, `/pool-hosts`, `/sponsorship` are still live and current. If any are deprecated, route to `/contact-2` instead.
2. Confirm Jane App booking flow can accept a deep link with a service type pre-selected (e.g. `?service=assessment`). If yes, use those deep links in the redirect URLs instead of the generic Jane root.
3. Decide whether "Just exploring" should land on Jane App (action-oriented) or on `/about` (story-first). Default in this map is Jane.
4. Confirm we want location captured at the form stage (vs. on the destination page). Capturing here speeds up instructor matching but adds a field. Default in this map is YES, captured here.

---

## Content archive reference

All page content used to build this routing map is already scraped verbatim in:
- [copy_archive.md](copy_archive.md) — 1,325 lines, 25+ pages, including all blog posts.
- [CLIENT_CONTEXT.md](CLIENT_CONTEXT.md) — structured research dossier.

If a new page is published on the live Aquanauts site, add it to the routing table here and rerun the scrape.
