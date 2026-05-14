# Systema Floyd — New Forms Spec

> Build order per Tom's May 13 call: **1. Vladimir Seminar → 2. Private Lessons → 3. Birthday Parties**
> Additional forms surfaced in his May 5 email: **4. Rent-A-Sensei (Babysitting)** · **5. Balloons add-on** (lives inside Birthday Parties) · **6. Teen & Adult Classes** *(paused until next school year)*

All pricing below came from photos Tom sent on May 5 (OCR'd 2026-05-14 — see
`.claude/scratch/sf_pricing_imgs/`). The Birthday Party section is fields-only
because Tom never sent prices for it. The Vladimir Seminar section is shape-only
because he hasn't sent the existing page link yet.

Pricing syntax mirrors the camp Google Sheets so the billing dashboard parser
extracts amounts automatically:

| Pattern | Meaning | Example |
|---|---|---|
| `Label ($N)` | Flat price | `Standard Arch ($450)` |
| `Label ($N/unit)` | Per-unit price | `Pizza ($30/week)` · `1 Child ($25/hour)` |
| `Label (+$N)` | Add-on on top of base | `2 Students (+$25)` |
| `Label (+$N/unit)` | Per-unit add-on | `Each additional foot (+$30)` |

Florida sales tax (7%) applies to food/clothing line items only. Transaction
fee (3% flat) applies to the total at checkout.

---

## 1. Vladimir Seminar (Priority #1)

> Annual flagship weekend event in **September or October**. Tom said on
> April 24 that he already has an existing registration page; the link he
> said he'd send has not arrived. Until it does, the field layout below
> follows the Systema HQ weekend-seminar standard.

### Field list

| Field | Type | Notes |
|---|---|---|
| Student Name | TEXT | required |
| Date of Birth | DATE | required |
| Email Address | TEXT | required |
| Phone Number | PHONE | required |
| Emergency Contact Name | TEXT | required |
| Emergency Contact Phone | PHONE | required |
| Home School / Systema Affiliation | TEXT | optional |
| City + State | TEXT | optional — track who's traveling |
| Systema Experience Level | SINGLE_OPTIONS | None / Beginner (<1yr) / Intermediate (1-3yr) / Advanced (3+yr) / Instructor |
| Prior seminars with Vladimir Vasiliev | CHECKBOX | |
| Other martial arts background | LARGE_TEXT | |
| Registration Type | SINGLE_OPTIONS | `Full Weekend Pass ($ {weekend_price} /weekend)` · `Saturday Only ($ {sat_price} /day)` · `Sunday Only ($ {sun_price} /day)` · `Early Bird Full Weekend ($ {early_bird_price} /weekend)` |
| Event T-shirt | SINGLE_OPTIONS | `None` · `Small (+$ {shirt_price} )` · `Medium (+$ {shirt_price} )` · `Large (+$ {shirt_price} )` · `XL (+$ {shirt_price} )` · `XXL (+$ {shirt_xxl_price} )` |
| Medical conditions or injuries | LARGE_TEXT | |
| Allergies | LARGE_TEXT | |
| Liability waiver | SIGNATURE | use existing waiver Tom said Juliana would send |
| Photo/video release | CHECKBOX | |
| Notes | LARGE_TEXT | |

### Still needed from Tom
- Date(s) of the weekend
- Link to existing seminar page
- Existing waiver PDF/link
- All `{ }` prices
- Capacity cap

---

## 2. Private Lessons (Priority #2)

> Source: 3 photos sent May 5, titled "Systema Floyd – Private Lesson Booking
> Form Requirements." All pricing below is **as Tom wrote it**.

### A. State Selection *(required)*

- `Florida`
- `Virginia`

### B. Instructor Selection *(filtered by State)*

**If Florida:**
- `Mr. Floyd (Premium Tier)`
- `Alex`
- `George`
- `James`
- `Sean`
- `Evenson (Boxing Only)`
- `Jessica (Dance)`
- `Bianca (Dance)`
- `Carolina (Dance)`

**If Virginia:**
- `Ryan`

### C. Lesson Duration *(required)*

- `30 Minutes`
- `45 Minutes`
- `1 Hour`

### D. Pricing Logic *(auto-calculated from instructor × duration)*

**Standard Instructors** (everyone except Mr. Floyd):
- `30 min ($100/session)`
- `45 min ($125/session)`
- `1 hour ($150/session)`

**Mr. Floyd (Premium Tier):**
- `30 min ($170/session)`
- `45 min ($200/session)`
- `1 hour ($225/session)`

### E. Additional Students *(stackable add-on, max 3 students)*

- `1 Student` — base price (no addition)
- `2 Students (+$25)`
- `3 Students (+$50)`
- Max: 3 students

### F. Training Type *(dynamic based on instructor selection)*

- If `Evenson` selected → **only show** `Boxing`
- If `Jessica / Bianca / Carolina` selected → **only show** `Dance`
- All other instructors → show `Martial Arts` · `Fitness` · `Sports` · `Combination`

### G. Age Group

- `Ages 2.5 – 6 (recommended 30 min)`
- `Ages 7+`

### H. Package Option

- `Single Session` — price = computed total from above
- `10 Sessions (Get 1 Free)` — price = 10 × per-session × 0.909... *(i.e., pay for 10, get 11)*

> **Important math note**: "10 Sessions (Get 1 Free)" means the parent pays
> the price of 10 sessions and receives 11. Effective per-session discount
> is ~9.1%. Display as `10 Sessions Pack ($N total — 11 sessions included)`
> where `N = 10 × per-session price`.

### I. Scheduling

| Field | Type |
|---|---|
| Preferred Date | DATE |
| Preferred Time | TEXT or TIME |

### J. Contact Info

| Field | Type | Notes |
|---|---|---|
| Full Name | TEXT | required |
| Phone Number | PHONE | required |
| Email | TEXT | required |

### K. Important functionality (Tom's notes)

- Pricing updates automatically based on instructor × duration × number of students
- Instructor list filters based on state
- Training type options lock based on instructor type
- Ready for Square/Stripe integration

---

## 3. Birthday Parties (Priority #3)

> Source: `IMG_0316.jpeg` from Juliana on May 4 — titled "Systema Floyd
> Birthday Party / Private Event Request Form." **No prices** included.

### Field list

| Field | Type | Notes |
|---|---|---|
| Event Type | SINGLE_OPTIONS | `Birthday Party` · `Private Event` · `School Event` · `Corporate` · `Other` |
| Event Location | SINGLE_OPTIONS | `At Systema Floyd Gym` · `At My Home` · `At Event Space` |
| Address (if home / event space) | TEXT | conditional |
| Date of Event | DATE | required |
| Preferred Start Time | TEXT or TIME | required |
| Birthday Child Name | TEXT | required |
| Age of Birthday Child | NUMERICAL | required |
| Total Number of Kids | SINGLE_OPTIONS | `10` · `15` · `20` · `25+` |
| Age Range of Kids | SINGLE_OPTIONS | `2.5–4` · `5–6` · `7–9` · `10–12` · `13+` · `Mixed` |
| If mixed, describe breakdown | TEXT | conditional on "Mixed" |
| Event Duration | SINGLE_OPTIONS | `1 Hour` · `2 Hours` · `3+ Hours` |
| Party Activities | MULTIPLE_OPTIONS | `Martial Arts` · `Nerf` · `Dodgeball` · `Obstacle Course` · `Laser Tag` · `Dance` · `Custom` |
| Custom Theme Details | TEXT | conditional on "Custom" |
| Food Options | MULTIPLE_OPTIONS | `Pizza` · `Drinks` · `Cake` |
| **Special Add-Ons** | MULTIPLE_OPTIONS | `Custom Balloon Decor (Specialized Setup)` ← triggers §5 Balloons · `Decorations Setup` · `Extra Instructor` · `Goodie Bags` · `Custom Shirt for Birthday Child` |
| **Premium Extras (Additional Cost)** | MULTIPLE_OPTIONS | `Bounce House Rental` · `Laser Tag Rental` · `Gaga Ball Arena Rental` · `Inflatable Soccer Arena Rental` · `Board Breaking Upgrade` · `Foam Party / Slip & Slide` |
| Parent Name | TEXT | required |
| Phone Number | PHONE | required |
| Email Address | TEXT | required |

### Still needed from Tom
- Prices for **every line item** above (base packages, food options, special
  add-ons, and every premium extra). Form should be auto-calculating; without
  prices we can collect inquiries but can't tally totals.
- Whether packages exist (e.g. Basic / Standard / Premium) or whether
  everything is à la carte
- Deposit policy

---

## 4. Rent-A-Sensei (Babysitting)

> Source: 3 photos sent May 5, titled "Systema Floyd – Rent-A-Sensei
> (Babysitting) Requirements." This is **NOT** for parties/corporate events.

### Overview *(shown on the form as a confirmation box)*

> In-home babysitting service with energetic professional Senseis.
> Focused on supervision, engagement, and active play (games, movement,
> structured activity). **NOT for parties, events, or large group bookings.**

### A. Service Type

- `Rent-A-Sensei (Babysitting)` (only option — locked)

### B. Number of Children *(auto-adjusts pricing)*

- `1`
- `2`
- `3`

### C. Hourly Pricing *(auto-calculated from kid count, minimum 3 hours)*

- `1 Child ($25/hour)`
- `2 Children ($30/hour)`
- `3 Children ($35/hour)`

> Any friend or added child counts toward total. Pricing adjusts automatically
> based on number of children present.

### D. Duration

- `3 hours` *(minimum)*
- `4 hours`
- `5+ hours`

### E. Travel / Gas Fee

- Travel fee may be added based on distance
- Determined by driving time and location
- *(Calculated manually by Tom's team after booking; not auto-quoted on form)*

### F. Tipping

- Tipping your Sensei is greatly appreciated
- Not required, but encouraged for excellent service
- *(Shown as a footer note, not a field)*

### G. Sensei Assignment *(age-based, auto-filtered)*

- Ages 6 months – 3 years old: **Female Sensei only**
- Ages 4 and up: Male or Female Sensei available

### H. Location *(required)*

| Field | Type | Notes |
|---|---|---|
| Full address | TEXT | required for travel fee calculation |

### I. Date & Time *(all required)*

| Field | Type |
|---|---|
| Date | DATE |
| Start time | TEXT or TIME |
| End time | TEXT or TIME |

### J. Contact Info *(all required)*

| Field | Type |
|---|---|
| Parent name | TEXT |
| Phone | PHONE |
| Email | TEXT |

### K. Acknowledgment *(required)*

- `I confirm this service is not for parties or events` (CHECKBOX)

### L. Notes

- Special instructions or extra children info (LARGE_TEXT)

---

## 5. Balloons add-on *(conditional sub-form inside Birthday Parties)*

> Source: `image0.png` (1024×1024) sent May 5, titled "Premium Balloon
> Design Menu." Tom's wife Emily runs "Balloons on the Ave" —
> `Balloonsontheave@gmail.com`. Triggered when the customer selects
> **Custom Balloon Decor** in the Birthday Party special add-ons section.

### A. Balloon Garlands

- `5 ft Garland ($140)`
- `Each additional foot (+$30/foot)`
- *Organic/custom styling included* (no extra charge)

### B. Balloon Columns

- `Classic Column ($100)`
- `Organic Column ($150)`
- `Table Centerpieces ($50)`

### C. Balloon Arches

- `Standard Arch ($450)`
- `Deluxe Arch (includes vinyl wording) ($600)`
- `Walk-Through Arch ($750+)`

### D. Balloon Wall / Backdrop

- `Starting at $800` *(quote-based; show "Contact for quote" CTA)*
- Custom installs priced based on size and complexity

### E. Add-Ons *(stackable; ranges shown to the customer; final price set by Emily)*

- `Foil Balloons ($10–$30 each)`
- `Custom Vinyl Wording ($50–$100)`
- `Backdrop / Stand Rental ($150–$250)`
- `Florals ($100–$200)`
- `Custom Cutouts ($50–$150)`

### F. Additional Fees & Policies

- `Delivery Fee ($25–$75, based on distance)`
- `Setup Fee ($50–$150, depending on install complexity)`
- `Breakdown Fee ($50)` *(optional if client wants removal)*
- `Same-Day / Rush Fee ($100+)`
- `Early Morning / Late Night Setup Fee ($50+)`
- `Outdoor Setup Fee ($50)` *(weather risk & reinforcement)*
- `Damage Waiver recommended for large installs`
- **`Minimum Booking ($300)`** *(hard floor — block submission below this)*

### G. Theme & Colors *(custom design fields)*

| Field | Type |
|---|---|
| Party theme | TEXT |
| Primary color | TEXT (or color picker) |
| Secondary color | TEXT |
| Accent color | TEXT |

### Routing
After submission, Systema Floyd takes payment; the order details get forwarded
to `Balloonsontheave@gmail.com` for fulfillment.

---

## 6. Teen & Adult Classes *(PAUSED)*

Tom on May 5: *"We actually need our class schedule for next year or the
next school year for our gym."* Skip until the next school-year schedule
is finalized.

When unpaused we'll need: day-of-week schedule, drop-in vs. monthly pricing,
belt/rank prerequisite logic, and a trial class offering.

---

## Build sequence

| # | Form | Tom's priority | Status |
|---|---|---|---|
| 1 | **Vladimir Seminar** | #1 | Blocked — needs date, page link, pricing, capacity |
| 2 | **Private Lessons** | #2 | **Ready to build** — all pricing confirmed |
| 3 | **Birthday Parties** | #3 | Fields confirmed, **all prices missing** |
| 4 | **Rent-A-Sensei** | not ranked | **Ready to build** — all pricing confirmed |
| 5 | **Balloons** (sub-form) | not ranked | **Ready to build** — all pricing confirmed |
| 6 | **Teen & Adult Classes** | paused | Waiting on next school year schedule |

## Conventions used everywhere

- Required fields marked `*` (or `required` in the type column)
- Conditional fields only shown when parent option is chosen
- All pricing baked into option strings using `Label ($N/unit)` or `Label (+$N)` so the billing dashboard parser extracts amounts automatically (same pattern as the camp Lunch column)
- Footer-level 3% transaction fee + 7% FL sales tax on food/apparel auto-calculated, not asked
- Every form ends with a liability waiver checkbox/signature
