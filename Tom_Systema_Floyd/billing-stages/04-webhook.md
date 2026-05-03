# Stage 4 — Webhook handler + runFakeWebhook

> Wire up `doPost(e)` to tie Stages 2 and 3 together. Includes Defense A submission extraction, pricing rule application, and a `runFakeWebhook()` function that simulates a real submission so we can verify end-to-end behavior.

**Prerequisite:** [Stage 3](03-sheet-writes.md) acceptance confirmed
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## The prompt

Copy this entire block into the Claude Chrome extension:

```
STAGE 4 of 5 — Wire up the doPost(e) webhook handler that ties together
everything from Stages 2 and 3. Plus a runFakeWebhook() function that
simulates a real submission so we can test end-to-end.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE ONLY
═══════════════════════════════════════════════════════════════════════

Add a new file Webhook.gs with:
  - doPost(e)                            — main webhook receiver
  - extractSubmissionFields(payload)     — Defense A logic
  - applyPricingRule(price, mult, days, weeks) — returns {amount, formula, rule}
  - processWebhookPayload(payload)       — orchestrates everything
  - runFakeWebhook()                     — simulates a real submission
  - logWebhookEvent(payload, summary)    — appends to Script Properties
                                            for debugging (rolling last 50)

═══════════════════════════════════════════════════════════════════════
DEFENSE A — extractSubmissionFields(payload)
═══════════════════════════════════════════════════════════════════════

Look up the per-submission block in this priority order:
  1. payload.submitted_form_data
  2. payload.formData
  3. payload.submission
  4. payload.form?.fields
  5. (fallback) payload.customField — log a warning to Script Properties

Each of these can have different shapes. Normalize to:
  [{ id: <field_id>, value: <field_value>, name: <optional> }, ...]

Defensively handle these shapes:
  - Array of {id, value} objects (most common)
  - Object map { fieldId: value, ... }
  - Array with mixed shapes

═══════════════════════════════════════════════════════════════════════
applyPricingRule(price, multiplier, durationDays, numWeeks)
═══════════════════════════════════════════════════════════════════════

Returns an object:
  { amount, formula, rule }

  if (multiplier === '/day') {
    amount = price * durationDays * numWeeks;
    formula = `=${price}*${durationDays}*${numWeeks}`;
    rule = 'per_day';
  } else if (multiplier === '/week') {
    amount = price * numWeeks;
    formula = `=${price}*${numWeeks}`;
    rule = 'per_week';
  } else {
    amount = price;
    formula = `=${price}`;
    rule = 'flat';
  }

═══════════════════════════════════════════════════════════════════════
processWebhookPayload(payload) — main orchestration
═══════════════════════════════════════════════════════════════════════

  1. Extract email (lowercase, trimmed), name, phone from the payload's
     contact-level fields.
  2. Extract Waiver Origin from the customField list (find the field
     named "Waiver Origin" — search by name OR by known field ID).
  3. Resolve subaccount via resolveSubaccount.
  4. Search the routed subaccount for the contact:
       contactId = ghlSearchContactByEmail(subaccountName, email)
       profileUrl = contactId ? buildProfileUrl(...) : null
  5. UPSERT customer row (Stage 3 function).
  6. Find or create sub-header row (Stage 3 helper —
     findCustomerTxRange returns it).
  7. Get the per-submission fields via extractSubmissionFields.
  8. From all string values in the submission, parse:
       durationDays = parseDurationDays(allStringValues)
       numWeeksField = the value of "Camp Dates" or similar
                        multi-select field in the submission
       numWeeks = parseMultiSelectValue(numWeeksField).length || 1
  9. For each value in the submission, apply parseMultiSelectValue,
     then for each item in that array:
       - If PRICE_REGEX matches:
           price = parsePrice(item)
           multiplier = extractMultiplier(item)
           pricing = applyPricingRule(price, multiplier, durationDays, numWeeks)
           label = stripPriceFromLabel(item)
           append a tx row with:
             date: today's date formatted "MMM d, yyyy"
             item: label
             unitPriceDisplay: `$${price}${multiplier || ''}` (e.g. "$285/week")
             days: (durationDays if multiplier === '/day' else "")
             weeks: ((numWeeks if multiplier in ['/day', '/week']) else "")
             totalFormula: pricing.formula
             status: "owed"
 10. After all tx rows are appended, call updateBalanceFormula(customerRow,
     profileUrl) — this also updates the bg color and group state.
 11. Apply row grouping over (subHeader, lastTxRow) range.
 12. Set group expanded if balance > 0, else collapsed.
 13. logWebhookEvent(payload, summary) — store last 50 in Script Properties.

═══════════════════════════════════════════════════════════════════════
doPost(e) — the actual webhook entry point
═══════════════════════════════════════════════════════════════════════

  function doPost(e) {
    try {
      const payload = JSON.parse(e.postData.contents);
      processWebhookPayload(payload);
      return ContentService.createTextOutput('OK')
        .setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
      logWebhookEvent({ raw: e.postData?.contents }, 'ERROR: ' + err.message);
      return ContentService.createTextOutput('OK')
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }

NEVER throw a 500 — always 200 OK to GHL so it doesn't retry forever.

═══════════════════════════════════════════════════════════════════════
runFakeWebhook() — for testing
═══════════════════════════════════════════════════════════════════════

Build a fake `e` object with a JSON.stringify'd payload simulating:

  contact-level fields:
    email: "stage4test@example.com"
    name: "Stage 4 Test"
    phone: "555-0200"
  customField (array of {id, value}):
    Waiver Origin: "Florida"
    Camp Duration value: "3 days ($285/week)"
    Camp Dates value: ["Jun 1-5", "Jun 8-12", "Jul 6-10"]
    Lunch Selection: "Pizza ($7.75/day)"
    T-shirt: "T-shirt XL ($25)"

Wrap it appropriately so extractSubmissionFields finds the submission
block. Choose whichever Defense A path you want to simulate (e.g.,
payload.submitted_form_data with the array of {id, value, name}).

Call doPost(e). Verify:
  - Customer row appears at row 2 with email "stage4test@example.com"
  - Sub-header at row 3
  - Three tx rows at rows 4, 5, 6 with:
      Row 4: Camp 3-day, $285/wk, days 3, weeks 3, =285*3, status owed
      Row 5: Pizza,      $7.75/day, days 3, weeks 3, =7.75*3*3, status owed
      Row 6: T-shirt XL, $25, days blank, weeks blank, =25, status owed
  - Customer balance cell shows "$924.75" with light red background
    (or "(not found in Florida)" since fake email; bg still light red)
  - Group is expanded (balance > 0)

After verification, runFakeWebhook() should ALSO clean up by deleting
the test rows it created — so re-running is idempotent.

Run runFakeWebhook() TWICE in a row. Confirm both runs leave the same
final state (clean sheet between runs). The point: the logic correctly
finds and updates an existing customer rather than creating duplicates.

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 4
═══════════════════════════════════════════════════════════════════════

  1. Webhook.gs exists with all listed functions.
  2. runFakeWebhook() runs successfully on first invocation.
  3. The expected rows appear with the correct values.
  4. The Total formulas are LITERAL formulas (=285*3, =7.75*3*3, =25)
     — verify by reading the formula property of each cell, not just
     the displayed value.
  5. The Balance cell's background color is light red (#FCE4E4).
  6. runFakeWebhook() ALSO works idempotently — running it a second
     time results in the same end state, no duplicates.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. A snapshot of all rows + cells written by runFakeWebhook(), as a
     JSON or table, with each cell's value AND formula property — so
     we can verify Total cells contain literal formulas.
  3. Which Defense A path you used (which payload key worked) AND a
     redacted sample of the simulated payload structure.
  4. The Logger output and the contents of the rolling debug log
     (last 5 events from Script Properties) so we can see what was
     captured.
  5. Any unresolved issues, ambiguities, or assumptions.
  6. Done. Do NOT proceed to Stage 5 — wait for the next prompt.
```

---

## Acceptance criteria

1. `Webhook.gs` exists with all listed functions
2. `runFakeWebhook()` runs successfully on first invocation
3. The expected rows appear with the correct values
4. The Total formulas are LITERAL formulas (`=285*3`, `=7.75*3*3`, `=25`) — verified by reading the cell's `.getFormula()`, not just the displayed value
5. The Balance cell's background color is light red (`#FCE4E4`)
6. `runFakeWebhook()` works idempotently — second run results in the same end state, no duplicates

## What to report back

1. Confirmation each acceptance item passes
2. Snapshot of all rows + cells written by `runFakeWebhook()` (as JSON or table) with each cell's value AND formula property
3. Which Defense A path worked (which payload key was found) plus a redacted sample of the simulated payload
4. The Logger output and the last 5 events from the rolling debug log in Script Properties
5. Any unresolved issues, ambiguities, or assumptions

## Next stage

After Stage 4's report is approved, move to **[05-deployment.md](05-deployment.md)**.
