# Aquanauts — Lead Form Routing Map

The new funnel has a Center Lane style embedded GHL form in the hero. After submit, route the visitor to the right destination using a Workflow with conditional `Custom Redirect URL` steps based on the contact's `program_interest` and `closest_location` answers.

**Verified against the live site + Jane App on 2026-05-25.** Per-location Jane App deep links DO exist and we should use them. Per-service and per-instructor deep links via URL do not exist as fully-qualified paths (instructor IDs work as hash fragments but the user still picks the service on the next screen). Full verification report and 10-instructor staff-ID table in [booking_flow_map.md](booking_flow_map.md).

---

## GHL custom field IDs (created 2026-05-25)

These are the field IDs the form writes into and the workflow reads from to decide the redirect:

| Field | Internal key | Field ID |
|---|---|---|
| Program of interest | `contact.program_of_interest` | `6JTnsxZJBRqmgcDKDNnc` |
| Closest location | `contact.closest_location` | `uv5pZioA9EuxVABXNpxy` |

---

## Primary redirect matrix (Program × Location)

For self-serve programs (Private 1:1, Family/Semi-Private, Adult, Mobile), route directly to the closest Jane App location deep link. For consultation-first programs (Adaptive, Lifeguarding) keep the content page in the loop so we don't burn warm intent on a self-serve booking flow.

| Program | Location | Redirect URL |
|---|---|---|
| Private 1:1 lessons | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Private 1:1 lessons | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Private 1:1 lessons | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Private 1:1 lessons | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Private 1:1 lessons | Shawnigan / Mobile / other | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Family or semi-private | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Family or semi-private | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Family or semi-private | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Family or semi-private | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Family or semi-private | Shawnigan / Mobile / other | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Adult lessons | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Adult lessons | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Adult lessons | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Adult lessons | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Adult lessons | Shawnigan / Mobile / other | https://www.aquanautsacademy.ca/private-swim-lessons-for-adults |
| Mobile (we come to you) | Any | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Adaptive aquatics | Any | https://www.aquanautsacademy.ca/adaptive-aquatics |
| Lifeguarding services | Any | https://www.aquanautsacademy.ca/lifeguarding-services |
| Not sure yet | Any | https://aquanautsacademy.janeapp.com/ |

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
