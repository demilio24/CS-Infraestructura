/** ─── Menu.gs ─────────────────────────────────────────────────────
 *  onOpen trigger: creates the Maintenance menu in the spreadsheet UI.
 *  Maintenance functions: Re-sort by email, Show debug log.
 *  Depends on: Configuration.gs, Helpers.gs, SheetWrites.gs
 */

// ─── onOpen ──────────────────────────────────────────────────────────
/**
 * Simple trigger — fires when the spreadsheet is opened.
 * Adds the Maintenance menu and a Bulk status menu.
 */
function onOpen() {
  // No custom menus.
  // - Bulk status changes: sub-header STATUS dropdown (per customer) or
  //   select cells in col G + type + Ctrl+Enter (multi-cell).
  // - Transactions sheet: auto-refreshes on every poll (5 min) via the
  //   pollFloridaSubmissions tail. Filters live in row 1 cols H, I, J
  //   on the Transactions tab itself.
}

// ─── maintenanceRefreshNow ───────────────────────────────────────────────────────────────────
function maintenanceRefreshNow() {
  pollFloridaSubmissions();
  const summary = PropertiesService.getScriptProperties().getProperty('lastPollSummary');
  SpreadsheetApp.getUi().alert(summary || 'No poll summary available yet.');
}

// ─── maintenanceShowPollStatus ─────────────────────────────────────────────────────────
function maintenanceShowPollStatus() {
  const props = PropertiesService.getScriptProperties();
  const lastPolledAt    = props.getProperty('lastPolledAt')    || '(never)';
  const lastPollSummary = props.getProperty('lastPollSummary') || '(none)';
  const html = HtmlService.createHtmlOutput(
    '<pre style="font-family:monospace;font-size:12px;line-height:1.6;">' +
    'Last polled at:  ' + lastPolledAt    + '\n' +
    'Last summary:    ' + lastPollSummary + '\n' +
    '</pre>' +
    '<p>For per-submission detail, see the <b>Logs</b> sheet.</p>'
  ).setWidth(620).setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(html, 'Poll Status');
}

// ─── resortByEmail ────────────────────────────────────────────────────────────
/**
 * Reads all customer groups, sorts alphabetically by email, re-writes
 * the Dashboard in sorted order, and re-applies groupings + balance formulas.
 */
function resortByEmail() {
  const sh = getDashboardSheet();
  const lastRow = sh.getLastRow();

  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('Nothing to sort — sheet is empty.');
    return;
  }

  // ── 1. Read all customer groups into an array ──────────────────────────────
  const groups = [];
  let i = 2;
  while (i <= lastRow) {
    const colB = String(sh.getRange(i, COL.EMAIL_OR_ITEM).getValue() || '').trim();
    // Customer row: col B contains "@"
    if (!colB.includes('@')) { i++; continue; }

    const custData   = sh.getRange(i, 1, 1, 7).getValues()[0];
    const custFormulas = sh.getRange(i, 1, 1, 7).getFormulas()[0];
    const custBg     = sh.getRange(i, 1, 1, 7).getBackgrounds()[0];
    const custFonts  = sh.getRange(i, 1, 1, 7).getFontWeights()[0];

    // Sub-header row (always customerRow + 1)
    let subHeaderData     = sh.getRange(i + 1, 1, 1, 7).getValues()[0];
    let subHeaderFormulas = sh.getRange(i + 1, 1, 1, 7).getFormulas()[0];
    let subHeaderBg       = sh.getRange(i + 1, 1, 1, 7).getBackgrounds()[0];
    // If no real sub-header exists (flat customer), supply canonical values
    if ((subHeaderData[0] !== 'Date' && subHeaderData[0] !== 'DATE')) {
      subHeaderData     = ['DATE', 'ITEM', 'UNIT PRICE', 'DAYS', 'WEEKS', 'TOTAL', 'STATUS'];
      subHeaderFormulas = ['', '', '', '', '', '', ''];
      subHeaderBg       = ['#EFEFEF', '#EFEFEF', '#EFEFEF', '#EFEFEF', '#EFEFEF', '#EFEFEF', '#EFEFEF'];
    }

    // Tx rows
    const { firstTx, lastTx } = findCustomerTxRange(i);
    const txRows = [];
    for (let r = firstTx; r <= lastTx; r++) {
      txRows.push({
        values:   sh.getRange(r, 1, 1, 7).getValues()[0],
        formulas: sh.getRange(r, 1, 1, 7).getFormulas()[0],
        bgs:      sh.getRange(r, 1, 1, 7).getBackgrounds()[0]
      });
    }

    // Extract profileUrl from E cell formula
    const profileUrl = extractProfileUrlFromCell(i);

    groups.push({
      email:        colB.toLowerCase(),
      custData, custFormulas, custBg, custFonts,
      subHeaderData, subHeaderFormulas, subHeaderBg,
      txRows,
      profileUrl,
      totalRows: (lastTx >= firstTx) ? (lastTx - i + 1) : 2
    });

    i = Math.max(lastTx + 1, i + 2); // advance past this group
  }

  if (groups.length === 0) {
    SpreadsheetApp.getUi().alert('No customer rows found.');
    return;
  }

  // ── 2. Sort alphabetically by email ───────────────────────────────────────
  groups.sort(function(a, b) { return a.email < b.email ? -1 : a.email > b.email ? 1 : 0; });

  // ── 3. Clear data area ────────────────────────────────────────────────────
  // === Clean-slate row group reset over the data area ===
  resetAllRowGroups_(sh);
  sh.deleteRows(2, lastRow - 1);

  // — 4. Re-write groups ————————————————————————————————
  let writeRow = 2;
  groups.forEach(function(g) {
    // Write customer row data (preserves saved values incl. student names)
    sh.getRange(writeRow, 1, 1, 7).setValues([g.custData]);
    // Brand styling: dark blue bg, white text, bold, size 12
    const custRange = sh.getRange(writeRow, 1, 1, 7);
    custRange.setBackground('#143980');
    custRange.setFontColor('#FFFFFF');
    custRange.setFontWeight('bold');
    custRange.setFontSize(12);
    custRange.setHorizontalAlignment('left');
    // Col F: underline for profile link
    sh.getRange(writeRow, COL.CONTACT_OR_TOTAL).setFontLine('underline');
    const custRow = writeRow;

    // Write sub-header row
    sh.getRange(custRow + 1, 1, 1, 7).setValues([g.subHeaderData]);
    // Brand styling: mid-blue bg, white text, bold, size 10
    const subHRange = sh.getRange(custRow + 1, 1, 1, 7);
    subHRange.setBackground('#4a6493');
    subHRange.setFontColor('#FFFFFF');
    subHRange.setFontWeight('bold');
    subHRange.setFontSize(10);
    subHRange.setHorizontalAlignment('left');

    // Write tx rows
    let txRow = custRow + 2;
    g.txRows.forEach(function(tx) {
      sh.getRange(txRow, 1, 1, 7).setValues([tx.values]);
      sh.getRange(txRow, 1, 1, 7).setBackgrounds([tx.bgs]);
      // Re-apply formula if present (col F = totalFormula)
      if (tx.formulas[5]) sh.getRange(txRow, 6).setFormula(tx.formulas[5]);
      applyStatusDropdown(txRow);
      // Alignment for tx rows
      sh.getRange(txRow, 1, 1, 7).setFontSize(11).setFontColor(null);
      sh.getRange(txRow, COL.CONTACT_OR_TOTAL).setHorizontalAlignment('right');  // Total
      sh.getRange(txRow, COL.BALANCE_OR_STATUS).setHorizontalAlignment('left');  // Status
      txRow++;
    });

    const lastTxRow = txRow - 1;

    // — 5. Re-apply balance formula with corrected ranges ————————————
    updateBalanceFormula(custRow, g.profileUrl);

    // — 6. Re-apply row grouping ————————————————————————————————
    if (lastTxRow >= custRow + 2) {
      applyRowGrouping(custRow + 1, lastTxRow);
    }

    // Set group expansion based on balance
    const balanceVal = sh.getRange(custRow, COL.BALANCE_OR_STATUS).getValue();
    const numericBalance = typeof balanceVal === 'number' ? balanceVal : 0;
    if (lastTxRow >= custRow + 2) {
      setGroupExpansion(custRow + 1, numericBalance > 0);
    }

    writeRow = lastTxRow + 1;
  });

  SpreadsheetApp.getUi().alert('Re-sorted ' + groups.length + ' customer(s) by email.');
}


// ─── maintenanceForceRefreshRegistry ──────────────────────────────────────────
/**
 * Maintenance menu: Force-refreshes the field registry from GHL.
 */
function maintenanceForceRefreshRegistry() {
  refreshFieldRegistry('Florida');
  SpreadsheetApp.getUi().alert('Field registry refreshed for Florida.');
}

// ─── reprocessLeadOnlySubmissions ───────────────────────────────────────────
/**
 * Reads the Logs sheet, finds all rows where status='lead_only' with a real
 * submission_id (not '(poll)'), parses rawPayload back into a submission object,
 * and calls processSubmission() to reprocess each.
 *
 * The deduplication in processSubmission will skip ones that were previously
 * processed, but lead_only rows (no tx rows written) will get reprocessed.
 *
 * DO NOT auto-run. Exposed via Maintenance menu. Erin can run after Stage 7 ships.
 */
function reprocessLeadOnlySubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logsSheet = ss.getSheetByName('Logs');
  if (!logsSheet) {
    SpreadsheetApp.getUi().alert('Logs sheet not found.');
    return;
  }

  const data = logsSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('No log entries found.');
    return;
  }

  // Find the column-header row by looking for 'Timestamp' in col A.
  // Tolerant of the pricing-syntax banner row that now sits in row 1.
  let headerRowIdx = data.findIndex(function(r) {
    return String(r[0] || '').trim().toLowerCase() === 'timestamp';
  });
  if (headerRowIdx === -1) headerRowIdx = 0;  // legacy layout (no banner)
  const headers = data[headerRowIdx].map(function(h) { return String(h).toLowerCase().trim(); });
  const colStatus    = headers.indexOf('status');
  const colSubId     = headers.indexOf('submission_id');
  const colPayload   = headers.indexOf('raw_payload');

  if (colStatus === -1 || colSubId === -1 || colPayload === -1) {
    SpreadsheetApp.getUi().alert('Logs sheet missing expected columns (status, submission_id, raw_payload).');
    return;
  }

  let reprocessed = 0, skipped = 0, failed = 0;
  const errors = [];

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    const status  = String(row[colStatus] || '').trim().toLowerCase();
    const subId   = String(row[colSubId]  || '').trim();
    const payload = String(row[colPayload] || '').trim();

    // Only reprocess lead_only rows with a real submission ID
    if (status !== 'lead_only' || !subId || subId === '(poll)') {
      skipped++;
      continue;
    }
    if (!payload || payload === 'undefined') {
      skipped++;
      continue;
    }

    try {
      const submission = JSON.parse(payload);
      // Clear the seen-IDs cache for this submission so it gets reprocessed
      // (processSubmission dedupe uses PropertiesService — we bypass by resetting seen set)
      // Actually: since this was lead_only (no rows written), the submissionId IS in the
      // seen set. We need to temporarily remove it so it gets reprocessed.
      const props = PropertiesService.getScriptProperties();
      const seenKey = 'seenSubmissions';
      let seenRaw = props.getProperty(seenKey);
      if (seenRaw) {
        const seenArr = JSON.parse(seenRaw);
        const filtered = seenArr.filter(function(id) { return id !== subId; });
        props.setProperty(seenKey, JSON.stringify(filtered));
      }

      const result = processSubmission(submission);
      if (result === 'processed') {
        reprocessed++;
      } else if (result === 'duplicate') {
        skipped++;
      } else {
        failed++;
        errors.push(subId + ': ' + result);
      }
    } catch (e) {
      failed++;
      errors.push(subId + ': ' + e.message);
    }
  }

  const summary = 'Reprocess complete:\n' +
    '  Reprocessed: ' + reprocessed + '\n' +
    '  Skipped:     ' + skipped    + '\n' +
    '  Failed:      ' + failed;
  Logger.log('[reprocessLeadOnly] ' + summary);
  if (errors.length > 0) {
    Logger.log('[reprocessLeadOnly] Errors: ' + errors.join(', '));
  }
  SpreadsheetApp.getUi().alert(summary + (errors.length > 0 ? '\n\nErrors:\n' + errors.slice(0, 5).join('\n') : ''));
}


// ─── bulkSetStatus ──────────────────────────────────────────────
/**
 * Set all tx rows of the currently-selected customer to a given status.
 * The selected cell can be on the customer row, sub-header, or any tx row.
 * @param {string} newStatus  'paid' | 'owed' | 'canceled' | 'refunded'
 */
function bulkSetStatus(newStatus) {
  const dashSheet = getDashboardSheet();
  const activeRow = dashSheet.getActiveRange().getRow();

  // Walk up to find the owning customer row
  const customerRow = findOwningCustomerRow(activeRow);
  if (!customerRow) {
    SpreadsheetApp.getUi().alert(
      'Click any cell inside a customer group (customer row, sub-header, or ' +
      'a tx row) before choosing this menu item.');
    return;
  }

  const range = findCustomerTxRange(customerRow);
  if (!range || range.lastTx < range.firstTx) {
    SpreadsheetApp.getUi().alert('This customer has no transaction rows yet.');
    return;
  }

  // Set col G (COL.BALANCE_OR_STATUS = STATUS) for every tx row
  const numRows = range.lastTx - range.firstTx + 1;
  const statusRange = dashSheet.getRange(range.firstTx, COL.BALANCE_OR_STATUS, numRows, 1);
  const values = Array.from({length: numRows}, function() { return [newStatus]; });
  statusRange.setValues(values);

  // Recompute balance — don't touch expand state; keep user's current view.
  updateBalanceFormula(customerRow, null);
  try { refreshBalanceNoteForCustomer(customerRow); } catch (e) {}

  SpreadsheetApp.getUi().alert('Set ' + numRows + ' tx row(s) to "' + newStatus + '" for this customer.');
}

function bulkSetPaid()     { bulkSetStatus('paid');     }
function bulkSetOwed()     { bulkSetStatus('owed');     }
function bulkSetCanceled() { bulkSetStatus('canceled'); }
function bulkSetRefunded() { bulkSetStatus('refunded'); }

// ─── bulkSetSelectedStatus ──────────────────────────────────────
/**
 * Nice-to-have #6: set status on every selected cell in col G that
 * belongs to a tx row. Supports multi-cell + multi-range selections
 * across multiple customers.
 * @param {string} newStatus  'paid' | 'owed' | 'canceled' | 'refunded'
 */
function bulkSetSelectedStatus(newStatus) {
  const sh = getDashboardSheet();
  const ui = SpreadsheetApp.getUi();
  const ranges = sh.getActiveRangeList();
  if (!ranges) { ui.alert('Select one or more cells first.'); return; }

  const allRanges = ranges.getRanges();
  const touchedTxRows = [];
  const touchedCustomers = new Set();

  for (let r = 0; r < allRanges.length; r++) {
    const range = allRanges[r];
    const startRow = range.getRow();
    const numRows = range.getNumRows();
    for (let i = 0; i < numRows; i++) {
      const sheetRow = startRow + i;
      // Inspect what kind of row this is via col A + col B values
      const a = String(sh.getRange(sheetRow, 1).getValue() || '').trim();
      const b = String(sh.getRange(sheetRow, 2).getValue() || '').trim();
      // Skip header (row 1), customer rows (col B has @), sub-headers (col A == DATE)
      if (sheetRow === 1) continue;
      if (b.indexOf('@') !== -1) continue;
      if (a.toUpperCase() === 'DATE') continue;
      if (!a) continue; // blank
      // Looks like a tx row — set its status
      sh.getRange(sheetRow, COL.BALANCE_OR_STATUS).setValue(newStatus);
      touchedTxRows.push(sheetRow);
      const owner = findOwningCustomerRow(sheetRow);
      if (owner) touchedCustomers.add(owner);
    }
  }

  if (!touchedTxRows.length) {
    ui.alert('No tx rows in your selection. Select status cells (col G) on transaction rows.');
    return;
  }

  // Recompute balance + refresh copy-pasteable Note for every customer
  // touched. Preserve current expand/collapse state.
  touchedCustomers.forEach(function(customerRow) {
    updateBalanceFormula(customerRow, null);
    try { refreshBalanceNoteForCustomer(customerRow); } catch (e) {}
  });

  ui.alert('Set ' + touchedTxRows.length + ' tx cell(s) to "' + newStatus +
           '" across ' + touchedCustomers.size + ' customer(s).');
}

function bulkSetSelectedPaid()     { bulkSetSelectedStatus('paid');     }
function bulkSetSelectedOwed()     { bulkSetSelectedStatus('owed');     }
function bulkSetSelectedCanceled() { bulkSetSelectedStatus('canceled'); }
function bulkSetSelectedRefunded() { bulkSetSelectedStatus('refunded'); }
