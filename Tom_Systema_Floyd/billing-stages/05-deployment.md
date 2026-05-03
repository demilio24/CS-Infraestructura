# Stage 5 — onEdit trigger, Maintenance menu, deployment

> Final stage. Add the `onEdit` trigger so Erin's status flips and manual row adds auto-update balance. Add the Maintenance menu (Re-sort by email + Show debug log). Deploy as Web App. Verify everything end-to-end.

**Prerequisite:** [Stage 4](04-webhook.md) acceptance confirmed
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## The prompt

Copy this entire block into the Claude Chrome extension:

```
STAGE 5 of 5 — Final stage. Add the onEdit trigger so Erin's status
flips and manual row adds auto-update balance. Add the Maintenance
menu. Deploy as Web App. Verify everything end-to-end.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE ONLY
═══════════════════════════════════════════════════════════════════════

Add new file Triggers.gs with:
  - onEdit(e)               — recompute customer balance on status flip
                              or when a manual tx row is added inside an
                              existing group
  - findOwningCustomerRow(rowNumber) → customer row that owns this row
                                        (walks up until it hits a
                                         customer header)

Add new file Menu.gs with:
  - onOpen()                — adds the "Maintenance" menu
  - resortByEmail()         — alphabetizes customers, rebuilds groupings
                              and balance formulas
  - showDebugLog()          — modal dialog showing the last 50 webhook
                              events from Script Properties

Then deploy as a Web App.

═══════════════════════════════════════════════════════════════════════
onEdit(e) LOGIC
═══════════════════════════════════════════════════════════════════════

Triggered on every cell edit. Filter to only relevant edits:

  1. Only act if the edit is on the Dashboard sheet.
  2. If the edit is on col G (status) AND the row is a tx row
     (i.e., col A of that row is a date, not a name or "Date" literal):
       - Find the owning customer row (walk up).
       - Read the customer's profileUrl from existing E cell formula
         (parse the HYPERLINK URL out of it; if plain text, use null).
       - Call updateBalanceFormula(customerRow, profileUrl).
       - Call setGroupExpansion based on new balance.
  3. If the edit creates a new row inside an existing customer's group
     (detect by: edited row is not a customer or sub-header, AND the
     row above is part of an existing group):
       - Same as #2 — find owner, recompute balance, ensure status
         dropdown validation is on the new row's col G (set default
         "owed" if blank).

KEEP onEdit fast. No network calls. No GHL API. Just sheet operations.

═══════════════════════════════════════════════════════════════════════
findOwningCustomerRow(rowNumber)
═══════════════════════════════════════════════════════════════════════

Walks UP from rowNumber until it hits a row where col B contains an "@"
(customer rows have email in col B). Returns that row number.

If no customer found above (shouldn't happen but guard for it), return
null and log a warning.

═══════════════════════════════════════════════════════════════════════
MAINTENANCE MENU
═══════════════════════════════════════════════════════════════════════

  function onOpen() {
    SpreadsheetApp.getUi().createMenu('Maintenance')
      .addItem('Re-sort by email', 'resortByEmail')
      .addItem('Show debug log',   'showDebugLog')
      .addToUi();
  }

  function resortByEmail() {
    // 1. Read all customer rows + their groups into a JS object
    //    keyed by email.
    // 2. Clear the data area (rows 2 onward).
    // 3. Re-write customers in alphabetical email order, each
    //    followed by their sub-header + tx rows.
    // 4. Re-apply row grouping per customer.
    // 5. Re-apply balance formulas (with corrected ranges) and
    //    background colors.
    // 6. Set group expansion per customer based on balance.
  }

  function showDebugLog() {
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys()
      .filter(k => k.startsWith('webhook-log-'))
      .sort()
      .reverse()
      .slice(0, 50);
    const events = keys.map(k => props.getProperty(k));
    const html = HtmlService.createHtmlOutput(
      `<pre>${events.join('\n\n---\n\n')}</pre>`)
      .setWidth(800).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, 'Webhook Debug Log');
  }

═══════════════════════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════════════════════

  1. Save all Apps Script files.
  2. Deploy → New Deployment → Web App
       Description: "Systema Floyd Billing v1"
       Execute as: Me
       Who has access: Anyone
  3. Authorize when prompted.
  4. Copy the Web App URL.
  5. Verify onOpen has registered the Maintenance menu (close + reopen
     the Sheet tab to trigger it).

═══════════════════════════════════════════════════════════════════════
END-TO-END VERIFICATION
═══════════════════════════════════════════════════════════════════════

Run this sequence:

  1. Run runFakeWebhook() — verify customer + 3 tx rows appear.
  2. Click status pill on Pizza row, change "owed" → "paid" via the
     dropdown. Verify:
       - Pizza row turns light green.
       - Customer's balance auto-recomputes to $855.00 (red bg).
       - Group stays expanded (balance still > 0).
  3. Flip the other two tx rows to "paid". Verify:
       - Customer's balance is now $0.00 with white background.
       - Group state — note that auto-collapse on $0 may require an
         explicit Apps Script call from onEdit (the bg color updates
         immediately; group expansion may need an extra step).
  4. Manually type a new tx row directly under the test customer's tx
     rows: A=current date, B="Manual cash payment", F=`=50`, G=paid.
     Verify:
       - Row turns light green.
       - Balance recomputes (still $0).
       - Status dropdown applied to the new G cell automatically by
         onEdit.
  5. Maintenance → Re-sort by email. Verify:
       - The sheet rebuilds cleanly.
       - Groupings intact.
       - Balance formulas reference correct ranges.
  6. Maintenance → Show debug log. Verify:
       - Dialog opens showing the last few webhook events from
         runFakeWebhook().
  7. Cleanup: delete the test customer's rows.

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 5
═══════════════════════════════════════════════════════════════════════

  1. Triggers.gs and Menu.gs exist.
  2. onEdit fires on status flips and updates balance.
  3. Maintenance menu appears in the Sheet UI.
  4. Web App is deployed with "Anyone" access; URL is reported back.
  5. End-to-end verification (steps 1–7) all pass.
  6. The sheet is left empty (just header row 1) after cleanup.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. The Apps Script Web App URL.
  3. Result of each end-to-end verification step (1–7).
  4. Whether group auto-collapse on $0 balance is working from onEdit,
     or if it requires an explicit refresh / Maintenance run.
  5. Any unresolved issues, ambiguities, or assumptions.
  6. THE BUILD IS COMPLETE. Report the Web App URL so I can paste it
     into the GHL workflow webhook actions in all three subaccounts.
```

---

## Acceptance criteria

1. `Triggers.gs` and `Menu.gs` exist
2. `onEdit` fires on status flips and updates balance
3. Maintenance menu appears in the Sheet UI
4. Web App is deployed with "Anyone" access; URL is reported back
5. End-to-end verification (steps 1–7) all pass
6. The sheet is left empty (just header row 1) after cleanup

## What to report back

1. Confirmation each acceptance item passes
2. The Apps Script Web App URL
3. Result of each end-to-end verification step (1–7)
4. Whether group auto-collapse on $0 balance works from `onEdit`, or requires an explicit refresh / Maintenance run
5. Any unresolved issues, ambiguities, or assumptions

## After the build is complete

The Web App URL is the deliverable. Once it lands:

1. Open each GHL subaccount (FL, GA, VA) → Settings → Workflows
2. Create the "Form/Survey Submitted → Webhook" workflow if it doesn't exist
3. Paste the Web App URL into the Webhook action's destination
4. Save and activate
5. Submit one real test form per subaccount → confirm a row appears in the Dashboard

That's the full build. Five stages, five reports, one production system.
