# Stage 9b — Populate Waiver Origin (col D) for every customer

> Stage 9 added Student Name extraction (col E) successfully but did not actually fix Waiver Origin. Col D is still blank for every customer on the Dashboard. The script is failing to read the field — either it's named differently than expected, or the lookup logic doesn't match it.

**Run order:** 3rd. Independent of [2-phantom-rows-trace.md](2-phantom-rows-trace.md) but easier to verify after the phantom rows are gone.
**Background:** [architecture spec](../docs/billing-dashboard-plan.md), [pricing convention](../docs/pricing-syntax.md), source in [../apps-script/](../apps-script/).

---

## The prompt

Copy this entire block into a fresh Claude Chrome extension instance with the Apps Script editor open:

````
FOCUSED FIX — Stage 9b. Populate the Waiver Origin column (col D)
on the Systema Floyd Billing Dashboard. It's blank for every
customer right now. This is a single targeted fix.

═══════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════

Three GHL subaccounts: Florida, Georgia, Virginia. A custom
contact field tells the script which subaccount to route the
customer to and lights up col D on the Dashboard. The expected
field name is "Waiver Origin" with values "Florida" / "Georgia"
/ "Virginia". Empty defaults to Florida.

The reason col D is empty for every customer is one of:
  - the field has a different name on the form than expected
  - the field exists but the customer left it blank
  - resolveSubaccount + readCustomField aren't matching by the
    right key
  - the value extracted is being passed to upsertCustomerRow
    but written to the wrong column

We need to find out which, fix it, and backfill the existing
rows.

═══════════════════════════════════════════════════════════════════════
STEP 1 — Inspect FieldRegistry
═══════════════════════════════════════════════════════════════════════

Run getFieldRegistry() (or refreshFieldRegistry() if cache is
stale) for all three subaccounts. For each, list every custom
field where the field name OR fieldKey contains any of:
  "waiver", "origin", "state", "location"

(Case-insensitive match.)

Write a one-shot diagnostic function in QA.gs or Configuration.gs
called `debugFindWaiverField()`:

  function debugFindWaiverField() {
    const states = ['Florida', 'Georgia', 'Virginia'];
    for (const state of states) {
      const reg = getFieldRegistry(state);
      const matches = Object.entries(reg).filter(([id, f]) => {
        const name = (f.name || '').toLowerCase();
        const key  = (f.fieldKey || '').toLowerCase();
        return /waiver|origin|state|location/.test(name + ' ' + key);
      });
      Logger.log(state + ': ' + matches.length + ' match(es)');
      matches.forEach(([id, f]) =>
        Logger.log('  id=' + id +
                   ' name=' + JSON.stringify(f.name) +
                   ' key=' + JSON.stringify(f.fieldKey)));
    }
  }

Run it. Paste the full output into your report.

═══════════════════════════════════════════════════════════════════════
STEP 2 — Pick the matching field name + alias-based lookup
═══════════════════════════════════════════════════════════════════════

From the diagnostic above, identify the canonical field name in
each subaccount. They may differ — that's fine.

In Helpers.gs (or wherever readCustomField / resolveSubaccount
lives), implement an alias-based lookup that tries each of these
in order, case-insensitive:

  const WAIVER_ORIGIN_ALIASES = [
    'waiver origin',
    'waiver state',
    'state',
    'location',
    // <add the actual names you found, lowercased>
  ];

  function readWaiverOrigin(payload, registry) {
    // 1. Build a name → value map from the submission's
    //    extractSubmissionFields output.
    const fields = extractSubmissionFields(payload);
    const byNameLower = {};
    for (const f of fields) {
      const name = (f.name || '').toLowerCase().trim();
      if (name && f.value) byNameLower[name] = f.value;
    }
    // 2. Try aliases in order.
    for (const alias of WAIVER_ORIGIN_ALIASES) {
      if (byNameLower[alias]) return String(byNameLower[alias]).trim();
    }
    // 3. Fall back: look up by ID via the registry's reverse
    //    name → id map for any alias.
    // (Optional — only if step 2 misses.)
    return '';
  }

In processSubmission, replace the existing waiver-origin
extraction with a call to readWaiverOrigin(payload, registry).
Pass the resolved value to upsertCustomerRow as the `waiverOrigin`
field, which writes it to col D.

═══════════════════════════════════════════════════════════════════════
STEP 3 — Confirm upsertCustomerRow writes col D correctly
═══════════════════════════════════════════════════════════════════════

In SheetWrites.gs > upsertCustomerRow, locate the line that
writes col D. Verify:
  - the field index is COL.WAIVER_OR_DAYS (= 4)
  - the value passed in is the resolved waiver origin string
  - it's not being overwritten by a later setValue call

If any of those fail, fix.

═══════════════════════════════════════════════════════════════════════
STEP 4 — Backfill existing rows
═══════════════════════════════════════════════════════════════════════

Call replayAllSubmissions() (or run resortByEmail() if the
existing customer rows already cache the right data — but
replay is safer because it re-runs the whole pipeline).

Open Dashboard. Confirm:
  - Every customer has a non-empty col D
  - The value matches the customer's actual subaccount
    (cross-check by clicking the Contact Profile link in col F
     — the URL contains the locationId)

═══════════════════════════════════════════════════════════════════════
WHAT NOT TO TOUCH
═══════════════════════════════════════════════════════════════════════

  - resolveSubaccount logic for ROUTING (don't break the
    Florida default).
  - Student Name extraction (already working).
  - The column indices (final).

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. debugFindWaiverField() output for all 3 subaccounts.
  2. The canonical field name(s) found (which alias matched).
  3. Diff of readWaiverOrigin + WAIVER_ORIGIN_ALIASES.
  4. Diff of processSubmission where it now calls
     readWaiverOrigin.
  5. After replay: how many customers now have non-empty col D
     vs how many are still blank, with reasoning for any blanks.
  6. runFullQA(): pass/fail.
  7. Anything else worth flagging.

  STOP. Wait for sign-off.
````

---

## Acceptance

1. `debugFindWaiverField()` output captured for all 3 subaccounts
2. Alias-based `readWaiverOrigin` implemented and called from `processSubmission`
3. After replay, every customer with a populated waiver field on the form has a non-empty col D matching their actual state
4. Customers who genuinely left the field blank may stay blank — that's data, not a bug — but document it
5. `runFullQA()` still passes
