# Systema Floyd, New Forms Spec

> Build order per Tom's May 13 call: **1. Vladimir Seminar → 2. Private Lessons → 3. Birthday Parties**
> Additional forms surfaced in his May 5 email: **4. Rent-A-Sensei (Babysitting)** · **5. Balloons add-on** (lives inside Birthday Parties) · **6. Teen & Adult Classes** *(paused until next school year)*

All prices below come from photos Tom sent on May 5 (OCR'd 2026-05-14, originals
in `.claude/scratch/sf_pricing_imgs/`). The Birthday Party section is fields-only
because Tom never sent prices for it. Vladimir Seminar is shape-only because the
existing-page link he promised has not arrived.

For a per-form punch list of outstanding work, see [forms_todos.md](./forms_todos.md).

## Build status snapshot (updated 2026-05-23)

| Form | Spec'd | GHL fields created | GHL form built | Notes |
|---|---|---|---|---|
| **Vladimir Seminar** | ⏳ shape only | ✅ **2026-05-18** (inline by Amina) | ✅ **PUBLISHED 2026-05-18** `Zu7nHwEILIJnkKyvtnbB` | Custom-field IDs still TBD, see §Vladimir Seminar |
| **Private Lessons** | ✅ | ✅ **2026-05-14** | ✅ **PUBLISHED 2026-05-22** `Cpk2gmz9dcumDiz2KFun` | Rule B conditional-logic bug admitted by Amina in [ClickUp thread `90130268726557`](https://app.clickup.com/t/86ahfhfj3). Embedded on [funnel/private-lessons.html](../funnel/private-lessons.html) 2026-05-23. |
| Birthday Parties | ✅ fields only | ❌ | ❌ | 17 prices still missing from Tom. NOT YET A SEPARATE GHL FORM, see §Birthday Parties. `birthday-parties.html` currently embeds the Balloons form as a placeholder. |
| **Rent-A-Sensei** | ✅ | ✅ **2026-05-14** | ✅ **PUBLISHED 2026-05-22** `myEoOLL1SKGv0IvSF4ur` | Embedded on [funnel/rent-a-sensei.html](../funnel/rent-a-sensei.html) 2026-05-23. |
| **Balloons** | ✅ | ✅ **2026-05-14** | ✅ **PUBLISHED 2026-05-18** `SvXq0KmUb1Ct2AR2t8Yl` | Acting as the placeholder embed on [funnel/birthday-parties.html](../funnel/birthday-parties.html) until the real Birthday Parties form is built. |
| Teen & Adult Classes | ⏸ | ❌ | ❌ | Paused until next school year schedule lands |

**Verification task open:** [ClickUp 86ahnq2z2 "Verify Form Functionality"](https://app.clickup.com/t/86ahnq2z2) (urgent, due 2026-05-25). Amina needs to confirm each form: (1) appends to the correct Google Sheet via its `Add Row to Spreadsheet` workflow, (2) sends the right per-form notification email template, (3) redirect lands on `/waiver` with all three query params. Use `test@nilsllc.com` + the NILS LLC phone number for test submissions.

### Private Lessons, live GHL IDs (Systema Floyd FL, location `8IWtNFlmgJ8bif9DivHT`)

Created 2026-05-14 via `.claude/scratch/ghl_create_private_lessons.py`.
Map written to `.claude/scratch/ghl_private_lessons_ids.json`.

**Folder**: `Private Lessons`, id `X4a97HKQJdXVkGV6R4Vg`

**Destination Google Sheet**: `Private Lesson Booking`, id `1XVh9pBOwddr-wCZ4eIxA39htmEdGGGx_WRgDun1C_mU` (owned by `systemafloydsheets@gmail.com`, lives in the shared `Form Submissions` Drive folder `1YnCaA46sLC57w7A3vZf0tEGgZv9aoUxN`). Column order on `Sheet1`: `Contact ID | Full Name | Phone | Email | State | Instructor | Lesson Length & Price | Number of Students | Training Type | Age Group | Package | Preferred Date | Preferred Time` (13 cols).

**GHL form (PUBLISHED 2026-05-22 by Amina)**: form id `Cpk2gmz9dcumDiz2KFun`
- Form builder: `https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/form-builder-v2/Cpk2gmz9dcumDiz2KFun`
- Embed location: [funnel/private-lessons.html](../funnel/private-lessons.html), hero `.page-hero-form#register` (2026-05-23)
- **Known bug — Rule B conditional logic partially broken**: Amina admitted in [ClickUp thread `90130268726557`](https://app.clickup.com/t/86ahfhfj3) that the Instructor → Training Type lock (Evenson=Boxing only, Jessica/Bianca/Carolina=Dance only) is not fully working. Form is live and submittable, but conditional UI may misbehave for those instructor selections. Mitigation plan: walk Amina through using code nodes for conditional logic in a recorded video.
- **Verification pending**: see [ClickUp 86ahnq2z2](https://app.clickup.com/t/86ahnq2z2).
- **Instructor headshots (2026-05-28)**: Tom sent real photos for the three newest FL instructors (email "Insturctor photos", 2026-05-28). They replace the placeholder avatars on the [funnel/private-lessons.html](../funnel/private-lessons.html) Florida roster and were also added to the [funnel/home.html](../funnel/home.html) coaches grid. Uploaded to the **Florida PIT location `8IWtNFlmgJ8bif9DivHT`** (NOT the older `2RNdy2siRA6d4r1tWL09` location that hosts Mr. Floyd / Alex / George / James), via the PIT with no `locationId` in the request:
  - **Evenson** (Boxing) — `https://assets.cdn.filesafe.space/8IWtNFlmgJ8bif9DivHT/media/4ef507f5-bcfd-4aea-a54b-00d143174a2c.jpg`
  - **Jessica** (Spirit Dance, blonde) — `https://assets.cdn.filesafe.space/8IWtNFlmgJ8bif9DivHT/media/8fd4e6e9-0c42-49d2-a080-b307a914fbb5.jpg`
  - **Carolina** (Spirit Dance, brunette) — `https://assets.cdn.filesafe.space/8IWtNFlmgJ8bif9DivHT/media/2c76eb2e-036a-4b07-a636-b1120312d6c4.jpg`
  - The two dance headshots carry no name text, so the Jessica/Carolina split (blonde = Jessica, brunette = Carolina) was **confirmed with Emilio on 2026-05-28**, not OCR-derived. If a re-upload is ever needed, keep that mapping. Bianca (Dance) and Ryan (VA) are still placeholder cards, awaiting photos.

| # | Label | Type | Field ID | Field Key |
|---|---|---|---|---|
| 1 | State | `RADIO` | `5ehZTaXaNcXTELK0BIwD` | `contact.pl_state` |
| 2 | Instructor | `SINGLE_OPTIONS` | `DSPT34R6tPLsrchxilTA` | `contact.pl_instructor` |
| 3 | Lesson Length & Price | `SINGLE_OPTIONS` | `ZpcqYLIeI5vRC3vB4VaD` | `contact.pl_lesson_selection` |
| 4 | Number of Students | `RADIO` | `mVy01I2pOfpSsBJ9K2TC` | `contact.pl_num_students` |
| 5 | Training Type | `RADIO` | `JO25qx6HcrRRGoXkbZFz` | `contact.pl_training_type` |
| 6 | Age Group | `RADIO` | `m3rgTNuU5DuXDkyIdoQO` | `contact.pl_age_group` |
| 7 | Package | `RADIO` | `jxUbJ6t59K24i7VoWTur` | `contact.pl_package` |
| 8 | Preferred Date | `DATE` | `5ISTUUKJOavRZc7vBJlx` | `contact.pl_preferred_date` |
| 9 | Preferred Time | `TIME` | `gsZUjGj4bJGTjINhdyUE` | `contact.pl_preferred_time` |
| 10 | Full Name | `TEXT` | `LCZiD1DmcFhRPPol1Xbc` | `contact.pl_contact_name` |
| 11 | Phone Number | `PHONE` | `tsE8g8jrAmtjlooOHpcX` | `contact.pl_contact_phone` |
| 12 | Email Address | `TEXT` | `do6jyYCs9EyGPhLPSmpN` | `contact.pl_contact_email` |

### Rent-A-Sensei, live GHL IDs (Systema Floyd FL)

Created 2026-05-14 via `.claude/scratch/ghl_create_form_fields.py`.
Map written to `.claude/scratch/ghl_rent_a_sensei_ids.json`.

**Folder**: `Rent-A-Sensei`, id `RbjiHT0moCfDgm5OEnHW`

**Destination Google Sheet**: `Rent-A-Sensei Booking`, id `1zHDDtoHrjM8uoBsBoVffT09BqOZKRKPFfCDQEpi2CgE`. Column order on `Sheet1`: `Contact ID | Parent Name | Phone | Email | Service Type | Number of Children | Duration | Full Address | Date | Start Time | End Time | Confirm: not for parties or events | Special instructions / extra children info` (13 cols).

**GHL form (PUBLISHED 2026-05-22 by Amina)**: form id `myEoOLL1SKGv0IvSF4ur`
- Form builder: `https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/form-builder-v2/myEoOLL1SKGv0IvSF4ur`
- Embed location: [funnel/rent-a-sensei.html](../funnel/rent-a-sensei.html), `.ras-block#register` section (2026-05-23). The page's "Looking for a party?" CTA now points at `/birthday-parties` so users on Rent-A-Sensei who actually want a party flow get routed correctly.
- **Verification pending**: see [ClickUp 86ahnq2z2](https://app.clickup.com/t/86ahnq2z2).

| # | Label | Type | Field ID | Field Key |
|---|---|---|---|---|
| 1 | Service Type | `RADIO` | `tVvxHXE0BTzsfxYl4MKG` | `contact.ras_service_type` |
| 2 | Number of Children | `RADIO` | `Uj9ks7LGvM8ktbwBOwV2` | `contact.ras_num_children` |
| 3 | Duration | `RADIO` | `ARSwE9pJ06KJYX0LnaOT` | `contact.ras_duration` |
| 4 | Full Address | `TEXT` | `O6GFJ6sNFoUagmdd8ZO2` | `contact.ras_address` |
| 5 | Date | `DATE` | `K5Pc8pQFCeBemDEkeH5a` | `contact.ras_date` |
| 6 | Start Time | `TIME` | `jzBUh8W0TOZmAViareOt` | `contact.ras_start_time` |
| 7 | End Time | `TIME` | `TtP6R6L2UkghX4HQAsrb` | `contact.ras_end_time` |
| 8 | Parent Name | `TEXT` | `5qDvryYkMEDctfJoQ2Xl` | `contact.ras_parent_name` |
| 9 | Phone | `PHONE` | `T3P6Je57aJXV3pHwrYPj` | `contact.ras_parent_phone` |
| 10 | Email | `TEXT` | `Bsbz0A0pWpUKG76gpzZV` | `contact.ras_parent_email` |
| 11 | Confirm: not for parties or events | `CHECKBOX` | `QPLML2pF756ANddSifu9` | `contact.ras_acknowledgment` |
| 12 | Special instructions / extra children info | `LARGE_TEXT` | `jGkL6wJBjtKHMsNSbB9n` | `contact.ras_special_instructions` |

### Balloons, live GHL IDs (Systema Floyd FL)

Created 2026-05-14 via `.claude/scratch/ghl_create_form_fields.py`.
Map written to `.claude/scratch/ghl_balloons_ids.json`.

**Folder**: `Balloons`, id `Snj5a0BsE8Y6ehLgXwl8`

**Destination Google Sheet**: `Balloons by Balloons on the Ave`, id `1OZbb_0lmCCSRKZHn0X_UgDkY_Sckbw2qyt2H3gIRDJ8`. Column order on `Sheet1`: `Contact ID | Full Name | Phone | Email | Garland | Additional Feet of Garland | Columns | Arch | Balloon Wall / Backdrop | Add-Ons (range-priced) | Delivery Fee | Setup Complexity | Optional Fees | Party Theme | Primary Color | Secondary Color | Accent Color | Notes for Emily` (18 cols).

**GHL form (PUBLISHED 2026-05-18 by Amina)**: form id `SvXq0KmUb1Ct2AR2t8Yl`
- Form builder: `https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/form-builder-v2/SvXq0KmUb1Ct2AR2t8Yl`
- Routing workflow: `daef2d02-ca0f-4fdf-994c-a7757ff2de12` (`https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/workflow/daef2d02-ca0f-4fdf-994c-a7757ff2de12`)
- Customer auto-responder email: `https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/emails/create/6a08dd232e0cb0d9fd298941/builder?folderId=69e7b6c0f243c4d4a38bcec7&pageNumber=1`
- Internal notification email: `https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/emails/create/6a09baa3b7836876f2bcd64c/builder?folderId=69e7b6462922186f24cb3b7a&pageNumber=1`
- **Verification pending**: cannot pull a sample submission until the GHL token is refreshed (see [forms_todos.md](./forms_todos.md) §2026-05-19). Field IDs in the table above were created via API on 2026-05-14, but Amina may have added Rule A duplicate fields or restructured options when she built the form. Confirm field IDs match a real submission before the bot writes to the sheet.

| # | Label | Type | Field ID | Field Key |
|---|---|---|---|---|
| 1 | Garland | `RADIO` | `NgH8RGRgtisBtbWyEqiP` | `contact.bal_garland` |
| 2 | Additional Feet of Garland | `NUMERICAL` | `7eKUJW88eiyN2yeXNFT6` | `contact.bal_garland_extra_feet` |
| 3 | Columns | `MULTIPLE_OPTIONS` | `RO0xzR1IU1WRWEOmXpNg` | `contact.bal_columns` |
| 4 | Arch | `RADIO` | `qrWRc6GRCWQsinxgvkaj` | `contact.bal_arch` |
| 5 | Balloon Wall / Backdrop | `RADIO` | `zin97S10jzsx5OG820Vl` | `contact.bal_wall` |
| 6 | Add-Ons (range-priced) | `MULTIPLE_OPTIONS` | `QrwTL3UiBXtZCfqaX0I8` | `contact.bal_addons` |
| 7 | Delivery Fee | `RADIO` | `lVlCygHaoeF8Eo9q22jn` | `contact.bal_delivery` |
| 8 | Setup Complexity | `RADIO` | `OQj4Vy8csQlNX6SlHJRA` | `contact.bal_setup_complexity` |
| 9 | Optional Fees | `MULTIPLE_OPTIONS` | `TLf16K3hfjE5K0CFbOja` | `contact.bal_optional_fees` |
| 10 | Party Theme | `TEXT` | `Q8YWJQlSiOOShOrszL1K` | `contact.bal_theme` |
| 11 | Primary Color | `TEXT` | `qVrRHhQ58cUXPkvdTUyr` | `contact.bal_primary_color` |
| 12 | Secondary Color | `TEXT` | `nILU7wT94JtKjtdShgib` | `contact.bal_secondary_color` |
| 13 | Accent Color | `TEXT` | `ewqqWviYBsUTf1KvJzDk` | `contact.bal_accent_color` |
| 14 | Notes for Emily | `LARGE_TEXT` | `JqBcKlhr1886D5nrgp1J` | `contact.bal_notes` |

### Vladimir Seminar, PUBLISHED 2026-05-18 (field IDs still TBD)

Despite the prior status of "blocked on Tom", Amina shipped the form
on 2026-05-18 with a working custom-field folder. Tom's blockers
(dates, pricing, waiver) appear to have been resolved out-of-band
or the form was built with placeholder copy.

**Destination Google Sheet**: `Vladimir Vasiliev Seminar Registration`, id `1BvGvrZ05oJolMGwyOm7BO0hZyZlMxv6D_UZviIOdH2Y`. Column order on `Sheet1`: `Contact ID | Full Name | Phone | Email | Pass Selection | Experience Level | Emergency Contact Name | Emergency Contact Phone | T-Shirt Size | Dietary Restrictions or Allergies | How did you hear about the seminar?` (11 cols).

**GHL form (PUBLISHED 2026-05-18 by Amina)**: form id `Zu7nHwEILIJnkKyvtnbB`
- Form builder: `https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/form-builder-v2/Zu7nHwEILIJnkKyvtnbB`
- Custom field folder (parent id): `RTmnCYg8pRee35YYFhyp` (visible at `https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/settings/fields?tab=field&page=1&parentId=RTmnCYg8pRee35YYFhyp&query=&object=contact`)
- Routing workflow: `fc38613d-42ad-408c-80f5-0a18bb75c6d4` (`https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/workflow/fc38613d-42ad-408c-80f5-0a18bb75c6d4`)
- Email: `https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/emails/create/6a08be8edad26e8300b9b55b/builder?folderId=69e7b6462922186f24cb3b7a&pageNumber=1&folderPageNumber=1`
- **Field IDs TBD**: the custom fields were not pre-created by our `ghl_create_form_fields.py` script. They were created inline by Amina when she built the form (parent `RTmnCYg8pRee35YYFhyp`). The PIT in Supabase currently lacks the active scope to GET `/locations/{loc}/customFields`, and even submissions endpoints 401 right now (token stale, see [forms_todos.md](./forms_todos.md) §2026-05-19). Once the token is refreshed, pull a sample submission and map `others.<fieldId>` → sheet column. Until then, the dormant `_dcCheckVasilievSeminar()` stub in DiscrepancyCheck.js stays a no-op.

### GHL API quirks worth remembering for the next form

1. **Folders use `documentType: "folder"`** on the same `/locations/{loc}/customFields` endpoint as fields, there is NO separate folder endpoint for contact custom fields (the v2 `/custom-fields/folder` is for custom objects only)
2. **Do NOT pass `objectKey`** on contact custom-field endpoints, that's the v2 custom-objects API and triggers `422 property objectKey should not exist`
3. **`options` must be a plain string array** (`["Florida", "Virginia"]`), NOT objects like `{key, label}`, sending objects triggers the cryptic `v.trim is not a function` 400 error
4. **Accepted `dataType` values:** `TEXT, LARGE_TEXT, NUMERICAL, PHONE, MONETORY, CHECKBOX, SINGLE_OPTIONS, MULTIPLE_OPTIONS, FLOAT, TIME, DATE, TEXTBOX_LIST, FILE_UPLOAD, SIGNATURE, RADIO`, note GHL **does** have `TIME` (use it for time-of-day fields instead of `TEXT`)
5. **Folder listing**: folders don't appear in `GET /customFields`, to dedup by name, walk the unique `parentId`s of the existing fields and GET each one to check its name
6. **`CHECKBOX` also requires `options`**: the checkbox label is provided as the single string in the `options` array (e.g. `["I confirm this service is not for parties or events"]`). Without `options`, GHL returns `422 "options must contain at least 1 elements"`. Single-line confirmation checkboxes feel weird in this shape but it's the only path.
7. **Windows console encoding**: Python's default Windows console codec (`cp1252`) chokes on box-drawing chars in script output. Use ASCII (`==`) instead of `══` in print statements, or set `PYTHONIOENCODING=utf-8`

---

## GHL `dataType` selection rules

GoHighLevel custom fields support these types:

| Type | Best for | Customer sees |
|---|---|---|
| `TEXT` | Single-line free text (names, addresses, short answers) | One-line input |
| `LARGE_TEXT` | Multi-line free text (notes, allergies, instructions) | Textarea |
| `NUMERICAL` | Numeric input only (age, count) | Number input |
| `PHONE` | Phone numbers (auto-formats) | Phone input |
| `MONETORY` | Currency display | Read-only currency value (not great for input) |
| `CHECKBOX` | Single yes/no, agreement, opt-in | One checkbox |
| `SINGLE_OPTIONS` | Pick ONE from a list of **6 or more** | Dropdown (less screen real estate) |
| `RADIO` | Pick ONE from a list of **2–5** | Radio group (all visible at once) |
| `MULTIPLE_OPTIONS` | Pick MULTIPLE from a list | Multi-select checkboxes |
| `DATE` | Calendar date | Date picker |
| `TEXTBOX_LIST` | Variable-length list of short text entries | Repeating text rows |
| `FILE_UPLOAD` | Upload a document, image, PDF | File picker |
| `SIGNATURE` | E-signature on a waiver | Signature pad |

**Rule of thumb used throughout this spec:**

- 2–5 options → `RADIO` (better UX, all visible)
- 6+ options → `SINGLE_OPTIONS` (dropdown, avoids clutter)
- Multi-select → always `MULTIPLE_OPTIONS`
- GHL has no native time-picker custom field → we use `TEXT` with a clear placeholder for time-of-day fields

**Pricing syntax inside option strings** (so the billing dashboard parser extracts amounts automatically, same pattern as the camp `Lunch` column):

| Pattern | Meaning | Example |
|---|---|---|
| `Label ($N)` | Flat price | `Standard Arch ($450)` |
| `Label ($N/unit)` | Per-unit price | `1 Child ($25/hour)` |
| `Label (+$N)` | Add-on on top of base | `2 Students (+$25)` |
| `Label (+$N/unit)` | Per-unit add-on | `Each additional foot (+$30/foot)` |
| `Label ($N, $M)` | Quote range (final price set manually) | `Foil Balloons ($10 to $30 each)` |

Florida sales tax (7%) applies to food and clothing line items only.
Transaction fee (3% flat) applies to the order total at checkout.

Field-key naming: `contact.{form}_{field}` in snake_case so keys are unique
across the location.

---

## 1. Vladimir Seminar (Priority #1)

> Annual flagship weekend event in **September or October**. Pricing and waiver
> still blocked on Tom sending the existing-page link he promised April 24.

| # | Label (customer-facing) | Placeholder / help text | Type | Req | Field key | Options / notes |
|---|---|---|---|---|---|---|
| 1 | Student Name | First and last name | `TEXT` | ✓ | `vladimir_student_name` | |
| 2 | Date of Birth | | `DATE` | ✓ | `vladimir_dob` | |
| 3 | Email Address | We'll send your confirmation here | `TEXT` | ✓ | `vladimir_email` | email validation |
| 4 | Phone Number | | `PHONE` | ✓ | `vladimir_phone` | |
| 5 | Emergency Contact Name | Someone we can reach during the seminar | `TEXT` | ✓ | `vladimir_emerg_contact_name` | |
| 6 | Emergency Contact Phone | | `PHONE` | ✓ | `vladimir_emerg_contact_phone` | |
| 7 | Home School / Systema Affiliation | If you train regularly with another school | `TEXT` | | `vladimir_home_school` | |
| 8 | City + State | Where are you traveling from? | `TEXT` | | `vladimir_city_state` | |
| 9 | Systema Experience Level | | `RADIO` | ✓ | `vladimir_experience_level` | `None, first seminar` · `Beginner (< 1 year)` · `Intermediate (1-3 years)` · `Advanced (3+ years)` · `Instructor` |
| 10 | Have you trained with Vladimir Vasiliev before? | | `CHECKBOX` | | `vladimir_prior_vasiliev` | |
| 11 | Other martial arts background | Other styles, ranks, experience | `LARGE_TEXT` | | `vladimir_other_arts` | |
| 12 | Registration Type | Choose your pass | `RADIO` | ✓ | `vladimir_registration_type` | `Full Weekend Pass ($ {weekend_price} /weekend)` · `Saturday Only ($ {sat_price} /day)` · `Sunday Only ($ {sun_price} /day)` · `Early Bird Full Weekend ($ {early_bird_price} /weekend)` |
| 13 | Event T-Shirt | Optional add-on | `SINGLE_OPTIONS` | | `vladimir_tshirt` | `None` · `Small (+$ {shirt_price} )` · `Medium (+$ {shirt_price} )` · `Large (+$ {shirt_price} )` · `XL (+$ {shirt_price} )` · `XXL (+$ {shirt_xxl_price} )` |
| 14 | Medical Conditions or Injuries | Anything our instructors should know | `LARGE_TEXT` | | `vladimir_medical` | |
| 15 | Allergies | Food, environmental, medication | `LARGE_TEXT` | | `vladimir_allergies` | |
| 16 | Liability Waiver | Sign to confirm you've read and accept the waiver | `SIGNATURE` | ✓ | `vladimir_waiver_signature` | use existing seminar waiver |
| 17 | Photo / Video Release | I consent to being photographed / filmed at the event | `CHECKBOX` | | `vladimir_photo_release` | |
| 18 | Anything else we should know? | | `LARGE_TEXT` | | `vladimir_notes` | |

### Still needed from Tom
- Date(s) of the weekend
- Link to existing seminar registration page
- Existing waiver PDF / link
- All `{ }` prices above
- Capacity cap (sold-out logic)

---

## 2. Private Lessons (Priority #2), *ALL PRICING CONFIRMED*

> Source: 3 photos titled *"Systema Floyd – Private Lesson Booking Form
> Requirements"* sent May 5.

| # | Label | Placeholder / help text | Type | Req | Field key | Options / notes |
|---|---|---|---|---|---|---|
| 1 | State | Where will you train? | `RADIO` | ✓ | `pl_state` | `Florida` · `Virginia` |
| 2 | Instructor | Filtered by your state choice | `SINGLE_OPTIONS` | ✓ | `pl_instructor` | **FL:** `Mr. Floyd (Premium)` · `Alex` · `George` · `James` · `Sean` · `Evenson (Boxing Only)` · `Jessica (Dance)` · `Bianca (Dance)` · `Carolina (Dance)` · **VA:** `Ryan` |
| 3 | Lesson Length & Price | Price shown matches your instructor tier | `SINGLE_OPTIONS` | ✓ | `pl_lesson_selection` | Show ONE of these blocks based on the instructor:<br>**Standard tier:** `Standard 30 min ($100/session)` · `Standard 45 min ($125/session)` · `Standard 1 hour ($150/session)`<br>**Premium tier (Mr. Floyd):** `Mr. Floyd 30 min ($170/session)` · `Mr. Floyd 45 min ($200/session)` · `Mr. Floyd 1 hour ($225/session)` |
| 4 | Number of Students | Up to 3 students per session | `RADIO` | ✓ | `pl_num_students` | `1 Student` · `2 Students (+$25)` · `3 Students (+$50)` |
| 5 | Training Type | What do you want to work on? | `RADIO` | ✓ | `pl_training_type` | **Default:** `Martial Arts` · `Fitness` · `Sports` · `Combination`<br>**If Evenson:** `Boxing` (locked)<br>**If Jessica / Bianca / Carolina:** `Dance` (locked) |
| 6 | Age Group | Affects recommended duration | `RADIO` | ✓ | `pl_age_group` | `Ages 2.5–6 (30 min recommended)` · `Ages 7+` |
| 7 | Package | Save when you commit to a pack | `RADIO` | ✓ | `pl_package` | `Single Session` · `10 Sessions Pack (Get 1 Free, pay for 10, receive 11)` |
| 8 | Preferred Date | First-choice day | `DATE` | ✓ | `pl_preferred_date` | |
| 9 | Preferred Time | e.g. 4:00 PM | `TEXT` | ✓ | `pl_preferred_time` | GHL has no time-picker, capture as text |
| 10 | Full Name | First and last | `TEXT` | ✓ | `pl_contact_name` | |
| 11 | Phone Number | | `PHONE` | ✓ | `pl_contact_phone` | |
| 12 | Email Address | | `TEXT` | ✓ | `pl_contact_email` | email validation |

### Conditional display rules

- **Field 2 (Instructor)** filters by Field 1 (State): show only FL instructors when FL, only Ryan when VA
- **Field 3 (Lesson Length & Price)** swaps the price block when Field 2 = `Mr. Floyd (Premium)`
- **Field 5 (Training Type)** locks to a single option when Field 2 = Evenson / Jessica / Bianca / Carolina

### Pricing logic (engineer reference, not a field)

```
total = lesson_price (from #3)
      + additional_students_surcharge (from #4)
      + transaction_fee (3% of total)

If package = "10 Sessions Pack":
  total = 10 × per-session price   (parent receives 11 sessions)
```

---

## 3. Birthday Parties (Priority #3), *PRICES MISSING — NOT YET BUILT*

> Source: `IMG_0316.jpeg` from Juliana on May 4. No prices yet, each priced
> option below has `($ {…} )` until Tom sends them.

> **NOT THE SAME AS THE BALLOONS FORM.** Balloons (§5 below, GHL id
> `SvXq0KmUb1Ct2AR2t8Yl`) is the *decoration sub-form for Emily*
> — it lives inside the Birthday Parties flow as one of the Special
> Add-Ons. The Birthday Parties form itself is a separate, larger
> form covering venue choice, party size, food, premium extras, etc.
> and **does not exist in GHL yet**.
>
> Tom escalated on **2026-05-22** ("Party page" email thread) asking
> for the party page to have its own choices (home vs Systema gym vs
> event space, party-size tiers, date, theme, age range). Emilio
> committed in the reply but cannot build until Tom sends the 17 prices
> below. Until then, [funnel/birthday-parties.html](../funnel/birthday-parties.html)
> embeds the Balloons form as a placeholder so visitors hit *something*
> bookable.

| # | Label | Placeholder / help text | Type | Req | Field key | Options / notes |
|---|---|---|---|---|---|---|
| 1 | Event Type | | `RADIO` | ✓ | `bp_event_type` | `Birthday Party` · `Private Event` · `School Event` · `Corporate` · `Other` |
| 2 | Event Location | Where will the party be held? | `RADIO` | ✓ | `bp_event_location` | `At Systema Floyd Gym ($ {gym_base_price} )` · `At My Home ($ {home_base_price} )` · `At Event Space ($ {event_space_price} )` |
| 3 | Address | Required if at home or event space | `TEXT` | conditional | `bp_address` | shown when #2 ≠ Gym |
| 4 | Date of Event | | `DATE` | ✓ | `bp_event_date` | |
| 5 | Preferred Start Time | e.g. 2:00 PM | `TEXT` | ✓ | `bp_start_time` | |
| 6 | Birthday Child's Name | | `TEXT` | ✓ | `bp_birthday_child_name` | |
| 7 | Age of Birthday Child | Turning… | `NUMERICAL` | ✓ | `bp_birthday_child_age` | |
| 8 | Total Number of Kids | Estimate including the birthday child | `RADIO` | ✓ | `bp_num_kids` | `10 Kids ($ {kids_10_price} )` · `15 Kids ($ {kids_15_price} )` · `20 Kids ($ {kids_20_price} )` · `25+ Kids ($ {kids_25plus_price} )` |
| 9 | Age Range of Kids | | `SINGLE_OPTIONS` | ✓ | `bp_age_range` | `2.5–4` · `5–6` · `7–9` · `10–12` · `13+` · `Mixed` (6 options → dropdown) |
| 10 | If Mixed, describe breakdown | e.g. "Half are 5-6, half are 10-12" | `TEXT` | conditional | `bp_mixed_breakdown` | shown when #9 = Mixed |
| 11 | Event Duration | | `RADIO` | ✓ | `bp_duration` | `1 Hour ($ {duration_1h_price} )` · `2 Hours ($ {duration_2h_price} )` · `3+ Hours ($ {duration_3h_price} )` |
| 12 | Party Activities | Pick all that apply | `MULTIPLE_OPTIONS` | | `bp_activities` | `Martial Arts` · `Nerf` · `Dodgeball` · `Obstacle Course` · `Laser Tag` · `Dance` · `Custom` |
| 13 | Custom Theme Details | If you picked Custom above | `TEXT` | conditional | `bp_custom_theme` | shown when #12 includes Custom |
| 14 | Food Options | (FL sales tax applies) | `MULTIPLE_OPTIONS` | | `bp_food_options` | `Pizza (+$ {pizza_price} )` · `Drinks (+$ {drinks_price} )` · `Cake (+$ {cake_price} )` |
| 15 | Special Add-Ons | | `MULTIPLE_OPTIONS` | | `bp_special_addons` | `Custom Balloon Decor, see balloon menu` ← triggers §5 · `Decorations Setup (+$ {decor_price} )` · `Extra Instructor (+$ {extra_instructor_price} )` · `Goodie Bags (+$ {goody_bags_price} /guest)` · `Custom Shirt for Birthday Child (+$ {birthday_shirt_price} )` |
| 16 | Premium Extras | Additional rental fees | `MULTIPLE_OPTIONS` | | `bp_premium_extras` | `Bounce House Rental (+$ {bounce_house_price} )` · `Laser Tag Rental (+$ {laser_tag_price} )` · `Gaga Ball Arena Rental (+$ {gaga_ball_price} )` · `Inflatable Soccer Arena Rental (+$ {soccer_arena_price} )` · `Board Breaking Upgrade (+$ {board_break_price} )` · `Foam Party / Slip & Slide (+$ {foam_party_price} )` |
| 17 | Parent Name | | `TEXT` | ✓ | `bp_parent_name` | |
| 18 | Phone Number | | `PHONE` | ✓ | `bp_parent_phone` | |
| 19 | Email Address | | `TEXT` | ✓ | `bp_parent_email` | email validation |

### Still needed from Tom
- 17 prices (all `{ }` placeholders above)
- Whether there's a packaged tier (Basic / Standard / Premium) vs everything à la carte
- Deposit policy (deposit at booking + balance, or full payment up-front)

---

## 4. Rent-A-Sensei (Babysitting), *ALL PRICING CONFIRMED*

> Source: 3 photos titled *"Systema Floyd – Rent-A-Sensei (Babysitting)
> Requirements"* sent May 5. **In-home babysitting only, NOT parties/events.**

Show this banner above the form (not a field):

> In-home babysitting service with energetic professional Senseis. Focused on
> supervision, engagement, and active play (games, movement, structured
> activity). **Not for parties, events, or large group bookings.**
> 3-hour minimum per booking.

| # | Label | Placeholder / help text | Type | Req | Field key | Options / notes |
|---|---|---|---|---|---|---|
| 1 | Service Type | | `RADIO` | ✓ | `ras_service_type` | `Rent-A-Sensei (Babysitting)` (single option, locked), kept as a field so the routing logic can read it |
| 2 | Number of Children | Rate adjusts automatically | `RADIO` | ✓ | `ras_num_children` | `1 Child ($25/hour)` · `2 Children ($30/hour)` · `3 Children ($35/hour)` |
| 3 | Duration | Minimum 3 hours | `RADIO` | ✓ | `ras_duration` | `3 hours (minimum)` · `4 hours` · `5+ hours` |
| 4 | Full Address | Including city + ZIP, used for travel-fee quote | `TEXT` | ✓ | `ras_address` | |
| 5 | Date | | `DATE` | ✓ | `ras_date` | |
| 6 | Start Time | e.g. 6:00 PM | `TEXT` | ✓ | `ras_start_time` | |
| 7 | End Time | e.g. 9:00 PM | `TEXT` | ✓ | `ras_end_time` | |
| 8 | Parent Name | | `TEXT` | ✓ | `ras_parent_name` | |
| 9 | Phone | | `PHONE` | ✓ | `ras_parent_phone` | |
| 10 | Email | | `TEXT` | ✓ | `ras_parent_email` | email validation |
| 11 | Confirm: not for parties/events | I confirm this service is not for parties or events | `CHECKBOX` | ✓ | `ras_acknowledgment` | |
| 12 | Special instructions / extra children info | Allergies, bedtimes, anything we should know | `LARGE_TEXT` | | `ras_special_instructions` | |

### Server-side logic (not form fields)

- **Sensei auto-filter by age:**
  - Ages 6 months – 3 years old → assign **Female Sensei only**
  - Ages 4+ → Male or Female Sensei available
- **Travel / Gas Fee:** quoted by Tom's team based on driving time and distance, **not** auto-calculated on the form
- **Footer note** to display (not a field): *"Tipping your Sensei is greatly appreciated. Not required, but encouraged for excellent service."*

---

## 5. Balloons add-on *(conditional sub-form inside Birthday Parties)*, *ALL PRICING CONFIRMED*

> Source: `image0.png` (1024×1024) sent May 5, *"Premium Balloon Design
> Menu."* Run by Emily (Tom's wife), `Balloonsontheave@gmail.com`. Triggered
> from §3 Birthday Parties Special Add-Ons when **Custom Balloon Decor** is
> selected. **Minimum booking $300 (block submission below).**

| # | Label | Placeholder / help text | Type | Req | Field key | Options / notes |
|---|---|---|---|---|---|---|
| 1 | Garland | Organic / custom styling included | `RADIO` | | `bal_garland` | `None` · `5 ft Garland ($140)` · `Custom length, base 5 ft ($140) + each additional foot (+$30/foot)` |
| 1b | Additional feet of garland | Only fill in if you picked "Custom length" above | `NUMERICAL` | conditional | `bal_garland_extra_feet` | each foot = `(+$30/foot)` |
| 2 | Columns | Pick any | `MULTIPLE_OPTIONS` | | `bal_columns` | `Classic Column ($100)` · `Organic Column ($150)` · `Table Centerpieces ($50)` |
| 3 | Arch | Floor arch over the entrance / dessert table | `RADIO` | | `bal_arch` | `None` · `Standard Arch ($450)` · `Deluxe Arch, includes vinyl wording ($600)` · `Walk-Through Arch ($750+)` |
| 4 | Balloon Wall / Backdrop | Quote-based; we'll confirm exact pricing after submission | `RADIO` | | `bal_wall` | `None` · `Starting at $800, request quote` |
| 5 | Add-Ons (range-priced) | Final price confirmed by Emily after submission | `MULTIPLE_OPTIONS` | | `bal_addons` | `Foil Balloons ($10 to $30 each)` · `Custom Vinyl Wording ($50 to $100)` · `Backdrop / Stand Rental ($150 to $250)` · `Florals ($100 to $200)` · `Custom Cutouts ($50 to $150)` |
| 6 | Delivery Fee | Based on distance | `RADIO` | ✓ | `bal_delivery` | `Local (+$25)` · `Mid-distance (+$50)` · `Long-distance (+$75)` |
| 7 | Setup Complexity | We'll size this with you | `RADIO` | ✓ | `bal_setup_complexity` | `Simple setup (+$50)` · `Standard setup (+$100)` · `Complex install (+$150)` |
| 8 | Optional Fees | Add only if applicable | `MULTIPLE_OPTIONS` | | `bal_optional_fees` | `Breakdown / removal (+$50)` · `Same-Day / Rush (+$100)` · `Early Morning / Late Night Setup (+$50)` · `Outdoor Setup, weather risk & reinforcement (+$50)` · `Damage Waiver, recommended for large installs` |
| 9 | Party theme | e.g. "Unicorn", "Star Wars", "Pastel pink + gold" | `TEXT` | | `bal_theme` | |
| 10 | Primary color | Hex code or color name | `TEXT` | ✓ | `bal_primary_color` | |
| 11 | Secondary color | | `TEXT` | | `bal_secondary_color` | |
| 12 | Accent color | | `TEXT` | | `bal_accent_color` | |
| 13 | Notes for Emily | Anything specific you want her to know | `LARGE_TEXT` | | `bal_notes` | |

### Form-level validation
- Reject submission if computed subtotal < `$300` (minimum booking floor)
- Show `Subtotal: $___ (Minimum: $300)` live as the customer selects items

### Routing
On submit: Systema Floyd takes payment via the same Square integration as
other forms; the order detail + theme/color fields are forwarded to
`Balloonsontheave@gmail.com` for fulfillment.

---

## 6. Teen & Adult Classes *(PAUSED)*

Tom on May 5: *"We actually need our class schedule for next year or the next
school year for our gym."* Skip until the next school-year schedule is
finalized.

When unpaused we'll need: day-of-week schedule, drop-in vs. monthly pricing,
belt/rank prerequisite logic, and a trial class offering (typically first
class free or `Trial Class ($X)`).

---

## Build sequence

| # | Form | Tom's priority | Status | Buildable now? |
|---|---|---|---|---|
| 1 | **Vladimir Seminar** | #1 | Blocked, needs date, page link, pricing, capacity | ❌ |
| 2 | **Private Lessons** | #2 | All pricing confirmed | ✅ |
| 3 | **Birthday Parties** | #3 | Fields confirmed, **17 prices missing** | ❌ (skeleton only) |
| 4 | **Rent-A-Sensei** | not ranked | All pricing confirmed | ✅ |
| 5 | **Balloons** (sub-form) | not ranked | All pricing confirmed | ✅ |
| 6 | **Teen & Adult Classes** | paused | Waiting on next school year schedule | ❌ |

## Conventions

- Required fields marked `✓`
- Conditional fields only shown when their parent option triggers them
- All pricing baked into the option string itself, using `Label ($N/unit)` or `Label (+$N)` (same syntax the camp `Lunch` column uses)
- Form-level fees applied at checkout: **3% transaction fee** on order total · **7% FL sales tax** on food/clothing line items only
- Every form ends with a liability waiver checkbox or signature field
- Field keys all use `contact.{form_prefix}_{snake_case_name}` so they're greppable and unique across the location
- GHL `dataType` choice rule of thumb: ≤5 options → `RADIO`, 6+ options → `SINGLE_OPTIONS`, multi-select → `MULTIPLE_OPTIONS`
