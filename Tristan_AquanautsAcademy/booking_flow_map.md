# Aquanauts Academy — Booking Flow Map

Research date: 2026-05-25
Purpose: Map the existing Aquanauts Academy booking flow so the new funnel's lead form can redirect each submitter to the highest-converting destination (a Jane App deep link where possible, a content page otherwise).

---

## 1. Existing site — CTA inventory

Every "Book Now" / "Hire Now" CTA across the site points to the same Jane App root (`https://aquanautsacademy.janeapp.com/`) or to `/book-online` (which itself is a Jane App wrapper page).

| Source page | CTA text | Destination |
|---|---|---|
| `/` (home) | BOOK NOW (x2) | https://aquanautsacademy.janeapp.com/ |
| `/swim-lessons` | BOOK NOW (x2) | https://aquanautsacademy.janeapp.com/ |
| `/private-swim-lessons-for-adults` | BOOK NOW (x3) | https://aquanautsacademy.janeapp.com/ |
| `/mobile-swim-lessons` | BOOK NOW (x3) | https://aquanautsacademy.janeapp.com/ |
| `/adaptive-aquatics` | BOOK NOW, BOOK ONLINE | https://aquanautsacademy.janeapp.com/ , /book-online |
| `/lifeguarding-services` | HIRE NOW, BOOK NOW | https://aquanautsacademy.janeapp.com/ |
| `/aquayoga` | BOOK NOW (AquaYoga-specific) | https://www.katherinewinge.com/ (third-party Katherine Winge site) |
| `/pricing` | BOOK NOW (per tier) | https://aquanautsacademy.janeapp.com/ (no per-tier segmentation) |
| `/our-instructors` | BOOK NOW | https://aquanautsacademy.janeapp.com/ (no per-instructor segmentation) |
| `/locations` | BOOK NOW (per location) | https://aquanautsacademy.janeapp.com/ (no per-location segmentation) |
| `/about`, `/faq`, `/partnerships`, `/pool-hosts`, `/contact-2` | BOOK NOW / Contact Now | https://aquanautsacademy.janeapp.com/ , /contact-2 |

Key finding: Tristan's marketing site CTAs do not segment by location, instructor, or service. Everything funnels into the Jane App root and forces the visitor to re-select. AquaYoga is the only exception, routing externally to Katherine Winge's own site.

## 2. Jane App — what deep links actually exist

Jane App exposes two stable deep-link patterns on this tenant:

### A. Location-level booking pages (confirmed, 8 locations)

| Location | Deep link |
|---|---|
| Nanaimo (South) | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Nanaimo (Central) | https://aquanautsacademy.janeapp.com/locations/nanaimo-central-location/book |
| Nanoose Bay — Pacific Shores Resort | https://aquanautsacademy.janeapp.com/locations/nanoose-bay-pacific-shores-resort-and-spa/book |
| Parksville — Private Indoor Pool | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Victoria — Private Indoor Pool | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Shawnigan Lake — Private Outdoor Pool | https://aquanautsacademy.janeapp.com/locations/shawnigan-lake-location-private-outdoor-pool/book |
| Campbell River — Naturally Pacific Resort | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Mobile / Vancouver Island | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |

### B. Staff-member deep links (confirmed, hash-fragment based)

Pattern: `https://aquanautsacademy.janeapp.com/locations/{location-slug}/book#/staff_member/{id}`

Staff IDs observed on `/our-instructors` and on each location page:

| Instructor | Staff ID | Locations where bookable |
|---|---|---|
| Tristan Tolley | 1 | Nanaimo South, Nanaimo Central, Nanoose, Parksville, Shawnigan, Mobile |
| Drake Mckay | 3 | Victoria, Mobile |
| Brandon Tolley | 7 | Nanaimo South, Nanaimo Central |
| Catherine May | 8 | Campbell River |
| Donna Underwood | 14 | Nanaimo Central |
| Anastasia Musaji | 20 | Victoria, Mobile |
| Sandy Dowell | 21 | Victoria |
| Talia Nicholson | 22 | Victoria, Mobile |
| Glenn Mathieson | 23 | Mobile |
| Kesya LeCoz | 27 | Nanoose, Parksville |

Example fully-formed staff deep link (Tristan, Nanaimo South, 60-min lesson chosen on the next screen):
`https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book#/staff_member/1`

### C. Service / discipline / treatment deep links — DO NOT EXIST

Jane App for this tenant does not surface discipline or treatment URLs (no `/discipline/X/treatment/Y` paths). The service list is rendered client-side from the booking widget and is not addressable by URL. A visitor selecting "60-min private lesson" must do so after landing on a location or staff page. This is a Jane App configuration choice, not a missing feature on Tristan's end.

## 3. Existing forms on the site

`/contact-2` has a basic native contact form (First Name, Last Name, Email, Phone, Message, Select an Address dropdown). Success state is the inline message "Thank you for submitting!" with no redirect. No GHL embeds or iframes are present anywhere on the marketing site — Jane App is the sole booking conversion path.

## 4. Recommended redirect map for the new funnel

The new funnel's hero form collects Program of interest + Closest location. Below is the routing matrix. Where a Jane location deep link exists we use it (drops the user one click closer to checkout than the current site does). Where the program is best explained before booking (Adaptive, Lifeguarding, AquaYoga) we route to the content page first.

| Program selected | Location selected | Recommended redirect URL |
|---|---|---|
| Private 1:1 lessons (kids) | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Private 1:1 lessons (kids) | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Private 1:1 lessons (kids) | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Private 1:1 lessons (kids) | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Private 1:1 lessons (kids) | Mobile / other | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Adult private lessons | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Adult private lessons | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Adult private lessons | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Adult private lessons | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Adult private lessons | Mobile / other | https://www.aquanautsacademy.ca/private-swim-lessons-for-adults |
| Semi-private / family | Nanaimo | https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book |
| Semi-private / family | Nanoose / Parksville | https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book |
| Semi-private / family | Victoria | https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book |
| Semi-private / family | Campbell River | https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book |
| Semi-private / family | Mobile / other | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Mobile (at your pool) | Any | https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book |
| Adaptive aquatics | Any | https://www.aquanautsacademy.ca/adaptive-aquatics (content page first; CTA there goes to Jane) |
| Lifeguarding services | Any | https://www.aquanautsacademy.ca/lifeguarding-services (quote/hire requires context) |
| AquaYoga | Any | https://www.katherinewinge.com/ (external — operated by Katherine Winge) |

Rationale on the two non-Jane fallbacks: Adaptive Aquatics requires an intake conversation (assessment-first), and Lifeguarding is a B2B service quote, not a self-serve booking — sending those leads straight to Jane wastes the warmest moment of intent.

## 5. What is missing / recommendations to Tristan

1. **No per-service deep links.** Jane App on this account does not surface URLs for "60-min private" vs "30-min trial" vs "semi-private". The visitor still has to pick the duration on the Jane screen. This is a Jane setting we can ask Tristan to enable (Jane "Online Booking" -> Disciplines/Treatments link visibility), but it is not blocking.
2. **No per-instructor CTAs anywhere on the marketing site.** `/our-instructors` lists everyone but every "Book Now" routes to Jane root. We could recommend Tristan add per-instructor deep links using the `#/staff_member/{id}` pattern documented above — quick win, no Jane changes needed.
3. **No GHL embed presence on the existing site.** The new funnel will be the first GHL-hosted asset; we own the entire post-submit experience.
4. **AquaYoga lives on a separate brand (Katherine Winge).** If AquaYoga is in the funnel's program list, confirm with Tristan whether he wants those leads sent to Katherine's site or routed through his own intake first.
5. **Pricing page has no segmentation.** "Most popular" 60-min private at $110 is highlighted but the CTA is generic. Mention this when proposing the per-program deep-link upgrade.

## 6. Sources

- Sitemap index: `https://www.aquanautsacademy.ca/sitemap.xml` -> `pages-sitemap.xml` (19 URLs, all lastmod 2026-05-20)
- Marketing pages crawled: `/`, `/about`, `/our-instructors`, `/pricing`, `/faq`, `/locations`, `/swim-lessons`, `/private-swim-lessons-for-adults`, `/mobile-swim-lessons`, `/adaptive-aquatics`, `/lifeguarding-services`, `/contact-2`, `/aquayoga`, `/pool-hosts`, `/partnerships`
- Jane App root: `https://aquanautsacademy.janeapp.com/` (8 location deep links discovered here)
- Jane App location pages crawled: Nanaimo South, Nanaimo Central, Nanoose, Parksville, Victoria, Shawnigan Lake, Campbell River, Mobile (staff IDs harvested from each)
