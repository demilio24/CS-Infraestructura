# Systema Floyd — Forms Build TODOs

Per-form punch list. Status as of **2026-05-14**.
Spec lives in [new_forms_spec.md](./new_forms_spec.md). Build order per
Tom's May 13 call: Vladimir Seminar → Private Lessons → Birthday Parties.

---

## 1. Vladimir Seminar — Priority #1 — BLOCKED

Tom said this is his **#1 build priority**. Annual flagship weekend
event in September or October. We can't move until Tom unblocks.

### Needed from Tom
- [ ] **Exact date(s)** of the seminar weekend
- [ ] **Link to the existing registration page** (Tom said April 24 *"she'll send it to you"* — never arrived)
- [ ] **Pricing**: Full Weekend Pass, Saturday Only, Sunday Only, Early Bird Full Weekend
- [ ] **T-shirt pricing** (event tee — separate from camp tees)
- [ ] **Capacity cap** (for sold-out logic)
- [ ] **Existing waiver PDF/link** — they reuse it every year
- [ ] Photo/video release wording (or confirm reuse of camp release)

### Our work once unblocked
- [ ] Build GHL custom field folder `Vladimir Seminar` via script
- [ ] Create 18 fields per spec
- [ ] Build GHL Form via Chrome extension
- [ ] Wire redirect → `https://systemafloyd.com/waiver?email=...&name=...&phone=...`
- [ ] Add Florida tax + 3% transaction fee at checkout
- [ ] Add "Featured Event" banner to the Systema Floyd homepage with form embed

### Open questions
- Is Vladimir Vasiliev confirmed as the headline teacher this year, or is it a different visiting instructor? (Tom said "Vladimir" verbally on May 13 — confirm)
- Will there be a Friday pre-seminar workshop? Spec includes it as conditional.
- Travel discount or scholarship slots for instructors from other schools?

---

## 2. Private Lessons — Priority #2 — IN PROGRESS

### Done
- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields + conditional logic
- [x] GHL folder `Private Lessons` (id `X4a97HKQJdXVkGV6R4Vg`) and 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_private_lessons_ids.json`

### In progress
- [ ] GHL Form being built via Claude Chrome extension (waiver redirect + conditional logic)

### Remaining
- [ ] Verify conditional logic works in GHL (Rule A state-filter, Rule B training-type lock, Rule C lesson tier swap) — see the Chrome extension prompt for the test cases
- [ ] Publish form + capture form ID, public URL, iframe embed
- [ ] Add form embed to a public-facing page on systemafloyd.com (existing private-lesson landing? new sub-page?)
- [ ] Add a confirmation email template that reminds the customer to sign the waiver (in case they bounce before the redirect fires)
- [ ] Connect to the billing dashboard so per-session totals tally against contacts (same Google-Sheet → Supabase → dashboard pipe as camp)

### Open questions for Tom
- Does the **10 Sessions Pack** have an expiry date (e.g. must use within 6 months)? Spec assumes no expiry.
- Cancellation / no-show policy text for the waiver
- Is Mr. Floyd the only Premium-tier instructor, or are there future Premium senseis to add?

---

## 3. Birthday Parties — Priority #3 — BLOCKED ON PRICING

### Done
- [x] Juliana sent field structure on May 4 (`IMG_0316.jpeg`)
- [x] Spec'd all 19 fields

### Needed from Tom
- [ ] **17 prices** (every `{ … }` placeholder in the spec):
  - 3 venue base prices (Gym / Home / Event Space)
  - 4 head-count tiers (10 / 15 / 20 / 25+)
  - 3 duration prices (1h / 2h / 3+h)
  - 3 food add-on prices (Pizza, Drinks, Cake)
  - 5 special add-on prices (Decorations Setup, Extra Instructor, Goodie Bags, Birthday Child Shirt — and confirm Balloon Decor stays as the conditional sub-form trigger)
  - 6 premium extras (Bounce House, Laser Tag, Gaga Ball, Inflatable Soccer, Board Breaking, Foam Party)
- [ ] **Package tiers** — does Systema Floyd bundle Basic/Standard/Premium packages, or is everything à la carte?
- [ ] **Deposit policy** — full payment at booking, or deposit + balance?
- [ ] **Min advance notice** — minimum days between booking and event date?

### Our work once unblocked
- [ ] Update spec with confirmed prices
- [ ] Build GHL folder `Birthday Parties` + 19 fields via script
- [ ] Build GHL Form via Chrome extension with conditional logic (Address shown when location ≠ Gym, Mixed breakdown shown when Age Range = Mixed, Custom theme shown when Activities includes Custom, Balloon sub-form triggered when Special Add-Ons includes Balloon Decor)
- [ ] Wire form-level minimum spend if applicable
- [ ] Wire waiver redirect with email/name/phone query params

---

## 4. Rent-A-Sensei (Babysitting) — FIELDS LIVE, FORM NEXT

### Done
- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields + the age-based sensei filter
- [x] Confirmed this is **babysitting only** (not parties/events) — there's an explicit acknowledgment checkbox
- [x] GHL folder `Rent-A-Sensei` (id `RbjiHT0moCfDgm5OEnHW`) + all 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_rent_a_sensei_ids.json`

### To do
- [ ] Build GHL Form via Chrome extension
  - Required overview banner above form: *"In-home babysitting service…"* (not a field, must show)
  - Required acknowledgment checkbox: *"I confirm this service is not for parties or events"*
  - Required field: Full Address (used for travel-fee calculation)
  - Footer note: *"Tipping your Sensei is greatly appreciated…"*
- [ ] Wire age-based Female-Sensei-only filter as a server-side workflow (not a form field — the age check happens during sensei assignment)
- [ ] Wire waiver redirect with email/name/phone query params

### Open questions for Tom
- **Travel-fee table**: Tom said the fee is determined manually by Tom's team after booking. Should we add a "Travel Fee Range" radio (e.g. `< 10 miles (free)` / `10-25 miles (+$15)` / `25-50 miles (+$30)` / `50+ miles (custom quote)`) to set expectations up front, or keep it fully manual?
- Insurance / liability for in-home work — does the waiver cover off-site location?
- Sensei roster — which staff members are babysitting-qualified? (May affect availability messaging)

---

## 5. Balloons add-on — FIELDS LIVE, FORM NEXT (sub-form of Birthday Parties)

Triggered when a Birthday Party customer selects "Custom Balloon Decor"
in §3 Special Add-Ons. Tom's wife Emily runs the work
(`Balloonsontheave@gmail.com`).

### Done
- [x] OCR'd Tom's pricing image (May 5)
- [x] Spec'd all 14 fields with prices
- [x] GHL folder `Balloons` (id `Snj5a0BsE8Y6ehLgXwl8`) + all 14 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_balloons_ids.json`

### To do
- [ ] Build the balloon flow either as:
  - (a) A second GHL form linked from the Birthday Party confirmation, OR
  - (b) Conditional fields inside the Birthday Party form
  Recommendation: (a) — keeps Birthday Party form short, and triggers cleaner email routing to Emily
- [ ] Implement **$300 minimum booking floor** validation (server-side reject below; form should show running subtotal live)
- [ ] Auto-forward the order detail to `Balloonsontheave@gmail.com` (notification action) after submission
- [ ] Confirm fulfillment workflow with Emily — does Systema Floyd take payment and pay her out, or does she invoice separately?

### Open questions for Emily (via Tom)
- Lead time required (days notice for orders)?
- Does she handle setup AND breakdown, or just delivery?
- Color choice handling — hex codes, named colors, or photo reference upload?
- Travel radius covered in the delivery-fee tiers we ranged (Local / Mid / Long)?

---

## 6. Teen & Adult Classes — PAUSED

Tom on May 5: *"We actually need our class schedule for next year or
the next school year for our gym."*

### Unblocked when Tom has
- [ ] Class schedule for the upcoming school year (days, times, age groups)
- [ ] Drop-in vs. monthly pricing decision
- [ ] Belt/rank prerequisite logic per class type
- [ ] Trial class policy (first class free? `$X` trial?)

### Our work once unblocked
- [ ] Spec out fields (estimate ~10-15 fields based on similar dojos)
- [ ] Build GHL folder + fields via script
- [ ] Build GHL Form
- [ ] Wire waiver redirect

---

## Cross-cutting / system-level TODOs

These apply to ALL the forms above and shouldn't be done per-form.

### Confirmation emails
- [ ] Create one shared GHL email template per form ("Step 2: Sign your waiver") triggered on form submission, in case the customer bounces before the redirect fires
- [ ] Include all three query params (email, name, phone) baked into the waiver link in the email body

### Waiver page
- [ ] Confirm `https://systemafloyd.com/waiver` is the canonical waiver URL across all forms
- [ ] Verify the waiver page reads `?email=`, `?name=`, `?phone=` from the URL and prefills the corresponding fields
- [ ] If it doesn't already, add prefill logic to the waiver page

### Billing dashboard parser
- [ ] Confirm the billing dashboard's pricing-string parser handles the new option syntax (`Standard 30 min ($100/session)`, `1 Child ($25/hour)`, etc.) — same regex as the camp Lunch column
- [ ] Add the new contacts groups so non-camp registrations land in the right Square groups (Private Lessons, Rent-A-Sensei, Birthday Parties, etc.)

### Form analytics + dashboard integration
- [ ] Decide if we want a "Bookings dashboard" page mirroring the camp dashboard (would show daily/weekly volume per form type, MTD totals, etc.) — out of scope until at least 2 of the forms are live and submitting

### Reusable build script
- [ ] After Rent-A-Sensei and Balloons go through, generalize `ghl_create_private_lessons.py` into `ghl_create_form_folder.py` that reads from a JSON spec → creates folder + fields. Saves 80% of the per-form scripting cost.

### Documentation hygiene
- [ ] Once Private Lessons GHL Form goes live, capture the form ID + public URL in `new_forms_spec.md` next to the folder/field IDs already there
- [ ] Add a section to `dashboard.md` describing how new-forms data flows into Supabase / the dashboard (or confirm it doesn't yet, depending on scope decision above)

---

## Suggested next move

Given the GHL field-folder + creation script is working end-to-end:

1. **Wait for Private Lessons Chrome-extension build to finish + verify**
2. **Run Rent-A-Sensei script** (clone of private-lessons script, swap FIELDS array) — fully ready, no Tom dependencies
3. **Run Balloons script** — same, fully ready
4. **Ping Tom for**: Vladimir seminar info + Birthday Party prices (one consolidated email instead of two)
5. **Build the Rent-A-Sensei and Balloons GHL Forms** with the same Chrome-extension prompt template (just swap fields + remove conditional logic blocks if not applicable)

If Tom's response on Vladimir + Birthday Parties comes back fast, build those last so the order matches his stated priority (Vladimir #1, Birthday #3).
