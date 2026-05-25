# Systema Floyd, Forms Build TODOs

Per-form punch list. Status as of **2026-05-23**.
Spec lives in [new_forms_spec.md](./new_forms_spec.md). Build order per
Tom's May 13 call: Vladimir Seminar, Private Lessons, Birthday Parties.

## 2026-05-23 update

All 4 form builds + the workflows task were closed by Amina today.
ClickUp now has a single open verification task:

- **[Verify Form Functionality (86ahnq2z2)](https://app.clickup.com/t/86ahnq2z2)** — assigned Amina, urgent, due 2026-05-25. Three sign-offs needed per form: (1) sheet row lands in the correct Google Sheet, (2) per-form notification email template renders correctly (Amina copy/pasted the actions but did not edit the templates yet), (3) form submission → `/waiver` redirect carries all 3 query params. Test with `test@nilsllc.com` + NILS LLC phone.

### Outstanding follow-ups Emilio still owns
- Walk Amina through using code nodes for the Private Lessons Rule B conditional (Instructor → Training Type lock). She admitted in [thread `90130268726557`](https://app.clickup.com/t/86ahfhfj3) the lock partially misbehaves. Plan: record a video.
- Pull a sample Vladimir Seminar submission once a real registration lands (or via a test), map the 7 `others.<fieldId>` values to the sheet columns, paste field IDs into `DC_VS_FIELD_*` constants in [DiscrepancyCheck.js](../sheets-snapshot/apps-script/DiscrepancyCheck.js), `clasp push`, and the dormant `_dcCheckVasilievSeminar()` lights up.
- Re-confirm bot health after the bot revival work this week (see [bot_revival_runbook.md](./bot_revival_runbook.md)). The 2026-05-19 token-stale incident may or may not still be active; check `public.sf_bot_health.discrepancy_check.last_ok_at`.
- Birthday Parties remains blocked on Tom's pricing (see §3 below) — no movement since 2026-05-14. Tom's "Party page" message on 2026-05-22 reiterated the need but did not include the prices. The `birthday-parties.html` page currently embeds Balloons as a placeholder; swap once the real Birthday Parties form is built.

## 2026-05-18 update

- **Destination sheets exist.** Tom (via `systemafloydsheets@gmail.com`)
  created 4 empty Google Sheets on 2026-05-17 inside the shared
  `Form Submissions` Drive folder
  (`1YnCaA46sLC57w7A3vZf0tEGgZv9aoUxN`), one per form. IDs are now
  captured in [new_forms_spec.md](./new_forms_spec.md) under each form.
- **All 3 Amina-assigned forms still `to do` in ClickUp**, 2 days past
  their 2026-05-16 due date. Status-check comments posted on each
  (see comment IDs below). Waiting on her to publish + share form IDs.
- **Failsafe wiring is scaffolded but dormant** in
  `Tom_Systema_Floyd/sheets-snapshot/apps-script/DiscrepancyCheck.js`.
  Each of the 3 new forms has a `_dcCheck<Form>()` /
  `_dcAppend<Form>()` helper pre-wired against the documented field
  IDs + sheet column orders, but the `DC_FORM_*` constants are blank
  with a `TODO` comment. The moment Amina publishes a form ID, paste
  it into the matching constant, push via clasp, and the 15-min
  failsafe activates on the next run.
- **Vasiliev still blocked on Tom.** Field creation, ClickUp task, and
  failsafe wiring all wait for the info he owes (see §1 below).

### Status-check comments posted 2026-05-18
- Private Lessons → [ClickUp 86ahfhfj3](https://app.clickup.com/t/86ahfhfj3), comment `90130267804642`
- Rent-A-Sensei → [ClickUp 86ahfhfjh](https://app.clickup.com/t/86ahfhfjh), comment `90130267804657`
- Balloons → [ClickUp 86ahfhfjp](https://app.clickup.com/t/86ahfhfjp), comment `90130267804670`

## 2026-05-19 update

### Amina shipped 2 of 4 forms overnight
- **Balloons**: form id `SvXq0KmUb1Ct2AR2t8Yl`, routing workflow `daef2d02-ca0f-4fdf-994c-a7757ff2de12`, customer + internal emails built. Details in [new_forms_spec.md](./new_forms_spec.md) §Balloons.
- **Vladimir Vasiliev Seminar**: form id `Zu7nHwEILIJnkKyvtnbB`, routing workflow `fc38613d-42ad-408c-80f5-0a18bb75c6d4`, custom-field folder `RTmnCYg8pRee35YYFhyp`. Field IDs were created inline by Amina (not pre-created by our script), so they need to be fetched from a sample submission before the bot can be wired.
- **Private Lessons + Rent-A-Sensei**: still pending from Amina, no follow-up reply on the May 18 status-check comments.

### Ops blocker: GHL token expired, discrepancy bot dead since May 14
- `discrepancy_check.last_ok_at` in `public.sf_bot_health` = `2026-05-14 06:00:16 UTC` (~5 days stale).
- Heartbeat guard fired its silence-broken alert 2026-05-18 12:37 UTC.
- Root cause: the `i9ovjPw1ZDhGB86A` n8n workflow ("GHL Token Manager") that refreshes the Supabase `ghl_tokens.acces_token` every ~12h has stopped firing. Token is now 35+ hours stale (24h TTL).
- Every bot run since 2026-05-14 06:15 has died on its first GHL call (`401 Invalid JWT`) before reaching the heartbeat write or the email-digest branch, so failures have been silent.
- **Until the token is refreshed**: every TODO in this doc that depends on the failsafe bot is paused. New-form wiring is scaffolded in DiscrepancyCheck.js but dormant; new field-ID verification via GHL is blocked.

Revival runbook: [bot_revival_runbook.md](./bot_revival_runbook.md).

---

## 1. Vladimir Seminar, Priority #1, LIVE (field IDs still TBD)

Tom said this is his **#1 build priority**. Annual flagship weekend
event in Palm Beach, **October 10-11, 2026**. The form was originally
blocked on Tom (date, pricing, waiver), but Amina shipped a working
form on 2026-05-18 — Tom's blockers got resolved out-of-band or the
form was built with placeholder copy.

### Done

- [x] **Form composed, published, and shipped 2026-05-18 by Amina**: form id `Zu7nHwEILIJnkKyvtnbB`
- [x] Custom-field folder created inline by Amina (parent `RTmnCYg8pRee35YYFhyp`)
- [x] Routing workflow `fc38613d-42ad-408c-80f5-0a18bb75c6d4` wired up
- [x] **Google Sheets workflow built and live** ([ClickUp 86ahhe0gj](https://app.clickup.com/t/86ahhe0gj))
- [x] **Embedded on [funnel/vlad-seminar.html](../funnel/vlad-seminar.html)** — verify the iframe `src` matches `Zu7nHwEILIJnkKyvtnbB` (the page originally embedded the After School form as a placeholder, see PROJECT.md "Vlad Seminar follow-ups (open)" — make sure that swap actually happened or do it now)

### Remaining

- [ ] Pull a sample submission once a real registrant comes through (or trigger one). Map each `others.<fieldId>` to its sheet column. Paste field IDs into `DC_VS_FIELD_*` constants in [DiscrepancyCheck.js](../sheets-snapshot/apps-script/DiscrepancyCheck.js) lines 188-194, `clasp push`. The dormant `_dcCheckVasilievSeminar()` stub lights up only after the field IDs are in.
- [ ] Confirm with Tom (post-launch) that he doesn't still owe us: capacity cap (for sold-out logic), photo/video release wording, the existing waiver PDF or link they reuse every year. These were on the original blocker list — if Amina built the form without them, decide whether to retrofit or leave for next year.
- [ ] Add Florida tax + 3% transaction fee at checkout if not already wired.
- [ ] Decide whether to add a "Featured Event" banner to the Systema Floyd homepage that links/embeds the seminar form.

### Open questions

- Is Vladimir Vasiliev confirmed as the headline teacher this year, or is it a different visiting instructor? Tom said "Vladimir" verbally on May 13, confirm.
- Will there be a Friday pre-seminar workshop? Spec includes it as conditional.
- Travel discount or scholarship slots for instructors from other schools?

---

## 2. Private Lessons, Priority #2, LIVE (with 1 known bug)

### Done

- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields plus conditional logic
- [x] GHL folder `Private Lessons` (id `X4a97HKQJdXVkGV6R4Vg`) and 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_private_lessons_ids.json`
- [x] ClickUp task created, assigned to Amina, due 2026-05-16 ([ClickUp 86ahfhfj3](https://app.clickup.com/t/86ahfhfj3))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpn](https://app.clickup.com/t/86ahfhfpn))
- [x] **Form composed, published, and shipped 2026-05-22 by Amina**: form id `Cpk2gmz9dcumDiz2KFun`
- [x] **Embedded on [funnel/private-lessons.html](../funnel/private-lessons.html)** 2026-05-23 (`.page-hero-form#register`)
- [x] **Google Sheets workflow built and live** ([ClickUp 86ahhe0gj](https://app.clickup.com/t/86ahhe0gj))

### Known issue (carried over)

- [ ] **Rule B conditional logic partially broken** — Amina admitted in [ClickUp thread `90130268726557`](https://app.clickup.com/t/86ahfhfj3) that the Instructor → Training Type lock (Evenson=Boxing only, Jessica/Bianca/Carolina=Dance only) is not fully working. Plan: walk Amina through using code nodes for the conditional via a recorded video.

### After verification passes
- [ ] Paste form id `Cpk2gmz9dcumDiz2KFun` into `DC_FORM_PRIVATE_LESSONS` in [sheets-snapshot/apps-script/DiscrepancyCheck.js](../sheets-snapshot/apps-script/DiscrepancyCheck.js) line 126, `clasp push`. Failsafe activates on the next 15-min run, writes to sheet `1XVh9pBOwddr-wCZ4eIxA39htmEdGGGx_WRgDun1C_mU` (Private Lesson Booking). Hold this step until [ClickUp 86ahnq2z2](https://app.clickup.com/t/86ahnq2z2) confirms the GHL → sheet workflow actually writes; otherwise the failsafe and the workflow may race or double-write.
- [ ] Run `discrepancyBackfillTracking()` once after the first auto-add so existing rows in the sheet (if any) get linked.

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

## 4. Rent-A-Sensei (Babysitting), LIVE

### Done

- [x] OCR'd Tom's 3-photo spec (May 5)
- [x] Spec'd all 12 fields plus the age-based sensei filter
- [x] Confirmed this is **babysitting only** (not parties / events), explicit acknowledgment checkbox required
- [x] GHL folder `Rent-A-Sensei` (id `RbjiHT0moCfDgm5OEnHW`) plus all 12 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_rent_a_sensei_ids.json`
- [x] ClickUp task created, assigned to Amina, due 2026-05-16 ([ClickUp 86ahfhfjh](https://app.clickup.com/t/86ahfhfjh))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpt](https://app.clickup.com/t/86ahfhfpt))
- [x] **Form composed, published, and shipped 2026-05-22 by Amina**: form id `myEoOLL1SKGv0IvSF4ur`
- [x] **Embedded on [funnel/rent-a-sensei.html](../funnel/rent-a-sensei.html)** 2026-05-23 (new `.ras-block#register` section replacing the old "Contact Us to Book" CTA). The "Looking for a party?" link now points at `/birthday-parties` instead of the generic contact anchor.
- [x] **Google Sheets workflow built and live** ([ClickUp 86ahhe0gj](https://app.clickup.com/t/86ahhe0gj))

### After verification passes
- [ ] Paste form id `myEoOLL1SKGv0IvSF4ur` into `DC_FORM_RENT_A_SENSEI` in [sheets-snapshot/apps-script/DiscrepancyCheck.js](../sheets-snapshot/apps-script/DiscrepancyCheck.js) line 127, `clasp push`. Failsafe activates on the next 15-min run, writes to sheet `1zHDDtoHrjM8uoBsBoVffT09BqOZKRKPFfCDQEpi2CgE` (Rent-A-Sensei Booking). Hold this step until [ClickUp 86ahnq2z2](https://app.clickup.com/t/86ahnq2z2) confirms the GHL → sheet workflow actually writes; otherwise the failsafe and the workflow may race or double-write.

### Open questions for Tom (in the draft email)

- Travel-fee table: should we publish a rough range up front, or keep fully manual?
- Insurance and liability for off-site work, does the waiver cover in-home location?
- Sensei roster, which staff are babysitting-qualified?

---

## 5. Balloons add-on, LIVE (sub-form of Birthday Parties)

Designed to be triggered when a Birthday Party customer selects
"Custom Balloon Decor" in the Special Add-Ons. Tom's wife Emily runs
the work (`Balloonsontheave@gmail.com`).

### Done

- [x] OCR'd Tom's pricing image (May 5)
- [x] Spec'd all 14 fields with prices
- [x] GHL folder `Balloons` (id `Snj5a0BsE8Y6ehLgXwl8`) plus all 14 fields created via API on 2026-05-14
- [x] Field IDs saved to `.claude/scratch/ghl_balloons_ids.json`
- [x] ClickUp task created, assigned to Amina, due 2026-05-16 ([ClickUp 86ahfhfjp](https://app.clickup.com/t/86ahfhfjp))
- [x] Subtask for the internal notification workflow assigned ([ClickUp 86ahfhfpz](https://app.clickup.com/t/86ahfhfpz))
- [x] **Form composed, published, and shipped 2026-05-18 by Amina**: form id `SvXq0KmUb1Ct2AR2t8Yl`
- [x] **Failsafe bot wired up** — `DC_FORM_BALLOONS` constant in [DiscrepancyCheck.js](../sheets-snapshot/apps-script/DiscrepancyCheck.js) line 128 is populated; `_dcCheckBalloons()` is called from `runDiscrepancyCheck()` at line 323 and writes to sheet `1OZbb_0lmCCSRKZHn0X_UgDkY_Sckbw2qyt2H3gIRDJ8` (Balloons by Balloons on the Ave)
- [x] **Google Sheets workflow built and live** ([ClickUp 86ahhe0gj](https://app.clickup.com/t/86ahhe0gj))
- [x] **Embedded as a placeholder on [funnel/birthday-parties.html](../funnel/birthday-parties.html)** (line 693) — this is the *current state*, not the *desired state*. Once the real Birthday Parties form is built (§3 above), this embed should be swapped out and Balloons should only appear as a conditional sub-form inside it.

### Verification still pending

- [ ] Run a real test submission and confirm it lands in the destination sheet AND triggers Emily's notification at `Balloonsontheave@gmail.com`. Track via [ClickUp 86ahnq2z2](https://app.clickup.com/t/86ahnq2z2). For the test, either use a clearly-test name ("AMINA TEST – DO NOT FULFILL") or temporarily remove Emily from notifications during the test and re-add immediately after.

### Decision pending

The form will eventually be triggered as a conditional sub-form from
inside Birthday Parties. For now it lives as a **standalone form** that
both (a) is referenceable directly and (b) is acting as the placeholder
embed on `birthday-parties.html`. Once Birthday Parties is built we
wire the trigger and remove the standalone embed.

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
- [x] **2026-05-18**: Destination Google Sheet IDs added to each form's section in `new_forms_spec.md`
- [x] **2026-05-18**: Failsafe wiring scaffolded (dormant) in `DiscrepancyCheck.js` for Private Lessons, Rent-A-Sensei, and Balloons
- [ ] Once each form goes live, capture the form ID + public URL in `new_forms_spec.md`

---

## Suggested next move

1. Send the draft email to Tom (currently in Gmail Drafts) asking for the Vladimir Seminar and Birthday Party info
2. Amina builds the 3 GHL forms by Saturday 2026-05-16
3. When Tom replies with prices, fill in `new_forms_spec.md` placeholders and run the field-creation script for Vladimir Seminar and Birthday Parties
4. Then create two more ClickUp tasks for Amina to build those forms

If Tom's response on Vladimir is quick, prioritize building that one before Birthday Parties so the order matches his stated priority.
