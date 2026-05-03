# Stage 3 — Sheet write functions

> Add functions that write rows to the Dashboard sheet — customer rows, sub-header rows, tx rows, balance formulas, row groupings, status dropdowns. No webhook handler yet. Ends with a test that creates a mock customer with three tx rows, verifies the math + colors + groupings, then cleans up.

**Prerequisite:** [Stage 2](02-helpers.md) acceptance confirmed
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## The prompt

Copy this entire block into the Claude Chrome extension:

```
STAGE 3 of 5 — Add functions that write rows to the Dashboard sheet.
This stage adds the building blocks for inserting customers, sub-
header rows, tx rows, computing balance, and managing row groups.
NO webhook handler yet.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE ONLY
═══════════════════════════════════════════════════════════════════════

Add a new file SheetWrites.gs with the following functions:

  - getDashboardSheet()                                    → SpreadsheetApp.Sheet
  - findCustomerRowByEmail(email)                          → row number or null
  - findCustomerTxRange(customerRow)                       → {firstTx, lastTx, lastInGroup}
                                                              firstTx is the first tx row index
                                                              (= sub-header row + 1).
                                                              lastTx is the last tx row.
                                                              lastInGroup is the last row of the
                                                              entire group (sub-header + tx rows).
                                                              If no tx rows yet, firstTx > lastTx.
  - upsertCustomerRow(payload)                             → customer row number
        Where payload = { email, name, phone, waiverOrigin, profileUrl, contactId }
  - appendSubHeaderRow(afterRow)                           → row number
        Inserts the sub-header row directly after `afterRow`
        with content: A="Date", B="Item", C="Unit Price",
                      D="Days", E="Weeks", F="Total", G="Status"
  - appendTxRow(customerRow, txData)                       → tx row number
        Where txData = { date, item, unitPriceDisplay, days, weeks,
                          totalFormula, status }
  - applyStatusDropdown(rowNumber)
        Sets data validation on col G of `rowNumber` to require one of:
          paid, owed, canceled, refunded
        Default value: "owed"
        Use the chip-style dropdown if Apps Script supports it; otherwise
        fall back to plain dropdown — the conditional formatting from
        Stage 1 still gives the visual color cue.
  - updateBalanceFormula(customerRow, profileUrl)
        Reads firstTx/lastTx via findCustomerTxRange, calls
        buildBalanceFormula, writes the result into col E of customerRow.
        Then computes the numeric balance (a SUMIFS via direct read of
        the tx rows) and sets col E's background color accordingly:
          balance > 0 → #FCE4E4 (light red)
          balance = 0 → white (no fill)
          balance < 0 → #E0EEF8 (light blue)
  - applyRowGrouping(subHeaderRow, lastInGroup)
        Wraps rows from subHeaderRow to lastInGroup in a row group
        (collapsible).
  - setGroupExpansion(subHeaderRow, expanded)
        expanded = true → group is expanded; false → collapsed.
        Used after balance recompute to apply default state.

Plus a test function stage3SheetWriteTests() that exercises everything.

═══════════════════════════════════════════════════════════════════════
TEST FUNCTION — stage3SheetWriteTests()
═══════════════════════════════════════════════════════════════════════

Wipes any test data and runs through this sequence:

  1. Call upsertCustomerRow with mock data:
       email: "stage3test@example.com"
       name: "Stage 3 Test"
       phone: "555-0100"
       waiverOrigin: "Florida"
       profileUrl: null  (pretend not found)
       contactId: null
  2. Append sub-header.
  3. Append three tx rows:
       Tx A: date Apr 12 2026, item "Camp 3-day", unitPrice "$285/wk",
             days 3, weeks 3, totalFormula "=285*3", status "owed"
       Tx B: date Apr 12 2026, item "Pizza", unitPrice "$7.75/day",
             days 3, weeks 3, totalFormula "=7.75*3*3", status "owed"
       Tx C: date Apr 13 2026, item "T-shirt XL", unitPrice "$25",
             days "", weeks "", totalFormula "=25", status "paid"
  4. Apply status dropdown on each tx row.
  5. Update balance formula on the customer row.
  6. Apply row grouping.
  7. Set group expanded (since balance > 0).
  8. Verify by reading back:
     - Customer row exists with the email
     - Sub-header row exists immediately below customer
     - Three tx rows exist below sub-header
     - F4 (Total of Tx A) displays $855.00
     - F5 (Total of Tx B) displays $69.75
     - F6 (Total of Tx C) displays $25.00
     - Balance cell (E2) displays "(not found in Florida)" and its
       background is light red (#FCE4E4) because computed balance
       ($924.75) > 0
  9. Cleanup: delete the test customer's rows so we end clean.
 10. Logger.log [PASS]/[FAIL] for each assertion.

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 3
═══════════════════════════════════════════════════════════════════════

  1. SheetWrites.gs exists with all listed functions.
  2. stage3SheetWriteTests() runs end-to-end without throwing.
  3. All [PASS] in the Logger output.
  4. After cleanup step 9, the Dashboard sheet is empty (just header
     row 1) — the test left no residue.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. The full Logger output of stage3SheetWriteTests().
  3. Whether dropdown chips with colored pills could be configured via
     Apps Script API, or whether you fell back to plain dropdown.
  4. A screenshot or description of how the test customer's group
     looked while the test was mid-run (between steps 7 and 9), so I
     can sanity-check the visual result.
  5. Any unresolved issues, ambiguities, or assumptions.
  6. Done. Do NOT proceed to Stage 4 — wait for the next prompt.
```

---

## Acceptance criteria

1. `SheetWrites.gs` exists with all listed functions
2. `stage3SheetWriteTests()` runs end-to-end without throwing
3. All `[PASS]` in the Logger output
4. After cleanup, the Dashboard sheet is empty (just header row 1)

## What to report back

1. Confirmation each acceptance item passes
2. Full Logger output of `stage3SheetWriteTests()`
3. Whether dropdown chips with colored pills work via Apps Script API, or you fell back to plain dropdown
4. Screenshot or description of the test customer's group during the mid-run state (between steps 7 and 9)
5. Any unresolved issues, ambiguities, or assumptions

## Next stage

After Stage 3's report is approved, move to **[04-webhook.md](04-webhook.md)**.
