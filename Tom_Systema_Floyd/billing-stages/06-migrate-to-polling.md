# Stage 6 — Migrate from webhook to polling (with Logs sheet)

> Replace the webhook-driven ingestion with a 5-minute polling job against GHL's `/forms/submissions` API. All forms are in the Florida subaccount; we poll only Florida. Submission IDs are stored as cell Notes on each tx row's Item cell (no extra columns). Adds a visible Logs sheet for every submission processed (success, duplicate, error). The old Web App deployment is archived so the URL goes inert.

**Prerequisite:** [Stage 5](05-deployment.md) acceptance confirmed and the Web App is deployed
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## Why this migration

Webhook payloads from GHL include the contact's full custom field state, not just the fields submitted in the current form. Polling `/forms/submissions` gives us per-submission data with a unique `submission_id` — bulletproof dedupe, no state pollution, no per-form workflow setup needed.

**All billable forms are in the Florida subaccount.** We only poll Florida. The Georgia and Virginia subaccount tokens are still used for cross-subaccount contact lookups (when Waiver Origin routes a customer to GA/VA for charging), unchanged from Stage 4.

---

## The prompt

Copy this entire block into the Claude Chrome extension:

```
STAGE 6 — Migrate from webhook to polling. Replaces the webhook
ingestion path entirely with a polling job against GHL's
/forms/submissions endpoint. Adds a visible Logs sheet. The old
doPost(e) function is removed and the Web App deployment is archived.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE
═══════════════════════════════════════════════════════════════════════

  1. Add a "Logs" sheet that records every submission processed,
     skipped, or failed. Erin can filter by status to see what's working.
  2. Store each transaction's submission_id as a cell Note on the
     Item cell (col B) of that tx row. Hovering over the Item shows
     "Submission ID: abc123". Dedupe reads these notes.
  3. Add a Polling.gs file that polls Florida's /forms/submissions
     endpoint every 5 minutes via a time-driven trigger.
  4. Delete the doPost(e) function entirely.
  5. Archive the existing Web App deployment so the old URL goes inert.
  6. Update the Maintenance menu: replace "Show debug log" with
     "Show poll status" + add "Refresh now" (manual poll trigger).

═══════════════════════════════════════════════════════════════════════
1. ADD THE LOGS SHEET
═══════════════════════════════════════════════════════════════════════

Create a new tab "Logs" in the spreadsheet (alongside the existing
"Dashboard" tab). Layout:

  Col A: timestamp        (ISO 8601 string)
  Col B: submission_id    (e.g. "submission_abc123" or "(poll)" for
                            poll-level events)
  Col C: email
  Col D: status           (one of: processed, duplicate, lead_only,
                            failed, poll_error)
  Col E: details          (free-text summary or error message)
  Col F: raw_payload      (JSON string — submission data for debugging)

Header row formatting: bold, font size 11, dark blue-grey background
(#0F3634, white text), frozen.

Add a basic filter (Data → Create a filter) on cols A–F.

Set column widths approximately:
  A: 160px, B: 200px, C: 200px, D: 110px, E: 280px, F: 400px

Apply conditional formatting on col D (status):
  - status = "processed"   → row light green (#E0F4E5)
  - status = "duplicate"   → row light grey  (#F0F0F0)
  - status = "lead_only"   → row light blue  (#E0EEF8)
  - status = "failed"      → row light red   (#FCE4E4), col E red text
  - status = "poll_error"  → row dark red    (#F5BCB7), col E bold red text

Newest entries at the TOP — every new log entry inserts at row 2 (just
below the frozen header), pushing older rows down. This way Erin sees
the latest activity without scrolling.

═══════════════════════════════════════════════════════════════════════
2. STORE submission_id AS A CELL NOTE ON TX ROWS
═══════════════════════════════════════════════════════════════════════

DO NOT add any new columns to the Dashboard sheet. The submission_id
is stored as a cell Note on the Item cell (col B) of each tx row.

  Format of the Note: "Submission ID: <submission_id>"

Update Stage 3's appendTxRow() to accept and store submissionId via
Note:

  appendTxRow(customerRow, txData)  →  txData now includes submissionId
  After writing the tx row's values, set the Note on col B (Item):
    sheet.getRange(newRow, 2).setNote('Submission ID: ' + txData.submissionId);

Erin hovers over any Item cell on a tx row and sees the submission_id
in a tooltip. No visible column added; layout stays clean.

═══════════════════════════════════════════════════════════════════════
3. CREATE Polling.gs
═══════════════════════════════════════════════════════════════════════

New Apps Script file Polling.gs with these functions:

──────────────────── pollFloridaSubmissions() ────────────────────

The main poll function. Runs every 5 minutes via time-driven trigger.

  function pollFloridaSubmissions() {
    const props = PropertiesService.getScriptProperties();
    const lastPolledAt = props.getProperty('lastPolledAt') ||
                         (new Date(Date.now() - 24*60*60*1000)).toISOString();
                         // first run: look back 24 hours
    const startAt = lastPolledAt;
    const endAt = new Date().toISOString();

    let submissions;
    try {
      submissions = ghlListSubmissions('Florida', startAt, endAt);
    } catch (err) {
      logEvent({
        timestamp: new Date().toISOString(),
        submissionId: '(poll)',
        email: '',
        status: 'poll_error',
        details: 'API call failed: ' + err.message,
        rawPayload: JSON.stringify({startAt, endAt})
      });
      return;
    }

    let processedCount = 0, dupCount = 0, leadCount = 0, failCount = 0;
    for (const sub of submissions) {
      const result = processSubmission(sub);
      if (result === 'processed') processedCount++;
      else if (result === 'duplicate') dupCount++;
      else if (result === 'lead_only') leadCount++;
      else if (result === 'failed') failCount++;
    }

    // Update last poll timestamp ONLY if no errors at the top-level
    props.setProperty('lastPolledAt', endAt);
    props.setProperty('lastPollSummary',
      `${new Date().toISOString()}: ${submissions.length} submissions ` +
      `(${processedCount} processed, ${dupCount} dup, ${leadCount} lead, ` +
      `${failCount} failed)`);
  }

──────────────────── ghlListSubmissions(subaccount, startAt, endAt) ────────────────────

Calls GHL's GET /forms/submissions endpoint with the date range.

  function ghlListSubmissions(subaccountName, startAt, endAt) {
    const meta = SUBACCOUNTS[subaccountName];
    const token = getTokenFor(subaccountName);
    const url = GHL_API_BASE +
      '/forms/submissions' +
      '?locationId=' + encodeURIComponent(meta.locationId) +
      '&startAt='    + encodeURIComponent(startAt) +
      '&endAt='      + encodeURIComponent(endAt) +
      '&limit=100';
    const resp = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Version': GHL_API_VERSION,
        'Accept': 'application/json',
      },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error('HTTP ' + resp.getResponseCode() + ': ' +
                      resp.getContentText().substring(0, 300));
    }
    const data = JSON.parse(resp.getContentText());
    return data.submissions || [];
  }

NOTE: GHL's actual /forms/submissions response shape may vary. Handle
defensively — if data.submissions doesn't exist, try data.results,
data.data, or treat the top-level array as the result. Log the actual
shape received in the first poll's poll_error entry so we can adjust.

──────────────────── seenSubmissionIds() — for dedupe ────────────────────

Returns a Set of all submission_ids currently stored as Notes on the
Dashboard's Item column (col B) of tx rows.

  function seenSubmissionIds() {
    const sheet = getDashboardSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return new Set();
    // getNotes() on a range returns a 2D array of strings — fast batch read
    const notes = sheet.getRange(2, 2, lastRow - 1, 1).getNotes();
    const seen = new Set();
    for (const [note] of notes) {
      if (!note) continue;
      const match = note.match(/Submission ID:\s*(\S+)/);
      if (match) seen.add(match[1]);
    }
    return seen;
  }

──────────────────── processSubmission(submission) ────────────────────

  function processSubmission(submission) {
    const submissionId = submission.id || submission._id || submission.submissionId;
    if (!submissionId) {
      logEvent({...status: 'failed', details: 'Submission missing id'});
      return 'failed';
    }

    // 1. DEDUPE — check if this submission_id already exists in any
    //    tx row's Item cell Note
    const seen = seenSubmissionIds();
    if (seen.has(submissionId)) {
      logEvent({
        timestamp: new Date().toISOString(),
        submissionId,
        email: submission.contact?.email || '',
        status: 'duplicate',
        details: 'Already processed',
        rawPayload: JSON.stringify(submission).substring(0, 4000)
      });
      return 'duplicate';
    }

    try {
      // 2. Get the FL contact for Waiver Origin (since the submission
      //    payload may not include all custom fields).
      const flContactId = submission.contactId || submission.contact?.id;
      const flContact = ghlGetContact('Florida', flContactId);
      const waiverOrigin = readCustomField(flContact, 'Waiver Origin');
      const targetSubaccount = resolveSubaccount(waiverOrigin);

      // 3. Build profile URL routed to target subaccount
      const email = (flContact.email || submission.contact?.email || '').toLowerCase().trim();
      const name  = flContact.firstName + ' ' + flContact.lastName;
      const phone = flContact.phone || '';

      let targetContactId;
      if (targetSubaccount === 'Florida') {
        targetContactId = flContactId;
      } else {
        targetContactId = ghlSearchContactByEmail(targetSubaccount, email);
      }
      const profileUrl = targetContactId
        ? buildProfileUrl(SUBACCOUNTS[targetSubaccount].locationId, targetContactId)
        : null;

      // 4. Extract the per-submission billable items
      const submissionFields = submission.formData ||
                                submission.submitted_form_data ||
                                submission.submission ||
                                [];

      // 5. Compute multipliers
      const allValues = submissionFields
        .map(f => f.value)
        .flatMap(v => parseMultiSelectValue(v))
        .map(v => String(v));
      const durationDays = parseDurationDays(allValues);

      // num_weeks: count items in the Camp Dates field
      const campDatesField = submissionFields.find(f =>
        (f.name || '').toLowerCase().includes('camp dates') ||
        (f.label || '').toLowerCase().includes('camp dates'));
      const numWeeks = campDatesField
        ? Math.max(1, parseMultiSelectValue(campDatesField.value).length)
        : 1;

      // 6. Walk fields, write tx rows for each $N match
      let txRowsWritten = 0;
      const customerRow = upsertCustomerRow({
        email, name, phone,
        waiverOrigin: waiverOrigin || '',
        profileUrl,
        contactId: targetContactId,
        subaccount: targetSubaccount
      });

      for (const field of submissionFields) {
        const items = parseMultiSelectValue(field.value);
        for (const item of items) {
          const itemStr = String(item);
          if (!PRICE_REGEX.test(itemStr)) continue;
          const price = parsePrice(itemStr);
          const multiplier = extractMultiplier(itemStr);
          const pricing = applyPricingRule(price, multiplier, durationDays, numWeeks);
          appendTxRow(customerRow, {
            date: new Date(submission.createdAt || Date.now()),
            item: stripPriceFromLabel(itemStr),
            unitPriceDisplay: '$' + price + (multiplier || ''),
            days: multiplier === '/day' ? durationDays : '',
            weeks: (multiplier === '/day' || multiplier === '/week') ? numWeeks : '',
            totalFormula: pricing.formula,
            status: 'owed',
            submissionId  // ← stored as a Note on the Item cell
          });
          txRowsWritten++;
        }
      }

      updateBalanceFormula(customerRow, profileUrl, targetSubaccount);

      const status = txRowsWritten > 0 ? 'processed' : 'lead_only';
      logEvent({
        timestamp: new Date().toISOString(),
        submissionId,
        email,
        status,
        details: txRowsWritten > 0
          ? `${txRowsWritten} rows written, customer row ${customerRow}`
          : 'No $N items in submission',
        rawPayload: JSON.stringify(submission).substring(0, 4000)
      });
      return status;

    } catch (err) {
      logEvent({
        timestamp: new Date().toISOString(),
        submissionId,
        email: submission.contact?.email || '',
        status: 'failed',
        details: err.message + '\n' + (err.stack || '').substring(0, 800),
        rawPayload: JSON.stringify(submission).substring(0, 4000)
      });
      return 'failed';
    }
  }

──────────────────── ghlGetContact(subaccount, contactId) ────────────────────

  function ghlGetContact(subaccountName, contactId) {
    const token = getTokenFor(subaccountName);
    const resp = UrlFetchApp.fetch(GHL_API_BASE + '/contacts/' + contactId, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Version': GHL_API_VERSION,
        'Accept': 'application/json',
      },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error('GET /contacts/' + contactId + ' returned ' +
                      resp.getResponseCode());
    }
    return JSON.parse(resp.getContentText()).contact || {};
  }

──────────────────── readCustomField(contact, fieldName) ────────────────────

Searches contact.customFields for a field by NAME (case-insensitive).
Returns the value or empty string.

═══════════════════════════════════════════════════════════════════════
4. ADD logEvent() HELPER (in Polling.gs or a new Logging.gs)
═══════════════════════════════════════════════════════════════════════

Inserts a row at row 2 of the Logs sheet (newest at top):

  function logEvent(entry) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
    if (!sheet) return;
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, 6).setValues([[
      entry.timestamp,
      entry.submissionId || '(poll)',
      entry.email || '',
      entry.status,
      entry.details || '',
      entry.rawPayload || ''
    ]]);
  }

═══════════════════════════════════════════════════════════════════════
5. DELETE doPost(e) AND ARCHIVE THE WEB APP DEPLOYMENT
═══════════════════════════════════════════════════════════════════════

  1. Find the doPost(e) function in the Apps Script project (it lives
     in Webhook.gs from Stage 4). DELETE the function entirely.
  2. Optionally delete the entire Webhook.gs file if doPost was its
     only export. Keep `runFakeWebhook` if it still exists — it's no
     longer reachable but useful for offline testing of the parsing
     logic.
  3. Open Apps Script editor → Deploy → Manage deployments.
  4. Find the existing Web App deployment ("Systema Floyd Billing v1").
  5. Click the menu (three dots) → Archive.
  6. Confirm — the URL stops responding to incoming POSTs.

After this step, the Web App URL is INERT. If anything is still trying
to POST to it (an old GHL workflow that wasn't disabled), the request
will fail. That's fine — it's a clearer signal than a passive logger.

═══════════════════════════════════════════════════════════════════════
6. UPDATE Maintenance MENU
═══════════════════════════════════════════════════════════════════════

Replace the existing onOpen() menu definition:

  function onOpen() {
    SpreadsheetApp.getUi().createMenu('Maintenance')
      .addItem('Refresh now',         'maintenanceRefreshNow')
      .addItem('Show poll status',    'maintenanceShowPollStatus')
      .addItem('Re-sort by email',    'resortByEmail')
      .addToUi();
  }

  function maintenanceRefreshNow() {
    pollFloridaSubmissions();
    SpreadsheetApp.getUi().alert(
      PropertiesService.getScriptProperties().getProperty('lastPollSummary')
      || 'No poll summary available'
    );
  }

  function maintenanceShowPollStatus() {
    const props = PropertiesService.getScriptProperties();
    const html = HtmlService.createHtmlOutput(`
      <pre style="font-family:monospace;font-size:12px;line-height:1.6;">
Last polled at:  ${props.getProperty('lastPolledAt') || '(never)'}
Last summary:    ${props.getProperty('lastPollSummary') || '(none)'}
      </pre>
      <p>For per-submission detail, see the <b>Logs</b> sheet.</p>
    `).setWidth(600).setHeight(220);
    SpreadsheetApp.getUi().showModalDialog(html, 'Poll Status');
  }

Drop the old "Show debug log" item.

═══════════════════════════════════════════════════════════════════════
7. INSTALL THE 5-MINUTE TRIGGER
═══════════════════════════════════════════════════════════════════════

Create a programmatic helper to install the trigger:

  function installPollingTrigger() {
    // Remove any existing pollFloridaSubmissions triggers first
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getHandlerFunction() === 'pollFloridaSubmissions') {
        ScriptApp.deleteTrigger(t);
      }
    });
    // Install a fresh 5-minute trigger
    ScriptApp.newTrigger('pollFloridaSubmissions')
      .timeBased()
      .everyMinutes(5)
      .create();
  }

Run installPollingTrigger() once from the Apps Script editor. Verify
under Triggers panel that pollFloridaSubmissions is registered to run
every 5 minutes.

Also: REMOVE any existing time-driven triggers from older stages that
no longer apply.

═══════════════════════════════════════════════════════════════════════
8. END-TO-END VERIFICATION
═══════════════════════════════════════════════════════════════════════

Run runMigrationTest() that exercises:

  1. Initial state: Logs sheet exists with header row only. Dashboard
     has NO new columns (col H is unchanged from Stage 5).
  2. Manually call pollFloridaSubmissions(). Verify:
     - Either it processes real submissions from the last 24h, OR
     - logs a "poll_error" entry if the API path is wrong, OR
     - logs nothing if there are no submissions in the window
  3. Check the Logs sheet — at least one row should appear (poll
     summary or error).
  4. If at least one submission was processed, verify on the Dashboard:
     - The tx rows have a Note on their Item cell (col B). Hover the
       cell to reveal "Submission ID: <id>".
     - The Item cell value itself is unchanged (just the text label).
  5. Run pollFloridaSubmissions() AGAIN immediately. Any submissions
     processed in step 2 should now log as "duplicate" (the Note-based
     dedupe found their submission_id).
  6. Check that lastPolledAt and lastPollSummary properties are set.
  7. Open Maintenance menu — verify "Refresh now" and "Show poll
     status" both work.
  8. Verify the time-driven trigger is installed (Triggers panel) and
     that the old Web App deployment is archived (Manage deployments
     panel).

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 6
═══════════════════════════════════════════════════════════════════════

  1. Logs sheet exists with the 6-column structure and conditional
     formatting.
  2. NO new columns added to Dashboard. submission_id is stored only
     as a Note on the Item cell (col B) of tx rows.
  3. Polling.gs file exists with all listed functions.
  4. doPost(e) is DELETED. Webhook.gs may still exist but doPost is gone.
  5. Web App deployment is ARCHIVED — the URL no longer responds.
  6. Maintenance menu has "Refresh now", "Show poll status", "Re-sort
     by email" items.
  7. The 5-minute time-driven trigger for pollFloridaSubmissions is
     registered and visible in the Triggers panel.
  8. runMigrationTest() runs without throwing. The Logs sheet receives
     at least one entry from the test.
  9. Re-running pollFloridaSubmissions() correctly produces "duplicate"
     status for already-processed submissions (Note-based dedupe works).

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. The actual JSON shape of the GHL /forms/submissions response —
     paste a redacted sample so we can confirm the parser handles it.
     Specifically: top-level key (submissions / results / data?), the
     submission object's id field (id / _id / submissionId?), the
     formData/customField shape inside each submission.
  3. The contents of the Logs sheet after the test (paste the rows).
  4. Confirmation that hovering an Item cell on a tx row reveals the
     Submission ID note (paste a screenshot or describe what you see).
  5. Confirmation that the old Web App deployment is archived (the URL
     should now return an error if hit).
  6. Whether the time-driven trigger is firing successfully — wait
     5-10 minutes after install and check Triggers panel for the next
     run timestamp.
  7. Any unresolved issues, ambiguities, or assumptions.
  8. THE MIGRATION IS COMPLETE. Polling is the only ingestion path.

═══════════════════════════════════════════════════════════════════════
POST-MIGRATION CLEANUP (for me, not the extension)
═══════════════════════════════════════════════════════════════════════

After Stage 6 reports success:
  1. In each GHL subaccount (FL, GA, VA): disable or delete the
     "Form Submitted → Webhook" workflow that pointed at the (now
     archived) Web App URL. The workflow won't do anything anymore
     but it's cleaner to disable it.
  2. Verify by submitting one real form — within 5 minutes, a row
     should appear in the Dashboard (from polling) and a "processed"
     entry in Logs. Hover the Item cell to see the submission_id note.
  3. If after 5 minutes nothing appears, check Logs for "poll_error"
     entries with details on what went wrong.
```

---

## Acceptance criteria

1. Logs sheet exists with 6-column structure and conditional formatting
2. **No new columns** added to Dashboard — submission_id is stored only as a Note on the Item cell of tx rows
3. `Polling.gs` exists with all listed functions
4. `doPost(e)` is **deleted**
5. Web App deployment is **archived** — URL no longer responds
6. Maintenance menu has "Refresh now", "Show poll status", "Re-sort by email"
7. 5-minute time-driven trigger for `pollFloridaSubmissions` is registered
8. `runMigrationTest()` runs without throwing
9. Note-based dedupe correctly produces "duplicate" status on second run

## What to report back

1. Confirmation each acceptance item passes
2. **Actual JSON shape** of GHL's `/forms/submissions` response (redacted sample)
3. Contents of the Logs sheet after the test
4. Confirmation that hovering an Item cell reveals the Submission ID note
5. Confirmation that the old Web App deployment is archived
6. Whether the time-driven trigger is firing successfully (check Triggers panel after 5-10 minutes)
7. Any unresolved issues, ambiguities, or assumptions

## Post-migration cleanup (you do this, not the extension)

1. In each GHL subaccount (FL, GA, VA), disable or delete the "Form Submitted → Webhook" workflow (the URL it points to is now archived)
2. Submit one real test form — within 5 minutes, a row should appear in the Dashboard
3. Hover the Item cell — confirm the submission_id note is visible
4. If nothing appears, check the Logs sheet for `poll_error` entries

## Done

This is the last stage. After this, the system polls every 5 minutes, dedupes by submission_id stored as cell Notes, logs every event to a visible sheet, and the original webhook endpoint is gone.
