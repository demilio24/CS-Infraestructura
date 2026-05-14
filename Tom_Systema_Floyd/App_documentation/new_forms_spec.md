# Systema Floyd — New Forms Spec

> Build order per Tom's May 13 call: **1. Vladimir Seminar → 2. Private Lessons → 3. Birthday Parties**
> Additional forms surfaced in his May 5 email: **4. Rent-A-Sensei (Babysitting)** · **5. Balloons add-on** (lives inside Birthday Parties) · **6. Teen & Adult Classes** *(paused until next school year)*

All prices below come from photos Tom sent on May 5 (OCR'd 2026-05-14, originals
in `.claude/scratch/sf_pricing_imgs/`). The Birthday Party section is fields-only
because Tom never sent prices for it. Vladimir Seminar is shape-only because the
existing-page link he promised has not arrived.

## Pricing syntax used throughout

Each priced option carries its price **inside the option string**, matching the
camp `Lunch` column pattern so the billing dashboard parser can extract amounts
without a separate price table:

| Pattern | Meaning | Example |
|---|---|---|
| `Label ($N)` | Flat price | `Standard Arch ($450)` |
| `Label ($N/unit)` | Per-unit price | `1 Child ($25/hour)` |
| `Label (+$N)` | Add-on on top of base | `2 Students (+$25)` |
| `Label (+$N/unit)` | Per-unit add-on | `Each additional foot (+$30/foot)` |
| `Label ($N — $M)` | Quote range (final price set manually) | `Foil Balloons ($10 — $30 each)` |

Florida sales tax (7%) applies to food and clothing line items only.
Transaction fee (3% flat) applies to the order total at checkout.

---

## 1. Vladimir Seminar (Priority #1)

> Annual flagship weekend event in **September or October**. Tom on April 24
> said he already has an existing registration page; the link he said he'd
> send has not arrived. Field layout follows the Systema HQ weekend-seminar
> standard. Every `$ {…}` is still blocked on Tom.

### Fields

| # | Field | Type | Options / Notes |
|---|---|---|---|
| 1 | Student Name * | TEXT | |
| 2 | Date of Birth * | DATE | |
| 3 | Email Address * | TEXT | |
| 4 | Phone Number * | PHONE | |
| 5 | Emergency Contact Name * | TEXT | |
| 6 | Emergency Contact Phone * | PHONE | |
| 7 | Home School / Systema Affiliation | TEXT | |
| 8 | City + State | TEXT | so Tom can flag travelers |
| 9 | Systema Experience Level * | SINGLE_OPTIONS | `None — first seminar` · `Beginner (< 1 year)` · `Intermediate (1-3 years)` · `Advanced (3+ years)` · `Instructor` |
| 10 | Prior seminars with Vladimir Vasiliev | CHECKBOX | |
| 11 | Other martial arts background | LARGE_TEXT | |
| 12 | Registration Type * | SINGLE_OPTIONS | `Full Weekend Pass ($ {weekend_price} /weekend)` · `Saturday Only ($ {sat_price} /day)` · `Sunday Only ($ {sun_price} /day)` · `Early Bird Full Weekend ($ {early_bird_price} /weekend)` |
| 13 | Event T-shirt | SINGLE_OPTIONS | `None` · `Small (+$ {shirt_price} )` · `Medium (+$ {shirt_price} )` · `Large (+$ {shirt_price} )` · `XL (+$ {shirt_price} )` · `XXL (+$ {shirt_xxl_price} )` |
| 14 | Medical conditions or injuries | LARGE_TEXT | |
| 15 | Allergies | LARGE_TEXT | |
| 16 | Liability waiver * | SIGNATURE | use existing seminar waiver |
| 17 | Photo/video release | CHECKBOX | |
| 18 | Notes | LARGE_TEXT | |

### Still needed from Tom
- Date(s) of the weekend
- Link to the existing seminar registration page
- Existing waiver PDF / link
- All `{ }` prices above
- Capacity cap (for sold-out logic)

---

## 2. Private Lessons (Priority #2) — *ALL PRICING CONFIRMED*

> Source: 3 photos titled *"Systema Floyd – Private Lesson Booking Form
> Requirements"* sent May 5.

### Fields

| # | Field | Type | Options / Notes |
|---|---|---|---|
| 1 | State * | SINGLE_OPTIONS | `Florida` · `Virginia` |
| 2 | Instructor * | SINGLE_OPTIONS (filtered by State) | **FL:** `Mr. Floyd (Premium)` · `Alex` · `George` · `James` · `Sean` · `Evenson (Boxing Only)` · `Jessica (Dance)` · `Bianca (Dance)` · `Carolina (Dance)`  **VA:** `Ryan` |
| 3 | Lesson Selection * | SINGLE_OPTIONS | `Standard 30 min ($100/session)` · `Standard 45 min ($125/session)` · `Standard 1 hour ($150/session)` · `Mr. Floyd 30 min ($170/session)` · `Mr. Floyd 45 min ($200/session)` · `Mr. Floyd 1 hour ($225/session)` |
| 4 | Additional Students | SINGLE_OPTIONS | `1 Student` · `2 Students (+$25)` · `3 Students (+$50)` *(max 3 students)* |
| 5 | Training Type * (dynamic) | SINGLE_OPTIONS | `Martial Arts` · `Fitness` · `Sports` · `Combination` · `Boxing` · `Dance` *(see filter rules below)* |
| 6 | Age Group * | SINGLE_OPTIONS | `Ages 2.5–6 (30 min recommended)` · `Ages 7+` |
| 7 | Package | SINGLE_OPTIONS | `Single Session` · `10 Sessions Pack (Get 1 Free — pay for 10, receive 11)` |
| 8 | Preferred Date * | DATE | |
| 9 | Preferred Time * | TIME | |
| 10 | Full Name * | TEXT | |
| 11 | Phone Number * | PHONE | |
| 12 | Email * | TEXT | |

### Field 5 filter rules *(must enforce on the form)*

- If instructor = `Evenson (Boxing Only)` → **only show** `Boxing`
- If instructor ∈ {`Jessica`, `Bianca`, `Carolina`} → **only show** `Dance`
- All other instructors → show `Martial Arts` · `Fitness` · `Sports` · `Combination`

### Pricing logic *(auto-calculated, no field for it — for engineer reference)*

```
total = lesson_price                          [field 3]
      + additional_students_surcharge         [field 4]
      + transaction_fee (3% of total)
```

Field 3 picks the right tier automatically; the option string contains both
the duration and the base price so a single SINGLE_OPTIONS field handles it.
Mr. Floyd's options only show when he's selected as the instructor (conditional
logic at field-display time).

If field 7 = `10 Sessions Pack` → final amount = `10 × per-session price`
(parent receives 11 sessions).

---

## 3. Birthday Parties (Priority #3) — *PRICES MISSING*

> Source: `IMG_0316.jpeg` from Juliana on May 4 — *"Systema Floyd Birthday
> Party / Private Event Request Form"*. **No prices included.** Each priced
> option below is left as `($ {…})` until Tom sends the price sheet.

### Fields

| # | Field | Type | Options / Notes |
|---|---|---|---|
| 1 | Event Type * | SINGLE_OPTIONS | `Birthday Party` · `Private Event` · `School Event` · `Corporate` · `Other` |
| 2 | Event Location * | SINGLE_OPTIONS | `At Systema Floyd Gym ($ {gym_base_price} )` · `At My Home ($ {home_base_price} )` · `At Event Space ($ {event_space_price} )` |
| 3 | Address (if home / event space) | TEXT | conditional on #2 |
| 4 | Date of Event * | DATE | |
| 5 | Preferred Start Time * | TIME | |
| 6 | Birthday Child Name * | TEXT | |
| 7 | Age of Birthday Child * | NUMERICAL | |
| 8 | Total Number of Kids * | SINGLE_OPTIONS | `10 Kids ($ {kids_10_price} )` · `15 Kids ($ {kids_15_price} )` · `20 Kids ($ {kids_20_price} )` · `25+ Kids ($ {kids_25plus_price} )` |
| 9 | Age Range of Kids * | SINGLE_OPTIONS | `2.5–4` · `5–6` · `7–9` · `10–12` · `13+` · `Mixed` |
| 10 | If Mixed, describe breakdown | TEXT | conditional |
| 11 | Event Duration * | SINGLE_OPTIONS | `1 Hour ($ {duration_1h_price} )` · `2 Hours ($ {duration_2h_price} )` · `3+ Hours ($ {duration_3h_price} )` |
| 12 | Party Activities | MULTIPLE_OPTIONS | `Martial Arts` · `Nerf` · `Dodgeball` · `Obstacle Course` · `Laser Tag` · `Dance` · `Custom` *(prices, if any, set by package or premium extras)* |
| 13 | Custom Theme Details | TEXT | conditional on #12 = Custom |
| 14 | Food Options | MULTIPLE_OPTIONS | `Pizza (+$ {pizza_price} )` · `Drinks (+$ {drinks_price} )` · `Cake (+$ {cake_price} )` *(FL sales tax applies)* |
| 15 | Special Add-Ons | MULTIPLE_OPTIONS | `Custom Balloon Decor (Specialized Setup) — see balloon menu` ← triggers §5 · `Decorations Setup (+$ {decor_price} )` · `Extra Instructor (+$ {extra_instructor_price} )` · `Goodie Bags (+$ {goody_bags_price} /guest)` · `Custom Shirt for Birthday Child (+$ {birthday_shirt_price} )` |
| 16 | Premium Extras (Additional Cost) | MULTIPLE_OPTIONS | `Bounce House Rental (+$ {bounce_house_price} )` · `Laser Tag Rental (+$ {laser_tag_price} )` · `Gaga Ball Arena Rental (+$ {gaga_ball_price} )` · `Inflatable Soccer Arena Rental (+$ {soccer_arena_price} )` · `Board Breaking Upgrade (+$ {board_break_price} )` · `Foam Party / Slip & Slide (+$ {foam_party_price} )` |
| 17 | Parent Name * | TEXT | |
| 18 | Phone Number * | PHONE | |
| 19 | Email Address * | TEXT | |

### Still needed from Tom
- A price for **every `{ }` placeholder** above (17 prices total)
- Whether there's a packaged tier (Basic / Standard / Premium) vs everything à la carte
- Deposit policy (deposit at booking + balance later, or full payment up-front)

---

## 4. Rent-A-Sensei (Babysitting) — *ALL PRICING CONFIRMED*

> Source: 3 photos titled *"Systema Floyd – Rent-A-Sensei (Babysitting)
> Requirements"* sent May 5. **This is in-home babysitting, NOT parties/events.**

### Overview text *(shown above the form as a confirmation banner)*

> In-home babysitting service with energetic professional Senseis. Focused on
> supervision, engagement, and active play (games, movement, structured
> activity). **Not for parties, events, or large group bookings.**
> 3-hour minimum per booking.

### Fields

| # | Field | Type | Options / Notes |
|---|---|---|---|
| 1 | Service Type * | SINGLE_OPTIONS | `Rent-A-Sensei (Babysitting)` *(only option, locked)* |
| 2 | Number of Children * | SINGLE_OPTIONS | `1 Child ($25/hour)` · `2 Children ($30/hour)` · `3 Children ($35/hour)` *(any added friend counts toward total)* |
| 3 | Duration * | SINGLE_OPTIONS | `3 hours (minimum)` · `4 hours` · `5+ hours` |
| 4 | Full Address * | TEXT | required for travel-fee calculation |
| 5 | Date * | DATE | |
| 6 | Start Time * | TIME | |
| 7 | End Time * | TIME | |
| 8 | Parent Name * | TEXT | |
| 9 | Phone * | PHONE | |
| 10 | Email * | TEXT | |
| 11 | Confirm: not for parties/events * | CHECKBOX | `I confirm this service is not for parties or events` |
| 12 | Special instructions / extra children info | LARGE_TEXT | |

### Sensei assignment *(auto-filtered server-side based on age)*

- Ages 6 months – 3 years old → **Female Sensei only**
- Ages 4 and up → Male or Female Sensei available

### Travel / Gas Fee *(not a form field — manually quoted)*

A travel fee may be added based on driving time and distance. Quoted by Tom's
team after booking is received, **not** auto-calculated on the form.

### Footer note

> Tipping your Sensei is greatly appreciated. Not required, but encouraged
> for excellent service.

---

## 5. Balloons add-on *(conditional sub-form inside Birthday Parties)* — *ALL PRICING CONFIRMED*

> Source: `image0.png` (1024×1024) sent May 5 — *"Premium Balloon Design
> Menu."* Run by Emily (Tom's wife) — `Balloonsontheave@gmail.com`. Triggered
> from §3 Birthday Parties Special Add-Ons when **Custom Balloon Decor** is
> selected. Hard minimum booking: **$300**.

### Fields

| # | Field | Type | Options / Notes |
|---|---|---|---|
| 1 | Garland | SINGLE_OPTIONS | `None` · `5 ft Garland ($140)` · `Custom length — base 5 ft ($140) + each additional foot (+$30/foot)` *(organic/custom styling included)* |
| 1b | Garland additional feet (only if custom length picked) | NUMERICAL | each foot = `(+$30/foot)` |
| 2 | Columns | MULTIPLE_OPTIONS | `Classic Column ($100)` · `Organic Column ($150)` · `Table Centerpieces ($50)` |
| 3 | Arches | SINGLE_OPTIONS | `None` · `Standard Arch ($450)` · `Deluxe Arch — includes vinyl wording ($600)` · `Walk-Through Arch ($750+)` |
| 4 | Balloon Wall / Backdrop | SINGLE_OPTIONS | `None` · `Starting at $800 — request quote` *(quote-based; finalized by Emily after submission)* |
| 5 | Add-Ons (range-priced, finalized by Emily) | MULTIPLE_OPTIONS | `Foil Balloons ($10 — $30 each)` · `Custom Vinyl Wording ($50 — $100)` · `Backdrop / Stand Rental ($150 — $250)` · `Florals ($100 — $200)` · `Custom Cutouts ($50 — $150)` |
| 6 | Delivery Fee * | SINGLE_OPTIONS | `Local (+$25)` · `Mid-distance (+$50)` · `Long-distance (+$75)` *(based on distance)* |
| 7 | Setup Complexity * | SINGLE_OPTIONS | `Simple setup (+$50)` · `Standard setup (+$100)` · `Complex install (+$150)` |
| 8 | Optional Fees | MULTIPLE_OPTIONS | `Breakdown / removal (+$50)` · `Same-Day / Rush (+$100)` · `Early Morning / Late Night Setup (+$50)` · `Outdoor Setup — weather risk & reinforcement (+$50)` · `Damage Waiver — recommended for large installs` |
| 9 | Party theme | TEXT | |
| 10 | Primary color * | TEXT | |
| 11 | Secondary color | TEXT | |
| 12 | Accent color | TEXT | |
| 13 | Notes for Emily | LARGE_TEXT | |

### Validation
- Reject submission if computed subtotal < `$300` (minimum booking floor)
- Show `Subtotal: $___ (Minimum: $300)` live as the customer selects items

### Routing
On submit: Systema Floyd takes payment via the same Square integration as
other forms; the order detail + theme/color fields are forwarded to
`Balloonsontheave@gmail.com` for fulfillment.

---

## 6. Teen & Adult Classes *(PAUSED)*

Tom on May 5: *"We actually need our class schedule for next year or the
next school year for our gym."* Skip until the next school-year schedule
is finalized.

When unpaused we'll need: day-of-week schedule, drop-in vs. monthly pricing,
belt/rank prerequisite logic, and a trial class offering (typically first
class free or `Trial Class ($X)`).

---

## Build sequence

| # | Form | Tom's priority | Status | Buildable now? |
|---|---|---|---|---|
| 1 | **Vladimir Seminar** | #1 | Blocked — needs date, page link, pricing, capacity | ❌ |
| 2 | **Private Lessons** | #2 | All pricing confirmed | ✅ |
| 3 | **Birthday Parties** | #3 | Fields confirmed, **17 prices missing** | ❌ (skeleton only) |
| 4 | **Rent-A-Sensei** | not ranked | All pricing confirmed | ✅ |
| 5 | **Balloons** (sub-form) | not ranked | All pricing confirmed | ✅ |
| 6 | **Teen & Adult Classes** | paused | Waiting on next school year schedule | ❌ |

## Conventions

- Required fields marked `*`
- Conditional fields only shown when their parent option triggers them
- All pricing baked into the option string itself, using `Label ($N/unit)` or `Label (+$N)` (same syntax the camp `Lunch` column uses) so the billing dashboard parser extracts amounts with zero extra config
- Form-level fees applied at checkout: **3% transaction fee** on order total · **7% FL sales tax** on food/clothing line items only
- Every form ends with a liability waiver checkbox or signature field
