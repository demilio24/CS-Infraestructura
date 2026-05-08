# Future nice-to-haves

> Captured during the Stage 9 follow-up rounds. Most items shipped; only #7 remains deferred.

---

## ⚠️ OPEN: UrlFetch quota fix (long-term)

**Context (2026-05-08):** Polling started failing daily with `Service invoked too many times for one day: urlfetch`. Root cause: `syncTransactionsSheet` runs unconditionally on every 5-min poll and burns roughly 3 GHL calls per Dashboard customer (`ghlGetContact` + `ghlSearchContactByEmail` + `payments/transactions`). At 5-min cadence that's 864 calls per customer per day, which blew past the 20K consumer Gmail UrlFetchApp quota at around 23 customers.

**Short-term fix shipped 2026-05-08:** Polling interval bumped from 5 min to 30 min via `installPollingTrigger` in `Polling.js`. 6x reduction, safe up to ~138 customers on the consumer 20K quota. Holding for the weekend.

**Long-term fix (do these in order):**

1. **Decouple `syncTransactionsSheet` from the poll loop.** Either:
   - **Gate it:** only run when `processedCount > 0` (cheapest, but means refunds/voids made directly in GHL won't reflect on the Transactions sheet until the next form submission arrives), OR
   - **Move it to its own hourly trigger:** new `installTxSyncTrigger()` running `syncTransactionsSheet` every 60 min, independent of `pollFloridaSubmissions`. Preserves "refunds reflect automatically" behavior at 1/12 the call cost. Recommended.
   - Either way, also strip the `if (processedCount > 0) { ... syncTransactionsSheet(); }` block from `pollFloridaSubmissions` in `Polling.js`.
2. **Restore polling cadence to 5 min** once #1 is in place. New form submissions appear on the Dashboard within 5 min again.
3. **Move triggers off the consumer Gmail account.** Currently `pollFloridaSubmissions` and `dailyHealthCheck` are owned by `systemafloydsheets@gmail.com` (20K/day UrlFetch). Move to a Google Workspace account (100K/day) for headroom:
   - Share the Sheet with the Workspace account as Editor
   - From the Gmail account: Triggers panel, delete both triggers
   - From the Workspace account: open Apps Script editor, run `installPollingTrigger` and `installDailyHealthCheckTrigger`
   - Verify in Triggers panel that the Workspace email is the trigger owner

**Why all three:** With #1 + #3, you'd need around 1,400 customers to hit the daily quota again. Without #1, even Workspace's 100K caps out at around 115 customers.

---

## ✅ 1. Grand total "balance owed" in row 1 — SHIPPED 2026-05-05

- Row 1 col G now displays `Balance: $X,XXX.XX` — sum across every customer's outstanding balance.
- Implementation: `=TEXT(SUMIF($B$2:$B,"*@*",$G$2:$G),"#,##0.00")` formula set by `refreshGrandTotalHeader()` in `SheetWrites.js`.
- Called from `pollFloridaSubmissions` tail and `nuclearReset`. Reactive — flips automatically when any tx row's status changes.

## ✅ 2. Show source field name on each tx row — SHIPPED 2026-05-05

- Each tx row's Item cell (col B) now carries a 2-line cell Note: `Submission ID: ...` + `Field: <fieldName>`.
- Implementation: `appendTxRow` accepts a `sourceFieldName` in `txData`; `processSubmission` passes `field.name`.

## ✅ 3. Remove HYPERLINK from Balance cell — SHIPPED 2026-05-05

- Col G is now a plain numeric SUMIFS, currency-formatted, no link.
- Profile click is exclusively on col F (Contact Profile Link).
- Implementation: `buildBalanceFormula` in `Helpers.js` returns `=SUMIFS(F:F,G:G,"owed")` with no HYPERLINK wrapper.

## ✅ 4. Student names append, not overwrite — SHIPPED 2026-05-05

- `upsertCustomerRow` now reads existing col E, splits on commas, unions with incoming names (case-insensitive dedupe), writes back.
- A parent who registers multiple kids over time sees `Bobby, Sarah, Charlie` accumulate, not `Charlie` alone.

## ✅ 5. $1 credit-card-verification fees logged as already-paid — SHIPPED 2026-05-05

- GHL's `payment` field (always `$1`) writes a tx row with item `"CC verification fee"` and status `"paid"` on creation.
- These rows DON'T pollute the customer's balance (SUMIFS excludes paid).
- Implementation: detection happens in `processSubmission`'s tx-write loop — `field.id === 'payment' && price === 1 && !multiplier`.

## ✅ 6. Bulk status change across multi-cell selection — SHIPPED 2026-05-05

- New menu items under **Bulk**: `Set selected CELLS → paid / owed / canceled / refunded`.
- Operates on `getActiveRangeList()` so multi-range selections work.
- Iterates every selected cell that's in col G of a tx row, sets the status, and recomputes balance for every customer touched.

## ✅ 7. Native filter views with preset sorts + filters — SHIPPED 2026-05-05

- Three named filter views available under **Data → Filter views**:
  - `1. Owes a balance` — shows only customers with a non-zero balance
  - `2. Fully paid` — shows only customers with zero balance
  - `3. Highest balance first` — sort descending by balance
- Implementation: enabled the **Sheets Advanced Service** in `appsscript.json` and use `Sheets.Spreadsheets.batchUpdate` with `addFilterView` requests. `setupFilterViews()` in `SheetWrites.js` is idempotent — deletes prior managed views before re-adding.
- Bonus complementary feature: status-filter toggle in cell H1 (`All customers` / `Owes a balance` / `Fully paid`) that hides customer sections via an `onEdit` handler. Same outcome as the filter views but no menu navigation needed.
- Bonus tx-label change: every tx row's Item now reads `Question: Answer` (e.g., `Camp Duration: Full Week`) so Erin sees the form question alongside the answer.

---

## Bonus fixes shipped along the way (not in original list)

These all surfaced during the implementation of #1–#6 and were fixed at the same time:

- **`getRowGroupDepth` API confusion** — it's a `Sheet` method, not `Range`. Fixed in `applyRowGrouping` and `resetAllRowGroups_`.
- **Sub-header detection bug** — `findCustomerTxRange` always returned a non-null object even when no sub-header existed, so the Stage-8 `if (!existingRange) appendSubHeaderRow(customerRow)` never fired during polling. Replaced with a direct cell-content check on `customerRow + 1`.
- **Tx-row bg/font inheritance** — `insertRowAfter` copies formatting from the source row, so tx rows inserted right after a sub-header inherited `#4a6493` + white bold. `appendTxRow` now resets bg / font color / weight / size explicitly.
- **Grouping range excluded sub-header** — was `(firstTx, lastTx)`, now `(customerRow + 1, lastTx)` so collapse hides the entire section.
- **Per-submission grouping calls didn't always stick** — added a defensive `regroupAllCustomers()` tail to `pollFloridaSubmissions` that runs after all submissions process.
- **Sub-header values got clobbered** — `insertRowAfter` also copies data validation rules. A fresh sub-header inserted right after a tx row inherited the status-dropdown validation, which then rejected `'STATUS'` as a value. `appendSubHeaderRow` now calls `clearDataValidations()` before writing.
- **Customer balance formula rejected** — same validation-inheritance bug on the customer row. `upsertCustomerRow` and `updateBalanceFormula` now both call `clearDataValidations()` before writing the SUMIFS formula.
- **Phantom `item="1"` rows from GHL's built-in `payment` field** — root cause was the `$1` form-fee marker passing the `$`-filter. Initially fixed by adding `'payment'` to `SKIP_IDS`; later replaced (per nice-to-have #5) with "include but auto-paid."
- **Status validation never applied to polling-created tx rows** — `appendTxRow` now calls `applyStatusDropdown(txRow)` at the end so chip dropdowns render for every tx row.
- **Logs `raw_payload` truncated at 4000 chars** — JSON.parse failed for any non-trivial payload, blocking diagnostics. Bumped to 45000 chars.
- **Grand-total formula range got auto-shifted past the data area** — Sheets adjusts cell references when rows insert. Setting the formula AFTER polling completes (in the regroup tail) avoids it.
- **Stale Stage-1-era conditional formatting rules** — the `#EEF3F8` customer + `#D5DCE5` sub-header CF rules were overlaying the new brand colors. `nuclearReset` strips all CF and re-adds only the per-status rules.
- **`runFullQA` test count off by 5** — the `C_pmsv1`–`C_pmsv5` parseMultiSelectValue tests were defined as a module-level IIFE (ran at script-load, before `QA_RESULTS` was reset). Moved them inside `runCat_C`.

---

**Status:** captured 2026-05-05 by Claude Code. All but #7 shipped same day.
**Owner:** Emilio (Nils Digital).
**Test coverage at sign-off:** runFullQA 56/0, prompt5FinalAcceptance 18/18, stressTest 6/6 — 80 total assertions, all green.
