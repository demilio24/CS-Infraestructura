# Systema Floyd — New Forms Spec

> Build order per Tom's May 13 call:
> **1. Vladimir Seminar → 2. Private Lessons → 3. Birthday Parties**
>
> Additional forms surfaced in his May 5 email (not yet prioritized):
> **4. Rent a Sensei** · **5. Balloons add-on** (lives inside Birthday Parties)
> · **6. Teen & Adult Classes** *(paused until next school year schedule is finalized)*

This doc is the canonical field list per form, using the pricing syntax
already in use across the camp Google Sheets:

| Pattern | Meaning | Example |
|---|---|---|
| `Label ($N/unit)` | Item has its own price | `Pizza ($30/week)` · `Single Session ($60/session)` |
| `Label (+$N)` | Add-on charged on top of base | `Small (+$30)` (shirt addon) |
| `Label (+$N/unit)` | Recurring/per-unit add-on | `After care ($25/day)` |
| `Label` (no $) | Free option / placeholder | `None` · `Full Week` |

All currency in **USD**. **Florida sales tax** applies to *food and clothing* only.
**Transaction fee** is a flat **3%** applied to the total at checkout (already implemented in billing dashboard).

Fields marked `*` are required. Anything in `{curly braces}` means **the value still
needs to come from Tom** — I have not fabricated a number.

---

## 1. Vladimir Seminar (Priority #1)

> Annual flagship weekend event in **September or October**. Tom said he already
> has an existing registration page he'll send the link to. Until that arrives,
> these are the fields a Systema HQ-style weekend seminar typically needs.

### A. Identity
- Student Name *
- Date of Birth *
- Email Address *
- Phone Number *
- Emergency Contact Name *
- Emergency Contact Phone *
- Home School / Systema Affiliation
- City + State (so Tom knows who's traveling)

### B. Experience
- Systema experience level *
  - `None — first seminar`
  - `Beginner (< 1 year)`
  - `Intermediate (1-3 years)`
  - `Advanced (3+ years)`
  - `Instructor`
- Prior seminars with Vladimir Vasiliev (Yes / No)
- Other martial arts background (free text)

### C. Registration Type *
*(One selection — these mirror Vasiliev's standard weekend structure)*
- `Full Weekend Pass ($ {weekend_price} /weekend)`
- `Saturday Only ($ {sat_price} /day)`
- `Sunday Only ($ {sun_price} /day)`
- `Friday Pre-Seminar Workshop ($ {fri_price} )` *(only if Tom is running one)*
- `Early Bird Full Weekend ($ {early_bird_price} /weekend)` — auto-shown only if registered before `{early_bird_cutoff_date}`

### D. Apparel Add-on
- Event T-shirt
  - `None`
  - `Small (+$ {shirt_price} )`
  - `Medium (+$ {shirt_price} )`
  - `Large (+$ {shirt_price} )`
  - `Extra Large (+$ {shirt_price} )`
  - `XXL (+$ {shirt_price_xxl} )` *(if priced higher per camp pattern)*

> Apparel = Florida sales tax applies (+7% on shirt line items only).

### E. Optional Add-ons
- Group dinner (Saturday night)  
  - `None`
  - `Attending (+$ {dinner_price} /person)`
- Photo with Vladimir Vasiliev (+$ {photo_price} ) *(if offered)*
- Equipment/mat rental (+$ {equipment_price} ) *(if applicable)*

### F. Health & Waiver
- Medical conditions or injuries (free text)
- Allergies (free text)
- Liability waiver — checkbox + signature *(use existing seminar waiver Tom said Juliana would send)*
- Photo/video release — checkbox

### G. Notes
- Anything else we should know (free text)

### Still needed from Tom
1. **Date(s)** of the seminar weekend
2. **Link to existing seminar page** (he said "she'll send it to you" on Apr 24)
3. **Existing waiver** PDF or link
4. All `{ … }` prices above
5. Capacity cap (for sold-out logic)

---

## 2. Private Lessons (Priority #2)

> Tom sent **3 photos** titled "private lesson options" on May 5 — those photos
> contain the pricing tiers. I haven't seen them yet, so the tier labels below
> are placeholders matching typical Systema private-lesson package structures.

### A. Identity
- Student Name *
- Age (or DOB) *
- Parent/Guardian Name *  *(only required if student is under 18)*
- Parent/Guardian Email *
- Parent/Guardian Phone *
- Student Email *(if 18+)*

### B. Package Selection *
- `Single Session ($ {single_price} /session)`
- `4-Session Pack ($ {pack_4_price} /4-pack)`
- `8-Session Pack ($ {pack_8_price} /8-pack)`
- `12-Session Pack ($ {pack_12_price} /12-pack)`
- `Monthly Unlimited ($ {monthly_price} /month)` *(if offered)*

> Tom's 3-photo package list is the source of truth for which tiers exist
> and at what price. The above is a placeholder shape.

### C. Sensei Preference
- `No preference — any available`
- `Tom Floyd`
- `Sean Nasif`
- `Alex Henry`
- `Other (specify in notes)`

### D. Scheduling
- Preferred days (multi-select Mon → Sun)
- Preferred time of day *
  - `Morning (before 12pm)`
  - `Afternoon (12pm-5pm)`
  - `Evening (5pm+)`
- Preferred campus
  - `Upper Campus`
  - `Lower Campus`
  - `No preference`
- Start date (date picker) *

### E. Goals
- What do you want to work on? (free text — Tom uses this to match the right sensei)

### F. Health & Waiver
- Medical notes / injuries
- Allergies *(only required if student is under 18)*
- Liability waiver checkbox + signature
- Photo/video release checkbox

### Still needed from Tom
1. **Pricing tiers** from the 3 photos he sent
2. Whether package sessions expire (e.g. 4-pack good for 3 months) and what to do at expiry
3. Cancellation / no-show policy text for the waiver

---

## 3. Birthday Parties (Priority #3)

> Juliana sent the section structure on May 4 (image `IMG_0316.jpeg`) — **without
> prices**. Tom has not yet sent per-item pricing. The Balloons add-on (see §5)
> is triggered conditionally from inside this form.

### A. Identity
- Parent Name *
- Parent Email *
- Parent Phone *
- Child Name (the birthday kid) *
- Child's age (turning) *
- Estimated guest count *

### B. Party Date & Time
- Preferred date * (date picker)
- Alternate date (date picker)
- Time slot * 
  - `Morning (10am-12pm)`
  - `Afternoon (1pm-3pm)`
  - `Late Afternoon (3pm-5pm)`
  - `Evening (5pm-7pm)`
- Party duration *
  - `1.5 hours ($ {duration_15_price} )`
  - `2 hours ($ {duration_2_price} )`
  - `3 hours ($ {duration_3_price} )`

### C. Package *
- `Basic Package ($ {basic_price} )` — *{what's included — needs Tom}*
- `Standard Package ($ {standard_price} )` — *{what's included}*
- `Premium Package ($ {premium_price} )` — *{what's included}*

### D. Food Add-ons (FL sales tax applies on food)
- Pizza
  - `None`
  - `Cheese (+$ {pizza_cheese_price} /pizza)`
  - `Pepperoni (+$ {pizza_pep_price} /pizza)`
  - Number of pizzas (numeric input, auto-multiplies)
- Drinks
  - `None`
  - `Juice boxes per guest (+$ {juice_price} /guest)`
  - `Water bottles per guest (+$ {water_price} /guest)`
- Cake
  - `None — providing our own`
  - `Standard cake (+$ {cake_std_price} )`
  - `Custom themed cake (+$ {cake_custom_price} )`

### E. Apparel Add-ons (FL sales tax applies on apparel)
- T-shirt for birthday kid
  - `None`
  - `Size: Extra Small (+$ {shirt_price} )` *(repeat through XL using camp shirt syntax)*
- T-shirts for guests (count + size matrix)

### F. Decorations
- **Balloon decorations** ✱ — `Yes — show me options` triggers §5 Balloons sub-form
- Streamers/banner (+$ {streamer_price} )
- Themed table setting (+$ {table_setting_price} )
- Photographer
  - `None`
  - `1 hour (+$ {photog_1h_price} )`
  - `2 hours (+$ {photog_2h_price} )`

### G. Goody Bags
- `None`
- `Standard goody bag (+$ {goody_std_price} /guest)`
- `Premium goody bag (+$ {goody_premium_price} /guest)`

### H. Notes & Waiver
- Allergies among guests (free text — critical for food)
- Special requests (free text)
- Liability waiver checkbox + signature
- Photo/video release checkbox

### Still needed from Tom
1. **All `{ }` prices** above — package contents and add-on rates
2. What's included in each package tier
3. Maximum guest count per package
4. Deposit policy (full payment up-front vs. deposit + balance)

---

## 4. Rent a Sensei

> Item #5 in Tom's May 5 email. Tom sent **3 photos** with options.
> Used for one-off bookings: corporate events, women's self-defense afternoons,
> school assemblies, demos.

### A. Identity
- Contact Name *
- Email *
- Phone *
- Organization name *
- Organization type *
  - `Corporate / Office`
  - `School`
  - `Private group / individual`
  - `Non-profit`
  - `Other (specify)`

### B. Event Details
- Event date * (date picker)
- Event start time * (time picker)
- Estimated duration *
  - `1 hour ($ {rent_1h_price} )`
  - `2 hours ($ {rent_2h_price} )`
  - `Half day / 3 hours ($ {rent_half_price} )`
  - `Full day ($ {rent_full_price} )`
- Number of participants *
- Event address * (location)

### C. Workshop Type *
- `Women's Self-Defense (+$ {wsd_price} )`
- `Kids Workshop (+$ {kids_ws_price} )`
- `Corporate Team-Building (+$ {corp_price} )`
- `Demonstration / Performance (+$ {demo_price} )`
- `Custom — describe below`

### D. Sensei Preference
- `No preference`
- `Tom Floyd`
- `Sean Nasif (Georgia-based; travel fees may apply)`
- `Alex Henry`

### E. Add-ons
- Travel beyond `{free_miles}` miles (+$ {travel_per_mile} /mile)
- Equipment & mats (+$ {equipment_price} )
- Multiple senseis (+$ {extra_sensei_price} /additional sensei)

### F. Notes & Waiver
- Special requests / focus areas (free text)
- Group waiver — uploaded after booking confirmation OR each participant signs on-site

### Still needed from Tom
1. **All `{ }` prices** from the 3 photos he sent
2. Free travel radius (miles)
3. Whether each participant signs an individual waiver or one group waiver

---

## 5. Balloons Add-on  *(conditional sub-form inside Birthday Parties)*

> Emily (Tom's wife) — `Balloonsontheave@gmail.com` — runs "Balloons on the Ave"
> as a side business. Her existing intake form:
> https://docs.google.com/forms/d/11_gxq6I0QdPpdwfL5nJMq7ZY4en4LPViuuwmR_ShN9Q/viewform
> When triggered, Systema Floyd charges the customer; Emily's email gets the
> order details for fulfillment. Tom sent her price-breakdown image on May 5.

### A. Theme & Colors
- Party theme (free text)
- Primary color * (color picker or named option list)
- Secondary color
- Tertiary color

### B. Items
- Number/letter balloons (for "Happy Birthday" or kid's name) — multi-line text input
  - Each letter/number (+$ {letter_price} /each)
- Number balloon (turning age) (+$ {age_balloon_price} )
- Helium balloon bouquet
  - `Small bouquet (5 balloons) (+$ {bouquet_small_price} )`
  - `Medium bouquet (10 balloons) (+$ {bouquet_med_price} )`
  - `Large bouquet (15+ balloons) (+$ {bouquet_large_price} )`
- Balloon arch
  - `Half arch (+$ {arch_half_price} )`
  - `Full arch (+$ {arch_full_price} )`
- Balloon garland (+$ {garland_price} /linear foot)
- Centerpiece (+$ {centerpiece_price} /each)

### C. Delivery
- Pickup at studio (no fee) OR
- Delivery + setup (+$ {balloon_delivery_price} )

### Still needed from Tom (or Emily directly)
1. **All `{ }` prices** from Emily's image
2. Whether she handles setup or just delivery
3. Lead time required (days notice for orders)

---

## 6. Teen & Adult Classes *(PAUSED)*

Tom confirmed on **May 5**: *"We actually need our class schedule for next
year or the next school year for our gym."* Skip this form until the next
school-year schedule is finalized.

### When unpaused, expect to need
- Day-of-week schedule per class type
- Pricing per class / drop-in vs. monthly
- Belt/rank prerequisite logic
- Trial class offering (typically first class free or `$X` trial)

---

## Build sequence summary

| # | Form | Tom's priority | Blocker on Tom's end |
|---|---|---|---|
| 1 | **Vladimir Seminar** | #1 | Date, link to existing page, pricing, capacity |
| 2 | **Private Lessons** | #2 | Pricing from 3 photos (he already sent) — needs to be transcribed |
| 3 | **Birthday Parties** | #3 | All pricing — never sent |
| 4 | **Rent a Sensei** | not ranked | Pricing from 3 photos (he already sent) |
| 5 | **Balloons** | not ranked (sub-form) | Pricing from Emily's image (he already sent) |
| 6 | **Teen & Adult Classes** | paused | Next school year schedule |

## Conventions used everywhere

- Required fields: marked with `*`
- Conditional fields: only shown when a parent option is chosen (e.g. Balloons § triggers only if "Yes — show me options" is selected on Birthday Parties §F)
- Pricing displayed as **$X.XX** with the `($ N /unit)` syntax inline so the
  billing dashboard can parse and tally automatically (same pattern as the
  existing camp Lunch column)
- All forms get the same footer: 3% transaction fee + 7% FL sales tax on
  food/apparel items (auto-calculated, not asked of the parent)
- Every form ends with a liability waiver checkbox; same waiver flow as the
  camp registration (signed once per child per form-type per year)
