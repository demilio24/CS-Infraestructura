# Stage 9e — Fix stacked `+`/`-` row group controls in the gutter

> Some customers' row groups show 2, 3, or 4 stacked `+`/`-` controls in the left gutter (visible on Maria Godin, David Kim, Iwona Robinson, and others). This is **nested row grouping**: `applyRowGrouping` calls `shiftRowGroupDepth(+1)` which is additive, and across re-sorts / replays / polling cycles the depth keeps incrementing instead of staying at 1. Fix: make grouping idempotent, and reset groups before any rebuild.

**Run order:** 1st (this file). Independent of the others. Run before [2-phantom-rows-trace.md](2-phantom-rows-trace.md), [3-fix-waiver-origin.md](3-fix-waiver-origin.md), [4-status-chips-and-qa-count.md](4-status-chips-and-qa-count.md), and [5-final-acceptance.md](5-final-acceptance.md).
**Background:** [architecture spec](../docs/billing-dashboard-plan.md), [pricing convention](../docs/pricing-syntax.md), source in [../apps-script/](../apps-script/).

---

## The prompt

Copy this entire block into a fresh Claude Chrome extension instance with the Apps Script editor + Dashboard tab open:

````
FOCUSED FIX — Stage 9e. Eliminate the stacked +/- controls in
the row group gutter on the Systema Floyd Billing Dashboard.

═══════════════════════════════════════════════════════════════════════
THE BUG
═══════════════════════════════════════════════════════════════════════

Visual symptom: in the left gutter next to several customers'
row groups (Maria Godin rows 4-8, David Kim rows 30-35, Iwona
Robinson rows 41-50, etc.), there are 2-4 STACKED +/- controls
stacked vertically. Some customers show one +/- (correct);
others show 3 or 4 stacked.

Root cause: `applyRowGrouping(firstRow, lastRow)` in
SheetWrites.gs uses `Range.shiftRowGroupDepth(+1)`, which is
ADDITIVE — it adds 1 to whatever depth is currently set on the
range. Every time the function runs over the same range, depth
increments. Sources of repeat invocation:
  - resortByEmail() rebuilds groups every time it runs
  - replayAllSubmissions() re-processes every submission and
    each call to processSubmission re-applies grouping
  - polling cron processSubmission applies grouping per poll
  - any manual call to applyRowGrouping during testing

Each depth level renders its own +/- control. Hence stacking.

Apps Script does not expose a `setRowGroupDepth(1)` (absolute
set) — only `shift`. The fix is to REMOVE existing groups at
the affected range before calling shift.

═══════════════════════════════════════════════════════════════════════
FIX 1 — Make applyRowGrouping idempotent
═══════════════════════════════════════════════════════════════════════

OPEN: SheetWrites.gs > applyRowGrouping(firstRow, lastRow)

REPLACE the function body with:

  function applyRowGrouping(firstRow, lastRow) {
    if (lastRow < firstRow) return;
    const sheet = getDashboardSheet();
    const range = sheet.getRange(firstRow, 1,
                                 lastRow - firstRow + 1, 1);

    // Remove ANY pre-existing groups that overlap this range,
    // at every depth, before applying a fresh depth-1 group.
    // getRowGroup(depth) returns the innermost group at that
    // depth that contains the first row of the range, or null.
    let depth = range.getRowGroupDepth();
    while (depth > 0) {
      const group = sheet.getRowGroup(firstRow, depth);
      if (group) group.remove();
      depth--;
    }

    // Now apply a single depth=1 group.
    range.shiftRowGroupDepth(1);
  }

Notes:
  - Sheet.getRowGroup(rowIndex, depth) returns the group at
    that depth containing rowIndex, or null. It's a Sheet
    method, not a Range method.
  - Range.getRowGroupDepth() returns the max depth on the
    range — start at that value and walk down.

═══════════════════════════════════════════════════════════════════════
FIX 2 — Reset all row groups at the start of resortByEmail
═══════════════════════════════════════════════════════════════════════

OPEN: Menu.gs > resortByEmail

Before the rebuild loop runs (i.e., right after capturing the
existing data into JS objects but BEFORE writing back), call:

  // === Clean-slate row group reset over the data area ===
  resetAllRowGroups_(dashSheet);

Add this helper at the bottom of Menu.gs (or in SheetWrites.gs
near applyRowGrouping):

  function resetAllRowGroups_(sheet) {
    // Walk every depth from max down to 1, removing every
    // group on every row. This is O(rows * maxDepth) but it's
    // a one-shot maintenance operation.
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 1);
    let safety = 20; // hard cap — depth shouldn't exceed this
    while (safety-- > 0) {
      const maxDepth = dataRange.getRowGroupDepth();
      if (maxDepth <= 0) return;
      // Remove every group at this depth across the data area
      for (let row = 2; row <= lastRow; row++) {
        const group = sheet.getRowGroup(row, maxDepth);
        if (group) group.remove();
      }
    }
  }

═══════════════════════════════════════════════════════════════════════
FIX 3 — Reset row groups at the start of replayAllSubmissions
═══════════════════════════════════════════════════════════════════════

OPEN: Polling.gs (or wherever replayAllSubmissions lives —
might be in QA.gs or a dedicated file)

After the existing data-area clear (rows 2+), but BEFORE the
loop that re-processes every submission, call the same
resetAllRowGroups_(dashSheet) helper.

This guarantees a clean slate before processSubmission's
applyRowGrouping calls run.

═══════════════════════════════════════════════════════════════════════
VERIFICATION
═══════════════════════════════════════════════════════════════════════

  1. Save all .gs files. No syntax errors.

  2. Run resortByEmail from the Maintenance menu. Watch the
     gutter visually:
       - Every customer should have EXACTLY ONE +/- control
       - No stacking
       - Groups still expand/collapse based on balance

  3. Run replayAllSubmissions. After it finishes, again look at
     the gutter. Confirm: still exactly ONE +/- per customer.

  4. As a stress test: call resortByEmail TWICE in a row
     without doing anything else between calls. Confirm: still
     ONE +/- per customer (idempotency check).

  5. Manually call applyRowGrouping on a known range three
     times in a row from the Apps Script console (target a
     test customer's range). Verify: depth stays at 1.

  6. Run runFullQA. Should still pass at the existing count.

═══════════════════════════════════════════════════════════════════════
WHAT NOT TO TOUCH
═══════════════════════════════════════════════════════════════════════

  - Column layout (final).
  - Brand colors, alignment, Bulk menu (final).
  - parseMultiSelectValue, $-filter, dedupe, Stage 7 parsing.
  - The setGroupExpansion call after applyRowGrouping —
    it stays as-is. Only the depth-management changes.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  ## Fix 1 — applyRowGrouping idempotent
    - Diff of the new applyRowGrouping body
    - Status: PATCHED ✓ / FAILED ✗

  ## Fix 2 — resortByEmail resets first
    - Diff of where resetAllRowGroups_ is called
    - Status: PATCHED ✓ / FAILED ✗

  ## Fix 3 — replayAllSubmissions resets first
    - Diff
    - Status: PATCHED ✓ / FAILED ✗

  ## Verification
    - resortByEmail single run: ONE +/- per customer? yes/no
    - replayAllSubmissions: ONE +/- per customer? yes/no
    - Double resortByEmail: still ONE? yes/no
    - 3x applyRowGrouping on same range: depth stays at 1? yes/no
    - runFullQA: pass/fail (count)

  ## Anything else
    - Surprises, ambiguities, follow-ups

  STOP. Wait for sign-off.
````

---

## Acceptance

1. `applyRowGrouping` removes any pre-existing groups before applying `shiftRowGroupDepth(+1)` — runs idempotently
2. `resortByEmail` calls `resetAllRowGroups_` before the rebuild loop
3. `replayAllSubmissions` calls `resetAllRowGroups_` before the re-processing loop
4. Visual: exactly one `+`/`-` control per customer in the gutter, no stacking, after any combination of resort + replay
5. `runFullQA()` still passes
