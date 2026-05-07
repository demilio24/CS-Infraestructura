# Stage 9a² — Trace and kill the `item="1"` phantom rows (follow-up to 9a)

> The first 9a session got deep into the code but ran out of context before cracking the bug. This follow-up bundles everything the last session learned so the next agent doesn't repeat that exploration. The plan: (1) un-truncate the Logs raw_payload column so we can actually read submissions, (2) add per-iteration logging to `processSubmission`'s tx-write loop, (3) trigger one replay and read the logs to identify the exact field producing `item="1"`, then (4) apply the targeted fix.

**Run order:** 2nd. Run after [1-fix-stacked-row-groups.md](1-fix-stacked-row-groups.md) so replays don't keep stacking row-group depth while you trace.
**Background:** [architecture spec](../docs/billing-dashboard-plan.md), [pricing convention](../docs/pricing-syntax.md), source in [../apps-script/](../apps-script/). _The first 9a attempt explored deeply but didn't ship — see git history if you need it._

---

## The prompt

Copy this entire block into a fresh Claude Chrome extension instance with the Apps Script editor + Dashboard tab open:

````
FOCUSED FIX (continuation) — Stage 9a². The previous session
diagnosed deeply but ran out before producing a fix. Do NOT
restart the diagnostic from scratch. Use the established
findings below as your starting point. Goal: kill the 10
phantom tx rows and ship the fix.

═══════════════════════════════════════════════════════════════════════
WHAT THE PREVIOUS SESSION ESTABLISHED (do not re-verify)
═══════════════════════════════════════════════════════════════════════

  ESTABLISHED FACTS:
    1. After a fresh replayAllSubmissions(), the Dashboard
       still has exactly 10 phantom tx rows. Current code IS
       producing them. They are NOT stale data.

    2. The phantom row cell values (read via getValues, not
       display): item="1", unit="1", days="", weeks="",
       total=1, status="owed". The "$" sign you may see on
       screen is currency formatting, not the cell value.

    3. Affected customers (rows on Dashboard):
         row 5  Daniela Martinat
         row 11 Greg Grant
         row 25 Jamie Beale Howe
         row 33 Olivia Thomason
         row 39 Laura Cook
         row 43 Kelly Trochez
         row 47 Kelly Trochez
         (3 more — total = 10)

    4. The GHL submission payload structure: payload.others
       is a FLAT object map keyed by field ID. Values can be:
         - strings ("Pizza ($30/week)")
         - arrays of strings (["Tuesday", "Wednesday"])
         - empty arrays []
         - numbers
         - "None"

    5. Logs sheet's "Raw Payload" column (col F) is TRUNCATED
       at 4000 chars (see Polling.gs around line 313:
         rawPayload: JSON.stringify(submission).substring(0, 4000)).
       JSON.parse fails because the string ends mid-object.
       This blocked all attempts to inspect payloads from logs.

    6. stripPriceFromLabel(s) only removes `\s*\(\$[^)]+\)`
       patterns. Bare "$1" (no parens) returns unchanged.

    7. The $-filter at Polling.gs:398
         if (!String(field.value || '').includes('$')) continue;
       correctly blocks bare "1" values.

    8. parseMultiSelectValue handles arrays via .map(String).

  HYPOTHESES ALREADY ELIMINATED:
    a. NOT bare "1" slipping through the $-filter.
    b. NOT a parseMultiSelectValue split bug.
    c. NOT stale rows from a pre-Stage-9 era.
    d. NOT a value-of-"$1" field producing item="1"
       (label logic would yield "$1" or field.name, never "1").

  THE OPEN QUESTION:
    Where in the code is item="1" being written? It cannot
    come from the documented tx-write loop with the current
    filters. The next session must instrument the code to
    PROVE which line writes it.

═══════════════════════════════════════════════════════════════════════
STEP 1 — Un-truncate the Logs raw_payload column
═══════════════════════════════════════════════════════════════════════

OPEN: Polling.gs.
FIND the line that builds the rawPayload value. It looks like:
  rawPayload: JSON.stringify(submission).substring(0, 4000)

Google Sheets allows up to 50,000 characters per cell. Change
the truncation cap to 45000:
  rawPayload: JSON.stringify(submission).substring(0, 45000)

This alone will let future debugging functions JSON.parse the
payloads.

═══════════════════════════════════════════════════════════════════════
STEP 2 — Add per-iteration trace logging to processSubmission
═══════════════════════════════════════════════════════════════════════

OPEN: Polling.gs > processSubmission.
FIND the tx-write loop (around lines 394-418). The loop iterates
over `submissionFields`, then `parseMultiSelectValue(field.value)`,
then for each `item` it computes price/multiplier and calls
appendTxRow.

ADD a Logger.log call IMMEDIATELY BEFORE every appendTxRow
call inside the loop. Log this exact shape so we can grep:

  Logger.log(JSON.stringify({
    trace: 'TX_WRITE',
    customerEmail: email,
    submissionId: submission.id,
    fieldId: field.id,
    fieldName: field.name,
    rawFieldValue: field.value,
    itemStr: itemStr,
    pricingPrice: price,
    pricingMultiplier: multiplier,
    pricingRule: pricing.rule,
    pricingFormula: pricing.formula,
    computedItemLabel: <whatever the label IIFE produced>,
    computedUnitDisplay: '$' + price + (multiplier || ''),
  }));

To capture computedItemLabel cleanly, hoist the IIFE result
into a local variable BEFORE constructing the appendTxRow
arg, e.g.:

  const computedItemLabel = (function(){
    var lbl = stripPriceFromLabel(itemStr);
    return (lbl && !/^[$0-9.+\-\s()\/]+$/.test(lbl)) ? lbl :
           ((field.name && field.name !== "(unnamed)")
              ? field.name : lbl);
  })();
  Logger.log(JSON.stringify({...trace fields..., computedItemLabel}));
  appendTxRow(customerRow, {
    ...,
    item: computedItemLabel,
    ...
  });

ALSO log every iteration that hits a `continue` (so we can see
what's being SKIPPED vs what's being written):

  if (!String(field.value || '').includes('$')) {
    Logger.log(JSON.stringify({trace: 'SKIP_NO_DOLLAR',
      fieldId: field.id, fieldName: field.name,
      rawFieldValue: field.value}));
    continue;
  }

And the PRICE_REGEX skip:

  if (!PRICE_REGEX.test(itemStr)) {
    Logger.log(JSON.stringify({trace: 'SKIP_NO_PRICE_REGEX',
      fieldId: field.id, fieldName: field.name, itemStr}));
    continue;
  }

═══════════════════════════════════════════════════════════════════════
STEP 3 — Run a targeted replay for ONE affected customer
═══════════════════════════════════════════════════════════════════════

We don't need all 31 submissions logged. Pick ONE customer with
a phantom row — Daniela Martinat is good (row 5).

Add a one-shot helper function in Polling.gs (or QA.gs):

  function replayOneCustomerForTrace_(emailLike) {
    const submissions = fetchAllSubmissionsFlorida_(); // or whatever
                          // existing function fetches all subs
    const matches = submissions.filter(s =>
      String(s.email || '').toLowerCase().includes(emailLike.toLowerCase()));
    Logger.log('Found ' + matches.length + ' submissions for '
               + emailLike);
    for (const s of matches) {
      processSubmission(s, 'Florida');
    }
  }

  function traceDaniela() {
    replayOneCustomerForTrace_('danielamartinat');
  }

If you can't easily find or call the existing fetch function,
the simpler approach: filter Logs sheet for danielamartinat,
read the rawPayload (now un-truncated post-Step-1), and feed
each one back through processSubmission directly. Use Logs
col B (Submission ID) for dedupe-bypass — set TEST_MODE_BYPASS
flag if needed, OR clear Daniela's Dashboard rows + her Logs
rows first so the dedupe lets the replay through.

Run traceDaniela(). Open the execution log. Find every
`"trace":"TX_WRITE"` line and look for the one whose
computedItemLabel === "1". That line IS the phantom-producing
field — note its fieldId, fieldName, rawFieldValue, itemStr.

═══════════════════════════════════════════════════════════════════════
STEP 4 — Apply the targeted fix
═══════════════════════════════════════════════════════════════════════

Once you know the source field, the fix lands in one of these
shapes:

  CASE A: rawFieldValue is something like ["1"] or [1]
          (an array containing only a bare number/digit)
    → Add an early-loop check that skips array items where
      the item is purely numeric:

        if (/^\d+(\.\d+)?$/.test(itemStr)) {
          Logger.log(JSON.stringify({trace: 'SKIP_BARE_NUMBER',
            fieldId: field.id, itemStr}));
          continue;
        }

      Place this immediately after the PRICE_REGEX check.

  CASE B: rawFieldValue is something pathological like
          "Some Label, $25/week, 1" where the trailing "1"
          gets through because the WHOLE STRING contains $
    → Same SKIP_BARE_NUMBER check works.

  CASE C: itemStr is "$1" but field.name is literally "1"
    → The bug is on the name side. Look at FieldRegistry.gs
      and figure out why a field name in the registry is "1".
      Likely a field with a misnamed/empty label. Add to a
      NON_BILLING_FIELD_IDS skip list keyed by ID:

        const NON_BILLING_FIELD_IDS = new Set([
          '<the field ID you found>',
        ]);
        ...
        if (NON_BILLING_FIELD_IDS.has(field.id)) continue;

  CASE D: an entirely different code path (NOT the tx-write
          loop) is calling appendTxRow.
    → Search the project for every appendTxRow call site
      (Apps Script editor: Ctrl+Shift+F → "appendTxRow").
      One of them is feeding garbage. Fix that call site.

═══════════════════════════════════════════════════════════════════════
STEP 5 — Verify the kill
═══════════════════════════════════════════════════════════════════════

  a. Save all .gs files.
  b. Run replayAllSubmissions().
  c. Run a simple count diagnostic — paste this into a function
     and run it:

       function countPhantomRows() {
         const sh = getDashboardSheet();
         const last = sh.getLastRow();
         if (last < 2) { Logger.log('empty'); return; }
         const data = sh.getRange(2, 1, last-1, 7).getValues();
         let phantoms = 0;
         for (let i = 0; i < data.length; i++) {
           const row = data[i];
           const item = String(row[1] || '').trim();
           const unit = String(row[2] || '').trim();
           const total = row[5];
           // tx row with literal "1" in item AND unit AND total=1
           if (item === '1' && unit === '1' &&
               (total === 1 || total === '1' || total === 1.0)) {
             phantoms++;
             Logger.log('PHANTOM at row ' + (i+2));
           }
         }
         Logger.log('Total phantom rows: ' + phantoms);
       }

  d. Expected: "Total phantom rows: 0".
  e. If still > 0, the fix didn't cover the actual case. Read
     the trace logs again, find the missed case, patch.

  f. Once phantoms = 0, run runFullQA(). Should still pass.

  g. Remove or gate the TX_WRITE / SKIP_NO_DOLLAR /
     SKIP_NO_PRICE_REGEX / SKIP_BARE_NUMBER trace Logger.log
     calls behind a flag so they don't spam future runs:

       const TX_TRACE = false; // flip to true for debugging
       if (TX_TRACE) Logger.log(...);

     Leave the un-truncation (Step 1) in place — that's a
     permanent quality-of-life improvement.

═══════════════════════════════════════════════════════════════════════
WHAT NOT TO TOUCH
═══════════════════════════════════════════════════════════════════════

  - Column layout (final).
  - Brand colors, alignment, Bulk menu (final).
  - parseMultiSelectValue (already correct).
  - The $-filter at line 398 (keep — works for bare "1").
  - Stage 8 dedupe.
  - Stage 9c QA tests, Stage 9b Waiver Origin.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  ## Step 1 — payload un-truncation
    - Line changed, before/after substring cap

  ## Step 2 — trace logging added
    - Diff snippet showing the Logger.log calls

  ## Step 3 — root cause found
    - The field ID + name + raw value
    - The itemStr at the moment of the phantom write
    - WHICH CASE (A/B/C/D) it falls under, with reasoning
    - Paste 2-3 representative trace log lines

  ## Step 4 — fix applied
    - Diff snippet of the skip / filter / fix

  ## Step 5 — verification
    - countPhantomRows() output: "Total phantom rows: <n>"
    - runFullQA(): X PASS, Y FAIL
    - Trace logs gated behind TX_TRACE flag: yes / no

  ## Anything else
    - Surprises, ambiguities, follow-ups

  STOP. Wait for sign-off.
````

---

## Acceptance

1. Logs raw_payload column captures up to 45000 chars (parseable JSON for any normal submission)
2. Per-iteration TX_WRITE / SKIP_* trace logs added (gated behind a `TX_TRACE` flag for production)
3. Root cause field identified by ID + name + raw value, documented in the report
4. Targeted fix applied (Case A/B/C/D)
5. `countPhantomRows()` returns 0 after replay
6. `runFullQA()` still passes
