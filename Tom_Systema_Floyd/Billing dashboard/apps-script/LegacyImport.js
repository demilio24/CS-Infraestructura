/** ─── LegacyImport.gs ──────────────────────────────────────────
 *  One-shot importer for legacy registration sheets that predate the
 *  GHL form pipeline. Walks every tab of a source spreadsheet (each
 *  tab = one camp week named like "6/1-6/5"), and writes corresponding
 *  customer + tx rows on the Dashboard alongside the GHL-polled data.
 *
 *  Idempotent: every imported source row is logged to a `Manual
 *  Imports` audit sheet keyed on `sheetId:tab:row`. Re-running skips
 *  already-imported rows.
 *
 *  Pricing:
 *    Camp duration:  5 days = $365/week (known)
 *                    2 days = $215/week (known)
 *                    other  = $0/day placeholder (team fills in)
 *    Lunch / breakfast / aftercare: inline price parsed from the cell
 *    text ("$X/day", "$X/week", "$X per day", "Daily ($X)", etc.)
 *    Shirt: $30 flat (matches new-form syntax)
 *
 *  Customer name: derived from email's local part since these sheets
 *  don't carry the parent name. Team can rename later.
 */

const MANUAL_IMPORTS_SHEET = 'Manual Imports';
const LEGACY_CAMP_RATES = {
  // Confirmed from existing Dashboard data
  5: { unit: 365, known: true },
  2: { unit: 215, known: true }
  // 1, 3, 4 days fall through to placeholder
};

// Apps Script gives every invocation a hard 6-min ceiling. We budget
// 3 min for row processing so even slow runs land well under the cap.
// Tails (regroup, totals, balance notes) live in finishLegacyImport
// and are run separately after all rows are in.
const IMPORT_BUDGET_MS = 3 * 60 * 1000;

// ─── importLegacyRegistrations ─────────────────────────────────────
/**
 * Resumable importer for both Lower + Upper campus sheets. Each run
 * processes rows until the time budget expires; the Manual Imports
 * audit dedupes across runs so re-invoking just resumes. Run this
 * repeatedly until both halves report registrationsImported = 0,
 * then call `finishLegacyImport` once.
 */
function importLegacyRegistrations() {
  var startedAt = Date.now();
  var lower = importRegistrationSheet(
    '18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs', 'Lower Campus', startedAt
  );

  var upper = { skipped: true, reason: 'time budget exhausted in lower' };
  if (Date.now() - startedAt < IMPORT_BUDGET_MS) {
    upper = importRegistrationSheet(
      '1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA', 'Upper Campus', startedAt
    );
  }

  return { lower: lower, upper: upper, totalElapsedMs: Date.now() - startedAt };
}

// ─── finishLegacyImport ────────────────────────────────────────────
/**
 * Run AFTER importLegacyRegistrations reports zero new rows on both
 * halves. Walks every customer that has tx rows, repairs sub-headers,
 * recomputes balances, refreshes balance notes, regroups, applies
 * chip dropdowns to all tx rows, and refreshes the grand total. Safe
 * to call multiple times — every step is idempotent.
 */
function finishLegacyImport() {
  var startedAt = Date.now();
  var report = {};
  function runStep(name, fn) {
    var t0 = Date.now();
    try { fn(); report[name] = Date.now() - t0 + ' ms'; }
    catch (e) { report[name] = 'ERR: ' + e.message; }
  }
  runStep('repairAllSubHeaders',         function() { repairAllSubHeaders(); });
  runStep('refreshAllCustomerBalances',  function() { refreshAllCustomerBalances_(); });
  runStep('refreshAllBalanceNotes',      function() { refreshAllBalanceNotes(); });
  runStep('regroupAllCustomers',         function() { regroupAllCustomers(); });
  runStep('applyChipDropdownsToAllTxRows', function() { applyChipDropdownsToAllTxRows(); });
  runStep('refreshGrandTotalHeader',     function() { refreshGrandTotalHeader(); });
  return { report: report, totalElapsedMs: Date.now() - startedAt };
}

function refreshAllCustomerBalances_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return;
  var values = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  for (var i = 0; i < values.length; i++) {
    var b = String(values[i][1] || '').trim();
    if (b.indexOf('@') === -1) continue;
    try { updateBalanceFormula(i + 2, null); } catch (e) {}
  }
}

// ─── importRegistrationSheet ───────────────────────────────────────
function importRegistrationSheet(sheetId, campusLabel, startedAt) {
  startedAt = startedAt || Date.now();
  var src;
  try { src = SpreadsheetApp.openById(sheetId); }
  catch (e) { return { error: 'open failed: ' + e.message }; }

  var imports = ensureManualImportsSheet_();
  var alreadyKeys = readManualImportKeys_(imports);

  var customersTouched = {};
  var rowsImported = 0;
  var registrationsImported = 0;
  var tabsProcessed = 0;
  var skipped = [];
  var bailedEarly = false;

  var allTabs = src.getSheets();
  for (var ti = 0; ti < allTabs.length; ti++) {
    if (Date.now() - startedAt > IMPORT_BUDGET_MS) { bailedEarly = true; break; }
    var tab = allTabs[ti];
    var tabName = tab.getName();
    if (!isCampWeekTab_(tabName)) {
      skipped.push('skip-tab "' + tabName + '" (not a week)');
      continue;
    }
    tabsProcessed++;

    var lastRow = tab.getLastRow();
    var lastCol = tab.getLastColumn();
    if (lastRow < 2) continue;

    var values = tab.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0].map(function(h) {
      return String(h || '').toLowerCase().trim();
    });
    var idx = mapHeaderColumns_(headers);
    if (idx.studentName < 0 || idx.email < 0) {
      skipped.push('tab "' + tabName + '": missing required column');
      continue;
    }

    var weekStartDate = parseTabStartDate_(tabName, 2026);
    var weekDateLabel = weekStartDate
      ? Utilities.formatDate(weekStartDate, 'America/Chicago', 'MMM d yyyy')
      : '';
    var weekRangeLabel = '(' + tabName + ')';

    for (var r = 1; r < values.length; r++) {
      if (Date.now() - startedAt > IMPORT_BUDGET_MS) { bailedEarly = true; break; }
      var row = values[r];
      var importKey = sheetId + ':' + tabName + ':' + (r + 1);
      if (alreadyKeys[importKey]) continue;

      var email = String(row[idx.email] || '').trim().toLowerCase();
      var studentName = String(row[idx.studentName] || '').trim();
      if (!email || !studentName || email.indexOf('@') === -1) {
        skipped.push(tabName + ' r' + (r + 1) + ': missing email or student');
        continue;
      }

      var notes = String(row[idx.notes] || '');
      var dayCount = computeDayCount_(row, idx, notes);

      var customerName = deriveNameFromEmail_(email);
      var customerRow = upsertCustomerRow({
        email: email,
        name: customerName,
        phone: '',
        waiverOrigin: 'Florida',
        studentNames: studentName,
        profileUrl: null,
        contactId: null
      });
      customersTouched[customerRow] = true;

      ensureSubHeaderForCustomer_(customerRow);

      // Build tx rows for this registration ──────────────────────
      var added = 0;

      // 1. Camp duration
      var camp = computeCampPrice_(dayCount);
      var campTxArgs = {
        date: weekDateLabel,
        item: 'Select Camp Duration (Summer Camp): ' +
              dayCount + ' day' + (dayCount === 1 ? '' : 's') + ' ' + weekRangeLabel,
        sourceFieldName: 'Select Camp Duration (Summer Camp)',
        unitPriceNumeric: camp.unit,
        unitMultiplier: camp.multiplier,
        pricingRule: camp.pricingRule,
        days: camp.days,
        weeks: camp.weeks,
        status: 'owed',
        submissionId: '',
        weekLabel: tabName,
        formAnswerLabel: dayCount + ' days'
      };
      appendTxRow(customerRow, campTxArgs);
      if (!camp.known) {
        // Mark placeholder rows so the team can spot them.
        var lastRowDash = getDashboardSheet().getLastRow();
        getDashboardSheet().getRange(lastRowDash, 6).setNote(
          'IMPORT PLACEHOLDER: camp price for ' + dayCount + ' days not in ' +
          'LEGACY_CAMP_RATES. Fill in the unit price (col C) and the formula ' +
          'will recompute.\n' +
          'Source: ' + campusLabel + ' / "' + tabName + '" / row ' + (r + 1)
        );
      }
      added++;

      // 2. T-shirt
      var shirtVal = String(row[idx.shirt] || '').trim();
      if (shirtVal && !isNoneish_(shirtVal)) {
        appendTxRow(customerRow, {
          date: weekDateLabel,
          item: 'Student T-Shirt (Summer Camp): ' + shirtVal + ' (+$30)',
          sourceFieldName: 'Student T-Shirt (Summer Camp)',
          unitPriceNumeric: 30,
          unitMultiplier: '',
          pricingRule: 'flat',
          days: '',
          weeks: '',
          status: 'owed',
          submissionId: '',
          formAnswerLabel: shirtVal
        });
        added++;
      }

      // 3. Breakfast
      var breakfastVal = String(row[idx.breakfast] || '').trim();
      if (breakfastVal && !isNoneish_(breakfastVal)) {
        var bf = parseInlinePrice_(breakfastVal, dayCount);
        appendTxRow(customerRow, {
          date: weekDateLabel,
          item: 'Select Breakfast Option (Summer Camp): ' + breakfastVal + ' ' + weekRangeLabel,
          sourceFieldName: 'Select Breakfast Option (Summer Camp)',
          unitPriceNumeric: bf.unit,
          unitMultiplier: bf.multiplier,
          pricingRule: bf.pricingRule,
          days: bf.days,
          weeks: bf.weeks,
          status: 'owed',
          submissionId: '',
          weekLabel: tabName,
          formAnswerLabel: breakfastVal
        });
        added++;
      }

      // 4. Lunch
      var lunchVal = String(row[idx.lunch] || '').trim();
      if (lunchVal && !isNoneish_(lunchVal)) {
        var ln = parseInlinePrice_(lunchVal, dayCount);
        appendTxRow(customerRow, {
          date: weekDateLabel,
          item: 'Select lunch option (Summer Camp): ' + lunchVal + ' ' + weekRangeLabel,
          sourceFieldName: 'Select lunch option (Summer Camp)',
          unitPriceNumeric: ln.unit,
          unitMultiplier: ln.multiplier,
          pricingRule: ln.pricingRule,
          days: ln.days,
          weeks: ln.weeks,
          status: 'owed',
          submissionId: '',
          weekLabel: tabName,
          formAnswerLabel: lunchVal
        });
        added++;
      }

      // 5. Aftercare
      var aftercareVal = String(row[idx.aftercare] || '').trim();
      if (aftercareVal && !isNoneish_(aftercareVal)) {
        var ac = parseInlinePrice_(aftercareVal, dayCount);
        appendTxRow(customerRow, {
          date: weekDateLabel,
          item: 'After care options (Summer Camp): ' + aftercareVal + ' ' + weekRangeLabel,
          sourceFieldName: 'After care options (Summer Camp)',
          unitPriceNumeric: ac.unit,
          unitMultiplier: ac.multiplier,
          pricingRule: ac.pricingRule,
          days: ac.days,
          weeks: ac.weeks,
          status: 'owed',
          submissionId: '',
          weekLabel: tabName,
          formAnswerLabel: aftercareVal
        });
        added++;
      }

      logManualImport_(imports, {
        importKey: importKey,
        sheetId: sheetId,
        sheetName: src.getName(),
        campusLabel: campusLabel,
        tabName: tabName,
        sourceRow: r + 1,
        email: email,
        customerName: customerName,
        student: studentName,
        customerRow: customerRow,
        txRowsAdded: added,
        notes: notes
      });
      alreadyKeys[importKey] = true;
      rowsImported += added;
      registrationsImported++;
    }
    if (bailedEarly) break;
  }

  // No per-customer tail here — finishLegacyImport handles all of it
  // once at the end so we don't pay it on every partial run.

  return {
    sheet: src.getName(),
    campusLabel: campusLabel,
    tabsProcessed: tabsProcessed,
    registrationsImported: registrationsImported,
    txRowsImported: rowsImported,
    customersTouched: Object.keys(customersTouched).length,
    skipped: skipped.length,
    skippedSample: skipped.slice(0, 10),
    bailedEarly: bailedEarly,
    elapsedMs: Date.now() - startedAt
  };
}

// ─── Header column mapping ─────────────────────────────────────────
function mapHeaderColumns_(headers) {
  function find(re) {
    for (var i = 0; i < headers.length; i++) {
      if (re.test(headers[i])) return i;
    }
    return -1;
  }
  return {
    paid:        find(/^paid\??$/),
    amt:         find(/^amt$/),
    studentName: find(/^student\s*name$/),
    age:         find(/^age$/),
    pottyTrained:find(/potty/),
    breakfast:   find(/^breakfast$/),
    lunch:       find(/^lunch$/),
    aftercare:   find(/before|after.*care/),
    shirt:       find(/shirt/),
    email:       find(/^email$/),
    notes:       find(/notes/),
    mon:         find(/^mon$/),
    tue:         find(/^tue$/),
    wed:         find(/^wed$/),
    thu:         find(/^thu$/),
    fri:         find(/^fri$/)
  };
}

// ─── Tab name helpers ──────────────────────────────────────────────
function isCampWeekTab_(name) {
  return /^\d{1,2}\/\d{1,2}\s*-\s*\d{1,2}\/\d{1,2}$/.test(String(name).trim());
}

function parseTabStartDate_(name, year) {
  var m = String(name).match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  var month = parseInt(m[1], 10);
  var day   = parseInt(m[2], 10);
  return new Date(year, month - 1, day);
}

// ─── Day count: count attendance marks; fall back to notes ─────────
function computeDayCount_(row, idx, notes) {
  var dayCols = [idx.mon, idx.tue, idx.wed, idx.thu, idx.fri];
  var count = 0;
  dayCols.forEach(function(i) {
    if (i < 0) return;
    if (cellMarksAttendance_(row[i])) count++;
  });
  if (count > 0) return count;

  var notesLower = String(notes || '').toLowerCase();
  if (/full\s*week/.test(notesLower)) return 5;
  var m = notesLower.match(/just\s+(\d)\s*days?/);
  if (m) return parseInt(m[1], 10);
  m = notesLower.match(/(\d)\s*days?\s*(?:only|attending)?/);
  if (m) return parseInt(m[1], 10);
  if (/monday\s*-\s*thursday/.test(notesLower)) return 4;
  if (/monday\s*through\s*thursday/.test(notesLower)) return 4;
  if (/monday\s*-\s*friday/.test(notesLower)) return 5;
  if (/tuesday\s*and\s*thursday/.test(notesLower)) return 2;

  // Default: assume full week.
  return 5;
}

function cellMarksAttendance_(value) {
  if (value == null) return false;
  if (typeof value === 'boolean') return value;
  var s = String(value).trim().toLowerCase();
  if (!s) return false;
  if (s === 'no' || s === 'n' || s === 'false' || s === 'x') return false;
  return true;  // 'yes', '✓', or any other non-empty mark
}

// ─── Inline price parsing for lunch / breakfast / aftercare ────────
function parseInlinePrice_(text, dayCount) {
  var s = String(text || '');
  // $X/day or $X per day
  var perDay = s.match(/\$(\d+(?:\.\d{1,2})?)\s*(?:\/|\s*per\s*)\s*day/i);
  if (perDay) {
    var unit = parseFloat(perDay[1]);
    return {
      unit: unit,
      multiplier: '/day',
      pricingRule: 'per_day',
      days: dayCount || 1,
      weeks: 1
    };
  }
  // $X/week or $X per week
  var perWeek = s.match(/\$(\d+(?:\.\d{1,2})?)\s*(?:\/|\s*per\s*)\s*week/i);
  if (perWeek) {
    return {
      unit: parseFloat(perWeek[1]),
      multiplier: '/week',
      pricingRule: 'per_week',
      days: '',
      weeks: 1
    };
  }
  // "Daily ($X)" pattern → /day with the given dayCount
  var daily = s.match(/daily\s*\(\$(\d+(?:\.\d{1,2})?)\)/i);
  if (daily) {
    return {
      unit: parseFloat(daily[1]),
      multiplier: '/day',
      pricingRule: 'per_day',
      days: dayCount || 1,
      weeks: 1
    };
  }
  // Generic $X (no multiplier hint) → flat
  var flat = s.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (flat) {
    return {
      unit: parseFloat(flat[1]),
      multiplier: '',
      pricingRule: 'flat',
      days: '',
      weeks: ''
    };
  }
  // No price at all — return $0 placeholder so the row appears for the
  // team to fill in.
  return {
    unit: 0,
    multiplier: '',
    pricingRule: 'flat',
    days: '',
    weeks: ''
  };
}

function isNoneish_(s) {
  var v = String(s || '').trim().toLowerCase();
  return v === 'none' || v === 'no' || v === 'n/a' || v === 'na';
}

// ─── Camp price lookup ─────────────────────────────────────────────
function computeCampPrice_(dayCount) {
  var rate = LEGACY_CAMP_RATES[dayCount];
  if (rate) {
    return {
      unit: rate.unit,
      multiplier: '/week',
      pricingRule: 'per_week',
      days: '',
      weeks: 1,
      known: true
    };
  }
  // Unknown day-count rate. Use $0/day placeholder + days=N + weeks=1
  // so team can swap in the real rate; the formula =C*D*E will recompute.
  return {
    unit: 0,
    multiplier: '/day',
    pricingRule: 'per_day',
    days: dayCount || 1,
    weeks: 1,
    known: false
  };
}

// ─── Customer name from email ──────────────────────────────────────
function deriveNameFromEmail_(email) {
  var local = String(email).split('@')[0] || '';
  // Replace dots / underscores with spaces, strip trailing digits.
  var cleaned = local.replace(/[._]+/g, ' ').replace(/\s+\d+$/, '').trim();
  // Title-case each word.
  return cleaned.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

// ─── Sub-header presence ──────────────────────────────────────────
function ensureSubHeaderForCustomer_(customerRow) {
  var sh = getDashboardSheet();
  var below = String(sh.getRange(customerRow + 1, 1).getValue() || '').trim().toUpperCase();
  if (below !== 'DATE') {
    appendSubHeaderRow(customerRow);
  }
}

// ─── Manual Imports audit sheet ────────────────────────────────────
function ensureManualImportsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(MANUAL_IMPORTS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MANUAL_IMPORTS_SHEET);
    var headers = [[
      'Imported At', 'Import Key', 'Source Sheet ID', 'Source Sheet Name',
      'Campus', 'Source Tab', 'Source Row', 'Email', 'Customer Name',
      'Student', 'Customer Row (Dashboard)', 'TX Rows Added', 'Source Notes'
    ]];
    sh.getRange(1, 1, 1, headers[0].length).setValues(headers);
    sh.getRange(1, 1, 1, headers[0].length)
      .setBackground('#0F3634')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(11);
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(2, 280);
    sh.setColumnWidth(3, 220);
    sh.setColumnWidth(4, 240);
    sh.setColumnWidth(5, 110);
    sh.setColumnWidth(6, 100);
    sh.setColumnWidth(7, 80);
    sh.setColumnWidth(8, 220);
    sh.setColumnWidth(9, 160);
    sh.setColumnWidth(10, 160);
    sh.setColumnWidth(11, 110);
    sh.setColumnWidth(12, 90);
    sh.setColumnWidth(13, 280);
  }
  return sh;
}

function readManualImportKeys_(auditSheet) {
  var lastRow = auditSheet.getLastRow();
  if (lastRow < 2) return {};
  var keys = auditSheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var map = {};
  keys.forEach(function(r) {
    var k = String(r[0] || '').trim();
    if (k) map[k] = true;
  });
  return map;
}

function logManualImport_(auditSheet, entry) {
  auditSheet.appendRow([
    new Date(),
    entry.importKey,
    entry.sheetId,
    entry.sheetName,
    entry.campusLabel,
    entry.tabName,
    entry.sourceRow,
    entry.email,
    entry.customerName,
    entry.student,
    entry.customerRow,
    entry.txRowsAdded,
    entry.notes || ''
  ]);
}
