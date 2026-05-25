# ClickUp Form Build Task Specs — Verification Reference

Pulled from ClickUp 2026-05-23 for manual verification against the live GHL forms. Each task is in "emilio approval" status — Amina has reported them built and needs sign-off.

| Form | Task ID | URL | Status | Spec section below |
|---|---|---|---|---|
| Private Lesson Booking | `86ahfhfj3` | https://app.clickup.com/t/86ahfhfj3 | emilio approval | [#1](#1-build-ghl-form-private-lesson-booking-systema-floyd-fl) |
| Rent-A-Sensei (Babysitting) | `86ahfhfjh` | https://app.clickup.com/t/86ahfhfjh | emilio approval | [#2](#2-build-ghl-form-rent-a-sensei-babysitting-systema-floyd-fl) |
| Balloons | `86ahfhfjp` | https://app.clickup.com/t/86ahfhfjp | emilio approval | [#3](#3-build-ghl-form-balloons-systema-floyd-fl) |
| Vladimir Vasiliev Seminar | `86ahh7trp` | https://app.clickup.com/t/86ahh7trp | emilio approval (urgent) | [#4](#4-build-ghl-form-vladimir-vasiliev-seminar-systema-floyd-fl) |

**Birthday Parties** — no ClickUp task exists yet. Blocked on Tom providing per-item pricing (location base prices, headcount tiers, food add-ons, premium extras, deposit policy). Asked May 14; Juliana replied May 15 with Seminar info only.

---

## 1. Build GHL Form: Private Lesson Booking (Systema Floyd FL)

**Task:** https://app.clickup.com/t/86ahfhfj3 · Assignee: Amina Shah · Status: emilio approval

Build the "Private Lesson Booking" form in GoHighLevel

### Context, read this first

Systema Floyd has 4 new forms we're building, in this priority order:

1. Vladimir Seminar (blocked, waiting on Tom)
2. Private Lessons (this task)
3. Birthday Parties (blocked, waiting on Tom for pricing)
4. Rent-A-Sensei (separate ClickUp task, do that one second)
5. Balloons (separate ClickUp task, do that one third)

The custom fields for this form are already created in the GHL Systema Floyd FL account. You do NOT need to create them. They live inside a folder called "Private Lessons" under Settings, Custom Fields.

Your job is to compose the form, set field properties, configure conditional logic, set the redirect URL, publish, and report back.

### GHL location

Sub-account: Systema Floyd, Florida (location ID `8IWtNFlmgJ8bif9DivHT`).

Sign in at https://app.gohighlevel.com and switch to that sub-account before starting.

### Form basics

| Setting | Value |
|---|---|
| Form name | Private Lesson Booking |
| Header / title shown to customers | Private Lesson Booking |
| Sub-heading | Pick your state, instructor, and lesson. Pricing updates automatically as you choose. |
| Submit button text | Book My Lesson |
| Primary color | navy blue `#1b2f6e` |
| Accent | gold `#f4b63a` |

### Fields to add (in this exact order, all required)

Drag each by name from left panel → Custom Fields → Private Lessons into the canvas, in this order. Default placeholder/help text is already set on each, do NOT overwrite. Toggle Required ON for every single field.

| # | Field name |
|---|---|
| 1 | State |
| 2 | Instructor |
| 3 | Lesson Length & Price |
| 4 | Number of Students |
| 5 | Training Type |
| 6 | Age Group |
| 7 | Package |
| 8 | Preferred Date |
| 9 | Preferred Time |

For Full Name / Phone / Email, use the standard GHL contact fields (not the ones inside the Private Lessons custom-field folder). We purposely didn't create custom fields for those three.

### Conditional logic — the most important part

**RULE A — Block invalid State + Instructor combos**

- If State = Florida AND Instructor = Ryan, block submission with error: "Ryan only teaches in Virginia."
- If State = Virginia AND Instructor ≠ Ryan, block submission with error: "Only Ryan is available in Virginia, please update your state or instructor."

Help text under the Instructor field should read: "Florida students: pick any except Ryan. Virginia students: pick Ryan."

**RULE B — Training Type locks based on Instructor**

The Training Type field has 6 options: Martial Arts, Fitness, Sports, Combination, Boxing, Dance.

- If Instructor = Evenson (Boxing Only), show ONLY Boxing
- If Instructor IN (Jessica (Dance), Bianca (Dance), Carolina (Dance)), show ONLY Dance
- Any other instructor, show Martial Arts, Fitness, Sports, Combination and HIDE Boxing and Dance

If GHL's UI only allows show/hide on the WHOLE field (not per-option), use this workaround: create two duplicate Training Type fields ("Training Type, Boxing only" and "Training Type, Dance only") and toggle the whole field with conditional display based on Instructor.

**RULE C — Lesson Length & Price shows the right tier**

The Lesson Length & Price field has 6 options, 3 Standard tier rows plus 3 Mr. Floyd premium tier rows.

- If Instructor = Mr. Floyd (Premium), show only the 3 options starting with Mr. Floyd
- Any other instructor, show only the 3 options starting with Standard

Same fallback as Rule B: if per-option conditional isn't supported, split into two duplicate fields toggled by Instructor.

**IMPORTANT pricing syntax:** Each of the 6 Lesson Length & Price options must have its own $X label (one price per option, no combined labels like "$100 / $125 / $150" on a single option). The billing dashboard parser only reads the first $-match per option, so a combined label would silently parse as just the first price. Before publishing, open the existing Lesson Length & Price custom field in GHL and verify each of the 6 options reads as a single flat price (no `/day` or `/week` multiplier). Standard tier should be $100 / $125 / $150 (each as its own option), Mr. Floyd premium tier $170 / $200 / $225 (each as its own option). Fix wording if needed before publishing.

### Redirect after submission (REQUIRED)

On Form Submit → Redirect URL (NOT inline message). The URL MUST include all three query params:

```
https://systemafloyd.com/waiver?email={{contact.email}}&name={{contact.full_name}}&phone={{contact.phone}}
```

Open in same tab (not new window). **Do not publish without all three query params present and verified.**

### Notifications

Form submission notifications email to:

- systemafloyd@gmail.com
- info@nilsdigital.com (CC for monitoring)

Subject line: `[Private Lessons] New booking from {{contact.first_name}} {{contact.last_name}}`

Email templates (auto-responder to the customer AND the internal notification email) must follow the same branding as the rest of Systema Floyd's existing emails: header logo, navy + gold color palette, footer signature, and font. Do not ship plain-text or default GHL styling.

### Verification — test BEFORE publishing

- Save the form, click Preview, walk through every field as a test user.
- For the test submission, do NOT use your personal phone number. Use a throwaway 10-digit number (e.g. 555-000-0000 or 561-555-0123). Same for email.
- Specifically verify:
  - Selecting Florida then Ryan surfaces the validation error
  - Selecting Virginia then any FL instructor surfaces the error
  - Selecting Mr. Floyd (Premium) shows the three Mr. Floyd options ($170 / $200 / $225), NOT the Standard options
  - Selecting Evenson shows ONLY Boxing in Training Type
  - Selecting Jessica / Bianca / Carolina shows ONLY Dance
  - Required fields prevent submission when blank
  - On a test submit, browser redirects to `https://systemafloyd.com/waiver?email=...&name=...&phone=...` with all three params populated
- Publish the form.

### Final deliverables

- Iframe embed code for the published form (from GHL's form share panel)
- Short Loom-style screen recording walking through each conditional logic rule live:
  - Rule A: Florida + Ryan, and Virginia + a Florida instructor
  - Rule B: switch instructor to Evenson → Training Type collapses to Boxing only. Switch to Jessica/Bianca/Carolina → Dance only. Switch back to standard → 4 standard options return.
  - Rule C: switch to Mr. Floyd → price tier swaps to $170/$200/$225. Switch back → swaps to $100/$125/$150.
  - End by submitting a test entry and confirming the redirect goes to the waiver URL with all three query params.

### Hard constraints

- Do NOT create or modify custom fields beyond what RULE C explicitly directs (each $X must be its own option label). The 12 existing fields stay as-is. The only other exception is Rule B/C duplicate-field workarounds.
- Do NOT change field names or field keys. The billing dashboard pricing parser reads them verbatim.
- Do NOT add a payment integration to this form yet. Payment happens in a separate step after booking.
- Do NOT add CAPTCHA unless GHL forces one.
- The post-submit redirect URL with all three query params is REQUIRED.

---

## 2. Build GHL Form: Rent-A-Sensei (Babysitting) (Systema Floyd FL)

**Task:** https://app.clickup.com/t/86ahfhfjh · Assignee: Amina Shah · Status: emilio approval

Build the "Rent-A-Sensei" form in GoHighLevel

### Context, read this first

Systema Floyd has 4 new forms we're building. Build this one SECOND, after Private Lessons. The order is:

1. Private Lessons (separate ClickUp task, do that one FIRST)
2. Rent-A-Sensei (this task)
3. Balloons (separate ClickUp task, do that one third)

The custom fields are already created in the GHL Systema Floyd FL account. You do NOT need to create them. They live inside a folder called "Rent-A-Sensei" under Settings, Custom Fields.

**Important — what Rent-A-Sensei is:** This is an in-home babysitting service with Systema Floyd's senseis. The senseis play active games, do supervision, and run structured activity. It is NOT for parties or events — there's a required acknowledgment checkbox on the form to confirm this.

### GHL location

Sub-account: Systema Floyd, Florida (location ID `8IWtNFlmgJ8bif9DivHT`).

### Form basics

| Setting | Value |
|---|---|
| Form name | Rent-A-Sensei Booking |
| Header / title shown to customers | Rent-A-Sensei (Babysitting) |
| Sub-heading | In-home babysitting service with energetic professional Senseis. Focused on supervision, engagement, and active play (games, movement, structured activity). NOT for parties, events, or large group bookings. 3-hour minimum per booking. |
| Submit button text | Book a Sensei |
| Primary color | navy blue `#1b2f6e` |
| Accent | gold `#f4b63a` |

### Fields to add (in this exact order, all required unless noted)

Toggle Required ON for every field EXCEPT "Special instructions / extra children info" (that one stays optional).

| # | Field name | Required? |
|---|---|---|
| 1 | Service Type | ✓ |
| 2 | Number of Children | ✓ |
| 3 | Duration | ✓ |
| 4 | Full Address | ✓ |
| 5 | Date | ✓ |
| 6 | Start Time | ✓ |
| 7 | End Time | ✓ |
| 8 | Confirm: not for parties or events | ✓ |
| 9 | Special instructions / extra children info | optional |

For Parent Name / Phone / Email, use the standard GHL contact fields (not the ones inside the Rent-A-Sensei custom-field folder).

### No conditional logic on this form

Unlike Private Lessons, this form is linear, no show/hide rules. The complexity is server-side (sensei age-based assignment, travel-fee quote), handled by Tom's team after submission, not in the form.

### Important display notes (NOT fields)

These notes should appear visibly on the form but are NOT form fields:

**Top banner (above field 1) — Text block at the top:**
> In-home babysitting service with energetic professional Senseis. Focused on supervision, engagement, and active play (games, movement, structured activity). Not for parties, events, or large group bookings. 3-hour minimum per booking.

**Footer note (below the submit button) — Text block at the bottom:**
> Tipping your Sensei is greatly appreciated. Not required, but encouraged for excellent service.

### Redirect after submission (REQUIRED)

```
https://systemafloyd.com/waiver?email={{contact.email}}&name={{contact.full_name}}&phone={{contact.phone}}
```

Open in same tab. All three query params required.

### Notifications

To: systemafloyd@gmail.com + info@nilsdigital.com (CC)
Subject: `[Rent-A-Sensei] New booking from {{contact.first_name}} {{contact.last_name}}`
Must follow Systema Floyd branded email template (navy + gold, logo, footer signature).

### Verification — test BEFORE publishing

- Top banner about babysitting-only is visible above field 1
- The "Confirm: not for parties or events" field is required and shows the confirmation label as the checkbox option
- All required fields prevent submission when blank
- Footer about tipping is visible below the submit button
- Test submit redirects to waiver URL with all three params populated

### Final deliverables

- Iframe embed code (from GHL's form share panel)
- Short Loom: top banner renders, walk through each field especially the required checkbox, footer tipping note visible, test submit + redirect.

### Hard constraints

- Do NOT create or modify custom fields. The 12 existing fields stay as-is.
- Do NOT change field names, field keys, or option strings. The billing dashboard pricing parser reads them verbatim.
- Do NOT remove the "Confirm: not for parties or events" required checkbox.
- Do NOT add a payment integration. Travel-fee and final pricing are quoted manually after booking.
- The post-submit redirect URL with all three query params is REQUIRED.

---

## 3. Build GHL Form: Balloons (Systema Floyd FL)

**Task:** https://app.clickup.com/t/86ahfhfjp · Assignee: Amina Shah · Status: emilio approval · Published form ID: `SvXq0KmUb1Ct2AR2t8Yl`

Build the "Balloons" form in GoHighLevel

### Context, read this first

Systema Floyd has 4 new forms we're building. Build this one THIRD, after Private Lessons and Rent-A-Sensei.

The custom fields are already created in the GHL Systema Floyd FL account, inside a folder called "Balloons" under Settings, Custom Fields.

**What this form is:** Tom's wife Emily runs a custom balloon design business called "Balloons on the Ave" (Balloonsontheave@gmail.com). Customers who book a birthday party at Systema Floyd can add custom balloon decorations via this form. Systema Floyd takes the payment; the order details get forwarded to Emily for fulfillment.

**Eventually, this form will be triggered as a "sub-form" from the Birthday Party form when a customer picks "Custom Balloon Decor."** For now, build it as a standalone form so it can be referenced directly. We'll wire the Birthday Party trigger in a later task once that form is built.

### GHL location

Sub-account: Systema Floyd, Florida (location ID `8IWtNFlmgJ8bif9DivHT`).

### Form basics

| Setting | Value |
|---|---|
| Form name | Balloons by Balloons on the Ave |
| Header / title shown to customers | Custom Balloon Decor |
| Sub-heading | Designed and delivered by Balloons on the Ave. Minimum booking $300, please review the menu below before submitting. |
| Submit button text | Request My Balloons |
| Primary color | navy blue `#1b2f6e` |
| Accent | gold `#f4b63a` |

### Fields to add (in this exact order)

Default placeholder/help text is already set on each, do NOT overwrite.

| # | Field name | Required? |
|---|---|---|
| 1 | Garland | optional |
| 2 | Additional Feet of Garland | optional (see conditional logic) |
| 3 | Columns | optional |
| 4 | Arch | optional |
| 5 | Balloon Wall / Backdrop | optional |
| 6 | Add-Ons (range-priced) | optional |
| 7 | Delivery Fee | required ✓ |
| 8 | Setup Complexity | required ✓ |
| 9 | Optional Fees | optional |
| 10 | Party Theme | optional |
| 11 | Primary Color | required ✓ |
| 12 | Secondary Color | optional |
| 13 | Accent Color | optional |
| 14 | Notes for Emily | optional |

For the customer's Name / Phone / Email, use the standard GHL contact fields. We purposely didn't create custom fields for those three.

### Conditional logic

**RULE A — Additional Feet of Garland only shows when Custom length picked**

Garland (field 1) has 3 options:
- None
- 5 ft Garland ($140)
- Custom length, base 5 ft ($140)

Additional Feet of Garland (field 2) should ONLY display when the customer picks the Custom length option. Hide it for the other two options.

**IMPORTANT pricing syntax for "Additional Feet of Garland":** the billing dashboard parser only recognizes `/day` and `/week` multipliers, so a "+$30/foot" upcharge would parse as a flat $30 and the per-foot logic would be lost. Before publishing, open the existing "Additional Feet of Garland" custom field in GHL and confirm it is structured as a priced dropdown with discrete options ("1 ft ($30)", "2 ft ($60)", "3 ft ($90)", etc.) NOT as a free-text number field. If it is currently free-text or unpriced, restructure it into discrete priced options. If kept as a number input, Emily will have to compute the upcharge manually outside the billing dashboard.

### Form-level validation — $300 minimum booking

This is critical. Emily has a hard $300 minimum booking floor. The form must block submission if the live subtotal is under $300.

How to implement:

- If GHL supports a "min total" form-level validation, use it.
- If not, add a Text block at the bottom of the form right above the submit button reading: *"Minimum booking is $300. If your total is below this, please add additional items or contact us directly."*
- Either way, also include this in the Emily notification email so she can manually flag/reject low-value orders.

### Important display notes (NOT form fields)

**Top banner (above field 1):**
> All items listed include their base price. Range-priced add-ons (e.g. "Foil Balloons $10 to $30 each") will be finalized by Emily after she sees your design. Minimum booking is $300.

**Footer note (below submit button):**
> After submitting, Emily will reach out within 48 hours to confirm your design and final pricing. Setup is included; breakdown/removal is optional.

### Redirect after submission (REQUIRED)

```
https://systemafloyd.com/waiver?email={{contact.email}}&name={{contact.full_name}}&phone={{contact.phone}}
```

Open in same tab. All three query params required.

### Notifications

To:
- systemafloyd@gmail.com
- info@nilsdigital.com (CC for monitoring)
- **Balloonsontheave@gmail.com** (critical — this is Emily)

Subject: `[Balloons] New order from {{contact.first_name}} {{contact.last_name}}`

Email templates must follow Systema Floyd branded template (navy + gold, logo, footer signature, font).

### Verification — test BEFORE publishing

- Top banner about minimum booking is visible above field 1
- Field 2 (Additional Feet of Garland) is HIDDEN until you pick Custom length in field 1
- Field 2 APPEARS the moment you pick Custom length
- Required fields prevent submission when blank (Delivery Fee, Setup Complexity, Primary Color)
- If using the form-level $300 minimum, it blocks submissions below $300 with a clear error
- Emily's email is on the notification list
- Test submit redirects to waiver URL with all three params

**For the test submission, do NOT use your personal phone number.** Use a throwaway 10-digit number. Important: Emily's address is on the notification list — when you test-submit, she'll get the email. Use a name/subject that makes it obvious this is a test, OR temporarily remove her from the notification recipients during your test and re-add after.

### Final deliverables

- Iframe embed code (from GHL's form share panel)
- Short Loom: top banner, Rule A conditional (Custom length toggle), $300 minimum check, footer note, test submit + redirect, confirm Emily's email is on the notification list.

### Hard constraints

- Do NOT change field names, field keys, or option strings beyond what's explicitly directed (Garland option 3 swap + Additional Feet of Garland restructure if needed).
- Do NOT remove Emily's email (Balloonsontheave@gmail.com) from notifications.
- Do NOT add a payment integration yet. Payment flow is handled by Systema Floyd after Emily confirms the order.
- The post-submit redirect URL with all three query params is REQUIRED.

---

## 4. Build GHL Form: Vladimir Vasiliev Seminar (Systema Floyd FL)

**Task:** https://app.clickup.com/t/86ahh7trp · Assignee: Amina Shah · Status: emilio approval (urgent priority) · Published form ID: `Zu7nHwEILIJnkKyvtnbB`

### Context block

Build the "Vladimir Vasiliev Seminar Registration" form in GoHighLevel.

This is the 4th of the new Systema Floyd forms. The seminar is a two-day festival headlined by Vladimir Vasiliev (Tactical Relaxation) hosted at Palm Beach Day Academy on **October 10-11, 2026**. Early registration pricing ends August 1, 2026.

**Unlike the other three form tasks, the custom fields for this form do NOT exist yet in GHL.** Your first step is to create the custom-field folder and all 7 fields, then compose the form, then publish.

### Step 1 — Create the custom-field folder and fields

Go to Settings → Custom Fields. Create a new folder called "Vladimir Seminar."

Inside that folder, create the following 7 fields in this exact order. Use the exact field names and option strings below. The billing dashboard pricing parser will read these verbatim later, so do NOT change wording, capitalization, or punctuation.

| # | Field name | Type | Options or input format |
|---|---|---|---|
| 1 | Pass Selection | Single-select dropdown | See "Pass Selection options" below |
| 2 | Experience Level | Single-select dropdown | Beginner (no Systema experience) / Intermediate (some training) / Advanced (regular practitioner) / Instructor |
| 3 | Emergency Contact Name | Single line text | Placeholder: "Full name of emergency contact" |
| 4 | Emergency Contact Phone | Phone | Placeholder: "10-digit phone number" |
| 5 | T-Shirt Size | Single-select dropdown | XS / S / M / L / XL / XXL / XXXL |
| 6 | Dietary Restrictions or Allergies | Multi-line text | Placeholder: "List any allergies or dietary needs. Type None if not applicable." |
| 7 | How did you hear about the seminar? | Single-select dropdown | Systema Floyd email / Systema HQ / Instagram / Facebook / Friend or referral / Other |

**Pass Selection options (exact strings):**

- Two Day Pass, Early Bird $275 (must pay before Aug 1)
- One Day Pass Saturday Oct 10, Early Bird $155 (must pay before Aug 1)
- One Day Pass Sunday Oct 11, Early Bird $155 (must pay before Aug 1)
- Two Day Pass, Regular $325
- One Day Pass (Saturday or Sunday), Regular $200

Once the folder and fields are created, take a screenshot of the Settings → Custom Fields → Vladimir Seminar folder view and attach it to this ClickUp task before moving to Step 2. This confirms the field setup matches the spec before the form is built on top of it.

### Step 2 — Form basics

| Setting | Value |
|---|---|
| Form name | Vladimir Vasiliev Seminar Registration |
| Submit button text | Register Me |

### Step 3 — Add fields to the form (in this exact order, all required)

1. Pass Selection
2. Experience Level
3. Emergency Contact Name
4. Emergency Contact Phone
5. T-Shirt Size
6. Dietary Restrictions or Allergies
7. How did you hear about the seminar?

For Full Name / Phone / Email, use the standard GHL contact fields.

This form is linear — no show/hide rules or conditional logic.

### Step 4 — No styling or in-form text

Do NOT add any styling (colors, fonts, branded headers), text blocks, top banners, footer notes, or display copy to the form. The form contains only the 7 custom fields plus the standard Full Name / Phone / Email contact fields and the submit button. **Nothing else.**

### Step 5 — Redirect after submission (REQUIRED)

```
https://systemafloyd.com/waiver?email={{contact.email}}&name={{contact.full_name}}&phone={{contact.phone}}
```

Open in same tab. All three query params required.

### Step 6 — Notifications

To: systemafloyd@gmail.com + info@nilsdigital.com (CC)
Subject: `[Vladimir Seminar] New registration from {{contact.first_name}} {{contact.last_name}}`

The internal notification email must include the **Pass Selection value prominently near the top** so the team can see at a glance which pass each registrant selected.

### Step 7 — Verification, test BEFORE publishing

- All 7 required fields prevent submission when blank
- Pass Selection dropdown shows all 5 options with pricing visible in each label
- The form has NO text blocks, banners, footer notes, or branded styling
- Test submit redirects to waiver URL with all three params populated
- Internal notification email arrives with the Pass Selection value clearly visible near the top

### Final deliverables

- Screenshot of the Settings → Custom Fields → Vladimir Seminar folder showing all 7 fields created (Step 1)
- Iframe embed code for the published form (from GHL's form share panel)
- Short Loom-style screen recording walking through the form in preview:
  - Step through each of the 7 fields, showing Pass Selection with all 5 options and visible pricing
  - Confirm the form has no text blocks, banners, footer notes, or branded styling
  - Submit a test entry and confirm the redirect lands on the waiver URL with all three query params
  - Show the internal notification email landing in systemafloyd@gmail.com with the Pass Selection clearly visible

### Hard constraints

- Create the custom fields exactly as specified in Step 1. Do NOT rename, reorder, or change option strings later.
- Do NOT add any styling, colors, fonts, text blocks, banners, footer notes, or display copy to the form.
- Do NOT add the Friday Breathing & Health session as a form field.
- Do NOT add a payment integration. Payment is collected separately by Systema Floyd after registration.
- Do NOT add CAPTCHA unless GHL forces one.
- The post-submit redirect URL with all three query params is REQUIRED.
