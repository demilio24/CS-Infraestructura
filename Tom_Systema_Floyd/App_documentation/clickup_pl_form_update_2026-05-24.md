# ClickUp Task Spec — Private Lesson Booking, 2026-05-24 revision

**Status:** to-be-created (paste into ClickUp as new task, assign to Amina, link this file as reference)
**Workspace:** same list as the original [Private Lesson Booking task `86ahfhfj3`](https://app.clickup.com/t/86ahfhfj3)
**Suggested task title:** Update Private Lesson Booking form — add Georgia, Sean Nasiff, Weight Lifting, Mobility Stretch and Massage
**Priority:** normal (Tom emailed 2026-05-24, not blocking but high awareness)

---

## Context, read this first

The Private Lesson Booking form (`Cpk2gmz9dcumDiz2KFun`) is already live. Tom emailed three updates on 2026-05-24:

1. "We need a Georgia option as well."
2. "Needs to have martial arts option and fitness weight lifting as well. Mobility stretch massage too."
3. "Sean Nasiff is the Georgia instructor."

The funnel page [private-lessons.html](../funnel/private-lessons.html) has already been updated: Sean Nasiff appears under the Georgia state group (using the real photo + bio from home.html, since the prior "Sean" entry on the Florida roster was actually Sean Nasiff with his last name missing and has now been removed from the FL roster), and the discipline list in the hero + info card + FAQ now mentions Weight Lifting and Mobility Stretch and Massage. The form itself still needs the matching field-level changes. That is this task.

The existing [clickup_form_task_specs.md §1](clickup_form_task_specs.md#1-build-ghl-form-private-lesson-booking-systema-floyd-fl) is the source of truth for the form's current shape (custom fields, conditional logic rules, redirect URL, notifications). Use this update as a delta on top of that spec — do not rebuild the form from scratch.

## GHL location

Sub-account: Systema Floyd, Florida (location ID `8IWtNFlmgJ8bif9DivHT`). Custom fields live in Settings → Custom Fields → Private Lessons folder.

---

## Changes required

### 1. State field — add Georgia

Open the existing State custom field. Current options: Florida, Virginia. Add a new option:

- Georgia

Order: Florida, Virginia, Georgia (state alphabetical-ish, FL stays first as the home state).

### 2. Instructor field — rename "Sean" to "Sean Nasiff"

Open the existing Instructor custom field. The current "Sean" option is actually Sean Nasiff (confirmed against [home.html](../funnel/home.html) where his full name, role "Lead Instructor · Georgia," and bio are already published, and confirmed by Tom's 2026-05-24 email "Sean Nasiff is the Georgia instructor"). There is **no separate Florida Sean** — that was a missing-last-name artifact on the funnel page, now corrected.

Update:

- Rename the existing "Sean" option to **Sean Nasiff** (preserve the field key if possible so existing submissions remain mapped).
- Treat Sean Nasiff as the Georgia-only instructor going forward.

If renaming an existing option breaks the field key in GHL (sometimes the platform regenerates the option ID), prefer to rename in place anyway — current submission count on this option is low, and the alternative (add new option + hide old) creates two "Sean" entries in dropdowns and breaks visibility logic for Rule B.

### 3. Training Type field — add two options

Open the existing Training Type custom field. Current 6 options: Martial Arts, Fitness, Sports, Combination, Boxing, Dance. Add two new options:

- Weight Lifting
- Mobility Stretch and Massage

These two new options should follow the same "standard senseis only" visibility as Martial Arts, Fitness, Sports, and Combination (i.e., hidden when Instructor = Evenson, hidden when Instructor is one of Jessica/Bianca/Carolina, hidden when Instructor = Sean Nasiff — see Rule B update below).

### 4. Conditional logic updates

**RULE A (state + instructor validation) — extend with Georgia clauses.**

Existing FL/VA rules stay. Add these:

- If State = Georgia AND Instructor ≠ Sean Nasiff, block submission with error: "Sean Nasiff is the only instructor available in Georgia."
- If State ≠ Georgia AND Instructor = Sean Nasiff, block submission with error: "Sean Nasiff only teaches in Georgia. Please update your state or instructor."

Also update the help text under the Instructor field to read:

> Florida students: pick any except Ryan and Sean Nasiff. Virginia students: pick Ryan. Georgia students: pick Sean Nasiff.

**RULE B (training-type per instructor) — extend with Sean Nasiff.**

Current rules: Evenson → Boxing only; Jessica/Bianca/Carolina → Dance only; all other instructors → Martial Arts, Fitness, Sports, Combination.

Update "all other instructors" to also include the two new options:

- All non-Evenson, non-Dance instructors (which now includes Sean Nasiff) → Martial Arts, Fitness, Sports, Combination, Weight Lifting, Mobility Stretch and Massage. Hide Boxing and Dance.

If the duplicate-field workaround is in use (per the original spec), update the duplicate to include the two new options on the standard variant.

**RULE C (pricing tier) — no changes.**

Mr. Floyd is still the only Premium tier. Sean Nasiff is a standard-tier instructor unless Tom says otherwise. The existing Lesson Length & Price field options stay as-is.

### 5. Pricing tier for Sean Nasiff — confirm with Tom before publishing

The original spec gates Premium pricing on `Instructor = Mr. Floyd (Premium)`. Sean Nasiff defaults to Standard tier under the same logic. Confirm with Tom in the ClickUp comments before publishing in case he intends Sean Nasiff to be on a different tier.

---

## Verification — test BEFORE publishing

Walk through the form in preview as a test user. Specifically verify:

- State dropdown shows Florida, Virginia, Georgia in that order.
- Instructor dropdown shows Sean Nasiff (renamed from the old "Sean" option). There is only one Sean entry, not two.
- Training Type field shows Weight Lifting and Mobility Stretch and Massage when Instructor is any standard non-Dance, non-Evenson, non-Sean-Nasiff sensei.
- Selecting State = Georgia and Instructor ≠ Sean Nasiff surfaces the Georgia validation error.
- Selecting State ≠ Georgia and Instructor = Sean Nasiff surfaces the matching error.
- Selecting State = Georgia and Instructor = Sean Nasiff passes validation and proceeds.
- Selecting Sean Nasiff shows the standard Lesson Length & Price tier ($100 / $125 / $150), not the Mr. Floyd Premium tier (unless Tom confirms otherwise per item 5 above).
- Existing FL + VA rules still block correctly (Florida + Ryan → error, Virginia + non-Ryan → error).
- Test submit still redirects to `https://systemafloyd.com/waiver?email={{contact.email}}&name={{contact.full_name}}&phone={{contact.phone}}` with all three query params populated.

Use a throwaway 10-digit phone (e.g., 561-555-0123) and `test@nilsllc.com` per the existing test-contact convention.

## Final deliverables

- Updated form published in GHL.
- Short Loom or screen recording walking through:
  - The new State + Instructor + Training Type options.
  - Georgia + non-Sean-Nasiff blocked.
  - Non-Georgia + Sean Nasiff blocked.
  - Georgia + Sean Nasiff passes.
  - Standard tier Lesson Length & Price shown for Sean Nasiff (or whatever tier Tom confirmed).
- Comment on the existing [Verify Form Functionality task `86ahnq2z2`](https://app.clickup.com/t/86ahnq2z2) noting that Private Lessons has been re-verified after this change so the original sign-off does not stay stale.

## Hard constraints

- The only existing option being renamed is "Sean" → "Sean Nasiff" (per §2). All other existing options (Florida, Virginia, Mr. Floyd, Alex, George, James, Evenson, Jessica, Bianca, Carolina, Ryan, and the existing 6 Training Type options) must stay exactly as they are.
- Do NOT change field keys. The billing dashboard pricing parser reads them verbatim.
- Do NOT add a payment integration to this form. Payment is still handled in the separate step after booking.
- Post-submit redirect URL with all three query params is REQUIRED and unchanged.
