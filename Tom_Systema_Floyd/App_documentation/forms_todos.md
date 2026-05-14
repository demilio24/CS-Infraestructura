# Systema Floyd, Forms Build TODOs

Per-form punch list. Status as of **2026-05-14**.
Spec lives in [new_forms_spec.md](./new_forms_spec.md). Build order per
Tom's May 13 call: Vladimir Seminar, Private Lessons, Birthday Parties.

---

## 1. Vladimir Seminar, Priority #1, BLOCKED

Tom said this is his **#1 build priority**. Annual flagship weekend
event in September or October. We cannot move until Tom unblocks.

### Needed from Tom

- [ ] Exact date(s) of the seminar weekend
- [ ] Link to the existing registration page (Tom said April 24 *"she'll send it to you"*, never arrived)
- [ ] Pricing: Full Weekend Pass, Saturday Only, Sunday Only, Early Bird Full Weekend
- [ ] T-shirt pricing (event tee, separate from camp tees)
- [ ] Capacity cap (for sold-out logic)
- [ ] Existing waiver PDF or link, they reuse it every year
- [ ] Photo / video release wording (or confirm reuse of camp release)

A draft email to Tom requesting all this info was created on 2026-05-14
and lives in Gmail Drafts.

### Our work once unblocked

- [ ] Build GHL custom field folder `Vladimir Seminar` via script
- [ ] Create 18 fields per spec
- [ ] Build GHL Form via Chrome extension or by Amina
- [ ] Wire redirect to `https://systemafloyd.com/waiver?email=...&name=...&phone=...`
- [ ] Add Florida tax and 3% transaction fee at checkout
- [ ] Add "Featured Event" banner to the Systema Floyd homepage with form embed

### Open questions

- Is Vladimir Vasiliev confirmed as the headline teacher this year, or is it a different visiting instructor? Tom said "Vladimir" verbally on May 13, confirm.
- Will there be a Friday pre-seminar workshop? Spec includes it as conditional.
- Travel discount or scholarship slots for instructors from other schools?

---

## 2. Private Lessons, Priority #2, FIELDS LIVE, FORM ASSIGNED TO AMINA

### Done

- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields plus conditional logic
- [x] GHL folder `Private Lessons` (id `X4a97HKQJdXVkGV6R4Vg`) and 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_private_lessons_ids.json`
- [x] ClickUp task created and assigned to Amina, due Saturday 2026-05-16 ([ClickUp 86ahfhfj3](https://app.clickup.com/t/86ahfhfj3))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpn](https://app.clickup.com/t/86ahfhfpn))

### Remaining (Amina)

- [ ] Compose form in GHL, use standard contact fields for Name / Phone / Email (not the custom ones)
- [ ] Verify conditional logic works in GHL (Rule A state filter, Rule B training-type lock, Rule C lesson tier swap)
- [ ] Publish form and capture form ID, public URL, iframe embed
- [ ] Add form embed to a public-facing page on systemafloyd.com
- [ ] Wire confirmation email template (auto-responder) matching existing Systema Floyd branding
- [ ] Add internal notification branch to the master workflow

### Open questions for Tom (in the draft email)

- Does the 10-Session Pack have an expiry date? Spec assumes no expiry.
- Cancellation and no-show policy text for the waiver.

---

## 3. Birthday Parties, Priority #3, BLOCKED ON PRICING

### Done

- [x] Juliana sent field structure on May 4 (`IMG_0316.jpeg`)
- [x] Spec'd all 19 fields

### Needed from Tom

- [ ] 17 prices (every `{ ... }` placeholder in the spec):
  - 3 venue base prices (Gym, Home, Event Space)
  - 4 head-count tiers (10 / 15 / 20 / 25+)
  - 3 duration prices (1h / 2h / 3+h)
  - 3 food add-on prices (Pizza, Drinks, Cake)
  - 5 special add-on prices (Decorations Setup, Extra Instructor, Goodie Bags, Birthday Child Shirt, and confirm Balloon Decor stays as the conditional sub-form trigger)
  - 6 premium extras (Bounce House, Laser Tag, Gaga Ball, Inflatable Soccer, Board Breaking, Foam Party)
- [ ] Package tiers, does Systema Floyd bundle Basic / Standard / Premium packages, or is everything a la carte?
- [ ] Deposit policy, full payment at booking, or deposit plus balance?
- [ ] Min advance notice, minimum days between booking and event date

### Our work once unblocked

- [ ] Update spec with confirmed prices
- [ ] Build GHL folder `Birthday Parties` plus 19 fields via script
- [ ] Build GHL Form via Chrome extension or Amina with conditional logic (Address shown when location is not Gym, Mixed breakdown shown when Age Range = Mixed, Custom theme shown when Activities includes Custom, Balloon sub-form triggered when Special Add-Ons includes Balloon Decor)
- [ ] Wire form-level minimum spend if applicable
- [ ] Wire waiver redirect with email / name / phone query params

---

## 4. Rent-A-Sensei (Babysitting), FIELDS LIVE, FORM ASSIGNED TO AMINA

### Done

- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields plus the age-based sensei filter
- [x] Confirmed this is **babysitting only** (not parties / events), explicit acknowledgment checkbox required
- [x] GHL folder `Rent-A-Sensei` (id `RbjiHT0moCfDgm5OEnHW`) plus all 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_rent_a_sensei_ids.json`
- [x] ClickUp task created and assigned to Amina, due Saturday 2026-05-16 ([ClickUp 86ahfhfjh](https://app.clickup.com/t/86ahfhfjh))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpt](https://app.clickup.com/t/86ahfhfpt))

### Remaining (Amina)

- [ ] Compose form in GHL, use standard contact fields for Parent Name / Phone / Email
- [ ] Wire age-based Female-Sensei-only filter as a server-side workflow (not a form field, age check happens during sensei assignment)
- [ ] Wire waiver redirect with email / name / phone query params
- [ ] Add the required banner above the form (in-home babysitting only, 3-hour minimum)
- [ ] Add the tipping footer below the submit button

### Open questions for Tom (in the draft email)

- Travel-fee table: should we publish a rough range up front, or keep fully manual?
- Insurance and liability for off-site work, does the waiver cover in-home location?
- Sensei roster, which staff are babysitting-qualified?

---

## 5. Balloons add-on, FIELDS LIVE, FORM ASSIGNED TO AMINA (sub-form of Birthday Parties)

Triggered when a Birthday Party customer selects "Custom Balloon Decor"
in the Special Add-Ons. Tom's wife Emily runs the work
(`Balloonsontheave@gmail.com`).

### Done

- [x] OCR'd Tom's pricing image (May 5)
- [x] Spec'd all 14 fields with prices
- [x] GHL folder `Balloons` (id `Snj5a0BsE8Y6ehLgXwl8`) plus all 14 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_balloons_ids.json`
- [x] ClickUp task created and assigned to Amina, due Saturday 2026-05-16 ([ClickUp 86ahfhfjp](https://app.clickup.com/t/86ahfhfjp))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpz](https://app.clickup.com/t/86ahfhfpz))

### Remaining (Amina)

- [ ] Compose form in GHL, use standard contact fields for the customer's Name / Phone / Email
- [ ] Wire conditional logic on the Additional Feet of Garland field (show only when Custom length is picked)
- [ ] Implement $300 minimum booking floor validation
- [ ] Auto-forward order detail to `Balloonsontheave@gmail.com` after submission
- [ ] Wire waiver redirect with email / name / phone query params

### Decision pending

The form will eventually be triggered as a conditional sub-form from
inside Birthday Parties. For now Amina is building it as a **standalone
form** so it can be referenced directly. We will wire the Birthday Party
trigger once that form is built.

### Open questions for Emily (in the draft email via Tom)

- Lead time required (days notice for orders)?
- Does she handle setup AND breakdown, or just delivery?
- Color choice handling, hex codes, named colors, or photo reference upload?
- Travel radius covered in the delivery-fee tiers we ranged (Local / Mid / Long)?

---

## 6. Teen and Adult Classes, PAUSED

Tom on May 5: *"We actually need our class schedule for next year or the
next school year for our gym."*

### Unblocked when Tom has

- [ ] Class schedule for the upcoming school year (days, times, age groups)
- [ ] Drop-in vs. monthly pricing decision
- [ ] Belt or rank prerequisite logic per class type
- [ ] Trial class policy (first class free? `$X` trial?)

### Our work once unblocked

- [ ] Spec out fields (estimate ~10 to 15 fields based on similar dojos)
- [ ] Build GHL folder plus fields via script
- [ ] Build GHL Form
- [ ] Wire waiver redirect

---

## Cross-cutting and system-level TODOs

These apply to ALL the forms above and should not be done per-form.

### Confirmation emails

- [ ] Create one shared GHL email template per form ("Step 2: Sign your waiver") triggered on form submission, in case the customer bounces before the redirect fires
- [ ] Include all three query params (email, name, phone) baked into the waiver link in the email body

### Waiver page

- [ ] Confirm `https://systemafloyd.com/waiver` is the canonical waiver URL across all forms
- [ ] Verify the waiver page reads `?email=`, `?name=`, `?phone=` from the URL and prefills the corresponding fields
- [ ] If it does not already, add prefill logic to the waiver page

### Billing dashboard parser

- [ ] Confirm the billing dashboard's pricing-string parser handles the new option syntax (`Standard 30 min ($100/session)`, `1 Child ($25/hour)`, etc.), same regex as the camp Lunch column
- [ ] Add the new contacts groups so non-camp registrations land in the right Square groups (Private Lessons, Rent-A-Sensei, Birthday Parties, etc.)

### Form analytics and dashboard integration

- [ ] Decide if we want a "Bookings dashboard" page mirroring the camp dashboard (would show daily / weekly volume per form type, MTD totals, etc.). Out of scope until at least 2 of the forms are live and submitting.

### Reusable build script

- [x] Generalized field-creation script lives at `.claude/scratch/ghl_create_form_fields.py`. It reads a Python dict (folder + fields) and creates everything idempotently. Reuse for Vladimir Seminar and Birthday Parties when those unblock.

### Em-dash cleanup in GHL field option strings

- [ ] Some of the GHL field option strings I created via the API contain em-dashes (e.g. *Deluxe Arch, includes vinyl wording ($600)*, *Foil Balloons ($10 to $30 each)*, *Custom length, base 5 ft ($140) + each additional foot (+$30/foot)*). These need to be updated via the API to remove em-dashes and replace with commas, colons, or "to" since the user's standing rule is no em-dashes in any customer-facing copy.

### Documentation hygiene

- [x] `new_forms_spec.md` updated with live GHL folder + field IDs for Private Lessons, Rent-A-Sensei, and Balloons
- [x] `forms_todos.md` updated to reflect ClickUp task assignments and email draft to Tom
- [ ] Once each form goes live, capture the form ID + public URL in `new_forms_spec.md`

---

## Suggested next move

1. Send the draft email to Tom (currently in Gmail Drafts) asking for the Vladimir Seminar and Birthday Party info
2. Amina builds the 3 GHL forms by Saturday 2026-05-16
3. When Tom replies with prices, fill in `new_forms_spec.md` placeholders and run the field-creation script for Vladimir Seminar and Birthday Parties
4. Then create two more ClickUp tasks for Amina to build those forms

If Tom's response on Vladimir is quick, prioritize building that one before Birthday Parties so the order matches his stated priority.
