/** ─── BillingFromSheets.gs ─────────────────────────────────────────
 *  Sheet-driven billing pipeline. Replaces the GHL-submission-driven
 *  flow's "freeze billing rows at first submission" problem with
 *  "rebuild billing every 5 min from current registration sheet state."
 *
 *  Phase 1 scope: summer camp sheets only
 *     Upper Campus, Lower Campus, FREE Upper, FREE Lower
 *
 *  Phase 2 will add after-school sheets in Drive folder
 *     1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V
 *  once that folder is shared with emilio@nilsdigital.com and the
 *  monthly/quarterly pricing model is defined.
 *
 *  Pipeline:
 *    1. Read the central Pricing tab (in this Billing Dashboard sheet)
 *    2. For each registration sheet in REGISTRATION_SHEETS:
 *         a. Walk every week tab, extract enrollments
 *         b. Price each enrollment via the catalog
 *         c. Write/refresh a "Billing" tab at the end of the sheet
 *    3. (Phase 1.5) Rollup all per-sheet billing into the central Dashboard
 *
 *  Status pill preservation: each tx row carries a stable fingerprint
 *  in column A (hidden / very narrow). When rebuilding, the existing
 *  status pill is looked up by fingerprint and re-applied.
 *
 *  Trade-offs vs the GHL-poll pipeline:
 *    + Sheet edits propagate to billing within 5 min
 *    + No "submission once, then frozen" problem
 *    - $1 CC verification fee (GHL payment-field artifact) no longer captured
 *    - Pricing sheet must be kept current; an unpriced cell value
 *      becomes an "unpriced" line item flagged for Tom to add
 *  ─────────────────────────────────────────────────────────────── */

// ─── Registration sheet inventory ─────────────────────────────────
// Drive folder containing every registration sheet Tom uses. The
// discoverRegistrationSheets_() function walks this tree recursively
// every poll and classifies each sheet it finds (summer paid / free /
// after-school) by the parent-folder path and the sheet's column
// headers.
//
// Folder layout (as of 2026-05-13):
//   registration sheets/
//   ├── Summer Camp/
//   │   ├── Upper Campus sheet
//   │   ├── Lower Campus sheet
//   │   └── Free Summer Camp/
//   │       ├── FREE Upper Campus sheet
//   │       └── FREE Lower Campus sheet
//   └── After School Registration/
//       └── <one sheet per school program>
const REGISTRATION_ROOT_FOLDER_ID = '1ybmFvKPQV9YHeoxUfdcDpTdpjbUYpL2w';

// Tax + fees applied during the Dashboard render. Edit these constants
// when rates change; takes effect on the next 5-min trigger.
const SHIRT_SALES_TAX_RATE  = 0.07;  // 7% on T-shirts only
const PAYMENT_PROCESSING_FEE = 0.03;  // 3% on the customer's subtotal (incl. tax)

// Fallback inventory: used when Drive folder scan fails (folder unshared,
// API error, permission issue, etc.). Keeps the 4 known summer-camp
// sheets discoverable as a safety net.
const FALLBACK_REGISTRATION_SHEETS = [
  { id: '1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA', label: 'Upper Campus', type: 'summer-paid' },
  { id: '18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs', label: 'Lower Campus', type: 'summer-paid' },
  { id: '1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ', label: 'FREE Upper Campus', type: 'summer-free' },
  { id: '1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY', label: 'FREE Lower Campus', type: 'summer-free' },
];

// 12 weeks of summer camp, in chronological order. Tab N = WEEK_ORDER[N-1].
// Kept here (rather than imported from Snapshot.js) so this script is
// self-contained inside the Billing Dashboard project.
const BFS_WEEK_ORDER = [
  'June 1st-5th', 'June 8th-12th', 'June 15th-19th', 'June 22nd-26th',
  'June 29th-July 3rd', 'July 6th-10th', 'July 13th-17th',
  'July 20th-24th', 'July 27th-31st', 'August 3rd-7th',
  'August 10th-14th', 'August 17th-21st'
];

const BILLING_TAB_NAME    = 'Billing';
const UNPRICED_TAG        = '(unpriced)';

/* ═════════════════════════════════════════════════════════════════
   ENTRY POINTS
   ═════════════════════════════════════════════════════════════════ */

/* ═════════════════════════════════════════════════════════════════
   AUTO-DISCOVERY
   ═════════════════════════════════════════════════════════════════ */

/**
 * Walks the REGISTRATION_ROOT_FOLDER_ID tree recursively, finding every
 * Google Sheet that looks like a registration sheet. Each result is
 * classified by parent-folder path:
 *   - Path contains "Free Summer Camp"   → type: 'summer-free'
 *   - Path contains "Summer Camp"        → type: 'summer-paid'
 *   - Path contains "After School"       → type: 'after-school'
 *   - Anything else                      → skipped
 *
 * Falls back to FALLBACK_REGISTRATION_SHEETS on any error so a
 * permission glitch doesn't blow up the trigger.
 *
 * @returns {Array<{id, label, type, folderPath}>}
 */
function discoverRegistrationSheets_() {
  try {
    var rootFolder = DriveApp.getFolderById(REGISTRATION_ROOT_FOLDER_ID);
    var found = [];
    bfsWalkFolder_(rootFolder, rootFolder.getName(), function(file, folderPath) {
      if (file.getMimeType() !== MimeType.GOOGLE_SHEETS) return;
      var type = bfsClassifySheet_(folderPath);
      if (!type) return;
      found.push({
        id: file.getId(),
        label: file.getName(),
        type: type,
        folderPath: folderPath
      });
    });
    if (found.length === 0) {
      Logger.log('[discoverRegistrationSheets_] WARN: zero sheets discovered in Drive folder ' +
                 REGISTRATION_ROOT_FOLDER_ID + ' — using fallback list');
      return FALLBACK_REGISTRATION_SHEETS;
    }
    Logger.log('[discoverRegistrationSheets_] found ' + found.length + ' registration sheet(s):');
    found.forEach(function(r) {
      Logger.log('  - [' + r.type + '] ' + r.label + ' (' + r.folderPath + ')');
    });
    return found;
  } catch (e) {
    Logger.log('[discoverRegistrationSheets_] failed: ' + e.message + ' — using fallback list');
    return FALLBACK_REGISTRATION_SHEETS;
  }
}

function bfsWalkFolder_(folder, currentPath, callback) {
  // Files in this folder
  var files = folder.getFiles();
  while (files.hasNext()) {
    callback(files.next(), currentPath);
  }
  // Subfolders (recurse)
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var sub = subfolders.next();
    bfsWalkFolder_(sub, currentPath + '/' + sub.getName(), callback);
  }
}

function bfsClassifySheet_(folderPath) {
  if (/Free\s+Summer\s+Camp/i.test(folderPath)) return 'summer-free';
  if (/Summer\s+Camp/i.test(folderPath))        return 'summer-paid';
  if (/After\s+School/i.test(folderPath))       return 'after-school';
  return null;
}

/**
 * Main worker — aggregates priced line items across every registration
 * sheet and writes one consolidated "Billing" tab into the central
 * Billing Dashboard sheet (this script's bound spreadsheet).
 *
 * Was previously a per-sheet Billing tab per registration sheet, but
 * the user consolidated to a single billing view 2026-05-13. The
 * per-sheet tabs are cleaned up by deleteBillingTabsFromRegistrationSheets().
 *
 * Discovery: walks REGISTRATION_ROOT_FOLDER_ID (a Drive folder) every
 * run. New registration sheets dropped in that folder tree are picked
 * up automatically on the next 5-min trigger fire.
 *
 * Runs every 5 min via installBillingFromSheetsTrigger.
 */
function buildAllBilling() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) {
    Logger.log('[buildAllBilling] previous run still in progress, skipping');
    return;
  }
  try {
    var startedAt = new Date();
    Logger.log('[buildAllBilling] start @ ' + startedAt.toISOString());

    var catalog = readPricingCatalog_();
    Logger.log('[buildAllBilling] pricing catalog: ' + catalog.items.length + ' entries');

    var registrationSheets = discoverRegistrationSheets_();
    Logger.log('[buildAllBilling] processing ' + registrationSheets.length + ' registration sheet(s)');

    // Collect priced items across every registration sheet
    var allItems = [];
    var perSheet = [];
    var seenShirts = {};  // one-time-per-student dedup across all sheets
    registrationSheets.forEach(function(reg) {
      var sheetEnroll = 0, sheetItems = 0, sheetUnpriced = 0;
      try {
        // Route to the right reader based on sheet type
        var enrollments = (reg.type === 'after-school')
          ? readAfterSchoolEnrollments_(reg)
          : readRegistrationEnrollments_(reg);
        sheetEnroll = enrollments.length;
        enrollments.forEach(function(e) {
          var items = priceEnrollment_(e, catalog);
          items.forEach(function(it) {
            if (it.oneTimePerStudent) {
              if (seenShirts[it.fingerprint]) return;
              seenShirts[it.fingerprint] = true;
            }
            it.enrollment = e;
            allItems.push(it);
            sheetItems++;
            if (it.unpriced) sheetUnpriced++;
          });
        });
        perSheet.push(reg.label + ': ' + sheetEnroll + ' enrollments, ' +
                      sheetItems + ' tx rows, ' + sheetUnpriced + ' unpriced');
      } catch (e) {
        perSheet.push(reg.label + ': ERROR ' + e.message);
        Logger.log('[buildAllBilling] ' + reg.label + ' failed: ' + e.message +
                   '\n' + (e.stack || ''));
      }
    });

    // Sort: parent email → student → week → kind
    allItems.sort(function(a, b) {
      var byEmail = (a.enrollment.email || '').localeCompare(b.enrollment.email || '');
      if (byEmail !== 0) return byEmail;
      var byStudent = (a.enrollment.student || '').localeCompare(b.enrollment.student || '');
      if (byStudent !== 0) return byStudent;
      // Unified ordering: summer weeks first, then months, then quarters
      var allPeriods = BFS_WEEK_ORDER
        .concat(AFTER_SCHOOL_MONTH_COLUMNS)
        .concat(AFTER_SCHOOL_QUARTER_COLUMNS);
      var byWeek = allPeriods.indexOf(a.enrollment.week) - allPeriods.indexOf(b.enrollment.week);
      if (byWeek !== 0) return byWeek;
      return (a.kind || '').localeCompare(b.kind || '');
    });

    // Render the consolidated billing into the existing Dashboard tab's
    // hierarchical customer-row + tx-rows-grouped layout (the layout
    // Tom prefers). The legacy "Billing" flat-table tab is no longer
    // written to and should be deleted via deleteBillingFlatTab().
    rebuildDashboardHierarchical_(allItems);

    var elapsedMs = Date.now() - startedAt.getTime();
    Logger.log('[buildAllBilling] done in ' + elapsedMs + 'ms — totals: ' +
               allItems.length + ' tx rows, ' +
               allItems.filter(function(it){return it.unpriced;}).length + ' unpriced');
    perSheet.forEach(function(s) { Logger.log('  - ' + s); });
  } finally {
    lock.releaseLock();
  }
}

/* ═════════════════════════════════════════════════════════════════
   HIERARCHICAL DASHBOARD RENDERER
   ═════════════════════════════════════════════════════════════════
   Replaces the flat "Billing" tab output with the hierarchical
   layout the team prefers: customer header row → sub-header → tx
   rows grouped/collapsible beneath. Uses the existing helpers in
   SheetWrites.js so the look matches what the old GHL-poll pipeline
   produced (balance formula, profile column, row grouping, status
   pill conditional formatting, etc.).

   Status preservation across rebuilds: each tx row stores its
   fingerprint as part of the cell Note ("Submission ID: <fp>") on
   col B (Item). On rebuild, the renderer scans those Notes first,
   captures status pills by fingerprint, wipes the Dashboard data
   area, re-appends, and restores statuses where fingerprints match.

   $1 CC verification fee rows from processSubmissionVerificationFeeOnly
   used to live on this tab too. After this refactor they no longer
   get written (the function continues to log to the Logs sheet for
   audit, but stops writing to Dashboard). If the team needs them
   surfaced visually we can add a "CC Verification Fees" tab later.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Walk every existing Dashboard tx row's col B Note, extract the
 * fingerprint (`Submission ID: <fp>`), and capture its current status
 * pill (col G value).
 */
function snapshotDashboardStatusesByFingerprint_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return {};
  var notes = dash.getRange(2, 2, lastRow - 1, 1).getNotes();
  var statuses = dash.getRange(2, 7, lastRow - 1, 1).getValues();
  var out = {};
  for (var i = 0; i < notes.length; i++) {
    var n = String(notes[i][0] || '');
    if (!n) continue;
    var m = n.match(/Submission ID:\s*(\S+)/);
    if (!m) continue;
    var status = String(statuses[i][0] || '').toLowerCase().trim();
    if (status) out[m[1]] = status;
  }
  return out;
}

/**
 * Wipes the Dashboard data area (rows 2+) and all row groups, leaving
 * row 1 header intact. Resets formatting cleanly so the next rebuild
 * starts from a known baseline.
 */
function wipeDashboardDataArea_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return;

  // Strip row groups first; otherwise deleteRows fails with "Cannot
  // delete rows in a group" in some edge cases.
  if (typeof resetAllRowGroups_ === 'function') {
    try { resetAllRowGroups_(dash); } catch (e) {
      Logger.log('[wipeDashboardDataArea_] resetAllRowGroups_ err: ' + e.message);
    }
  }
  dash.deleteRows(2, lastRow - 1);
}

/**
 * Inject derived line items per parent:
 *   - Sales tax (7%) on each priced T-shirt
 *   - Payment processing fee (3%) on the customer's subtotal (incl. tax)
 *
 * Rates live in SHIRT_SALES_TAX_RATE / PAYMENT_PROCESSING_FEE constants
 * at the top of this file. Edit there to change.
 *
 * Modifies parentBucket.items in place.
 */
function bfsInjectTaxAndFee_(parentBucket) {
  var augmented = [];
  // Pass 1: keep original items + inject sales tax line after each priced shirt
  parentBucket.items.forEach(function(it) {
    augmented.push(it);
    if (it.kind === 'shirt' && !it.unpriced && Number(it.total) > 0) {
      var taxTotal = Math.round(Number(it.total) * SHIRT_SALES_TAX_RATE * 100) / 100;
      augmented.push({
        kind:        'shirt-tax',
        label:       'Sales Tax (' + Math.round(SHIRT_SALES_TAX_RATE * 100) + '%) on ' + it.label,
        price:       taxTotal,
        multiplier:  '',
        qty:         1,
        total:       taxTotal,
        unpriced:    false,
        ambiguous:   false,
        source:      'sales-tax',
        linkToSource: '',
        enrollment:  it.enrollment,
        fingerprint: it.fingerprint + '|tax-' + Math.round(SHIRT_SALES_TAX_RATE * 100) + 'pct'
      });
    }
  });

  // Pass 2: compute subtotal of all priced items + tax → append processing fee row
  var subtotal = 0;
  augmented.forEach(function(it) {
    if (!it.unpriced) subtotal += Number(it.total) || 0;
  });
  if (subtotal > 0) {
    var feeTotal = Math.round(subtotal * PAYMENT_PROCESSING_FEE * 100) / 100;
    var feeEnrollment = {
      email:    parentBucket.email,
      emailRaw: parentBucket.emailRaw,
      student:  '— ALL —',
      week:     'All weeks',
    };
    augmented.push({
      kind:        'processing-fee',
      label:       'Payment Processing Fee (' + Math.round(PAYMENT_PROCESSING_FEE * 100) + '%)',
      price:       feeTotal,
      multiplier:  '',
      qty:         1,
      total:       feeTotal,
      unpriced:    false,
      ambiguous:   false,
      source:      'processing-fee',
      linkToSource: '',
      enrollment:  feeEnrollment,
      fingerprint: 'processing-fee|' + parentBucket.email.replace(/[^a-z0-9]/g, '-')
    });
  }

  parentBucket.items = augmented;
}

/**
 * Batch renderer. Builds the entire Dashboard data area in memory then
 * writes it with a single setValues call. ~100× faster than the
 * per-row helper approach the previous version used, which was hitting
 * Apps Script's 6-min execution limit at ~441 enrollments.
 *
 * Layout matches the legacy Dashboard look:
 *   - Header (row 1, untouched)
 *   - Customer rows (dark blue background, name/email/students/balance)
 *   - Sub-header rows (mid-blue: DATE | ITEM | UNIT PRICE | DAYS | WEEKS | TOTAL | STATUS)
 *   - Tx rows beneath each customer (grouped + collapsed)
 *
 * Status preservation: each tx row stores its fingerprint as a cell Note
 * on col B in the form "Submission ID: <fp>". Before wipe, we snapshot
 * (fp, status) pairs by reading those notes; after rebuild, we restore.
 */
function rebuildDashboardHierarchical_(items) {
  var dash = getDashboardSheet();

  // 1. Snapshot statuses + existing customer header metadata (Name,
  //    Phone, Waiver Origin) so we don't lose what's already there.
  var existingStatus = snapshotDashboardStatusesByFingerprint_();
  var existingCustomerMeta = snapshotCustomerHeaderMeta_();

  // 2. Group items by parent email
  var byParent = {};
  items.forEach(function(it) {
    var email = (it.enrollment.email || '').toLowerCase();
    if (!email) return;
    if (!byParent[email]) {
      byParent[email] = {
        email:    email,
        emailRaw: it.enrollment.emailRaw || email,
        students: {},
        items:    []
      };
    }
    byParent[email].students[it.enrollment.student] = true;
    byParent[email].items.push(it);
  });

  // 3. Augment each parent's items with sales tax + processing fee
  Object.keys(byParent).forEach(function(email) {
    bfsInjectTaxAndFee_(byParent[email]);
  });

  // 4. Build the matrix
  var matrix = [];
  var customerRows = [];   // [{ email, customerRow, subHeaderRow, txFirst, txLast, fingerprints, students }]
  var allPeriods = BFS_WEEK_ORDER
    .concat(AFTER_SCHOOL_MONTH_COLUMNS)
    .concat(AFTER_SCHOOL_QUARTER_COLUMNS);

  var emails = Object.keys(byParent).sort();
  var totalUnpriced = 0, totalAmbiguous = 0;
  var nowDateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var currentRow = 2;  // row 1 is the header

  emails.forEach(function(email) {
    var p = byParent[email];
    var studentNames = Object.keys(p.students).sort();
    var meta = existingCustomerMeta[email] || {};

    // Sort items: student → period → kind
    p.items.sort(function(a, b) {
      var byStudent = (a.enrollment.student || '').localeCompare(b.enrollment.student || '');
      if (byStudent !== 0) return byStudent;
      var byPeriod = allPeriods.indexOf(a.enrollment.week) - allPeriods.indexOf(b.enrollment.week);
      if (byPeriod !== 0) return byPeriod;
      return (a.kind || '').localeCompare(b.kind || '');
    });

    var customerRow = currentRow;
    matrix.push([
      meta.name  || '',
      p.emailRaw,
      meta.phone || '',
      meta.waiverOrigin || '',
      studentNames.join(', '),
      meta.profile || '',
      ''  // balance — set via formula in pass 2
    ]);
    currentRow++;

    var subHeaderRow = currentRow;
    matrix.push(['DATE', 'ITEM', 'UNIT PRICE', 'DAYS', 'WEEKS', 'TOTAL', 'STATUS']);
    currentRow++;

    var txFirst = currentRow;
    var fingerprints = [];
    p.items.forEach(function(it) {
      var defaultStatus = it.unpriced
        ? 'unpriced'
        : (it.ambiguous ? 'ambiguous' : 'owed');
      var status = existingStatus[it.fingerprint] || defaultStatus;
      var label = it.enrollment.student
        ? it.enrollment.student + ' — ' + it.label + ' (' + it.enrollment.week + ')'
        : it.label;
      matrix.push([
        nowDateStr,
        label,
        Number(it.price) || 0,
        it.multiplier === '/day' ? (Number(it.qty) || '') : '',
        (it.multiplier === '/week' || it.multiplier === '/wk') ? 1 : '',
        Number(it.total) || 0,
        status
      ]);
      fingerprints.push(it.fingerprint);
      if (it.unpriced)  totalUnpriced++;
      if (it.ambiguous) totalAmbiguous++;
      currentRow++;
    });
    var txLast = currentRow - 1;

    customerRows.push({
      email:        email,
      customerRow:  customerRow,
      subHeaderRow: subHeaderRow,
      txFirst:      txFirst,
      txLast:       txLast,
      fingerprints: fingerprints,
      studentCount: studentNames.length
    });
  });

  // 5. Wipe + write. Wipe must be after we've computed everything in
  //    case of an error mid-compute (we'd hate to wipe and then crash).
  if (typeof resetAllRowGroups_ === 'function') {
    try { resetAllRowGroups_(dash); } catch (e) { /* fall through */ }
  }

  // Wipe data area without deleting rows. deleteRows(2, lastRow - 1)
  // errors with "Sorry, it is not possible to delete all non-frozen
  // rows" when maxRows == lastRow (Apps Script requires at least one
  // non-frozen row to remain). Using clear() avoids the constraint
  // and is just as effective since setValues immediately overwrites.
  var oldLastRow = dash.getLastRow();
  if (oldLastRow >= 2) {
    dash.getRange(2, 1, oldLastRow - 1, dash.getMaxColumns())
        .clearContent()
        .clearFormat()
        .clearDataValidations()
        .clearNote();
  }

  if (matrix.length === 0) {
    Logger.log('[rebuildDashboardHierarchical_] no items — Dashboard left empty');
    return;
  }

  // Belt-and-braces: clear data validation across the data area we're
  // about to write. Catches column-wide validations the row-level
  // clear above might miss (the legacy status-pill dropdown sometimes
  // is set sheet-wide on col G).
  var stretchedRows = Math.max(matrix.length + 1, dash.getMaxRows() - 1);
  dash.getRange(2, 1, stretchedRows, 7).clearDataValidations();

  dash.getRange(2, 1, matrix.length, 7).setValues(matrix);

  // 6. Pass 2: per-customer formatting (balance formula, header colors,
  //    notes, status dropdown, grouping). Each operation is one API
  //    call per customer — still fast (<1s per 100 customers).
  customerRows.forEach(function(cr) {
    // Customer header style — dark blue band
    dash.getRange(cr.customerRow, 1, 1, 7)
      .setBackground('#143980').setFontColor('#FFFFFF')
      .setFontWeight('bold').setFontSize(12);

    // Sub-header style — mid blue
    dash.getRange(cr.subHeaderRow, 1, 1, 7)
      .setBackground('#4a6493').setFontColor('#FFFFFF')
      .setFontWeight('bold').setFontSize(10);

    // Balance formula on customer row (SUMIFS over tx rows where status = "owed")
    if (cr.txFirst <= cr.txLast) {
      var balFormula = '=SUMIFS(F' + cr.txFirst + ':F' + cr.txLast + ', G' + cr.txFirst + ':G' + cr.txLast + ', "owed")';
      dash.getRange(cr.customerRow, 7).setFormula(balFormula).setNumberFormat('"$"#,##0.00');

      // Tx row: number formats on Unit Price + Total
      dash.getRange(cr.txFirst, 3, cr.txLast - cr.txFirst + 1, 1).setNumberFormat('"$"#,##0.00');
      dash.getRange(cr.txFirst, 6, cr.txLast - cr.txFirst + 1, 1).setNumberFormat('"$"#,##0.00');

      // Status dropdown
      var statusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['owed', 'paid', 'canceled', 'refunded', 'unpriced', 'ambiguous'], true)
        .setAllowInvalid(false).build();
      dash.getRange(cr.txFirst, 7, cr.txLast - cr.txFirst + 1, 1).setDataValidation(statusRule);

      // Fingerprint notes on col B for status preservation on next rebuild
      var noteValues = cr.fingerprints.map(function(fp) { return ['Submission ID: ' + fp]; });
      dash.getRange(cr.txFirst, 2, noteValues.length, 1).setNotes(noteValues);

      // Row grouping + collapse (subheader through last tx)
      try {
        dash.getRange(cr.subHeaderRow, 1, cr.txLast - cr.subHeaderRow + 1, 1).shiftRowGroupDepth(1);
        var grp = dash.getRowGroup(cr.subHeaderRow, 1);
        if (grp) grp.collapse();
      } catch (e) {
        Logger.log('[rebuildDashboardHierarchical_] group err for ' + cr.email + ': ' + e.message);
      }
    } else {
      // Customer with no tx rows — leave balance blank
      dash.getRange(cr.customerRow, 7).setValue('');
    }
  });

  // 7. One-shot conditional formatting for status pills across the whole
  //    tx area (much faster than per-customer rules).
  var fullDataRange = dash.getRange(2, 1, dash.getLastRow() - 1, 7);
  var statusColAll = dash.getRange(2, 7, dash.getLastRow() - 1, 1);
  var rules = [];

  // Whole-row yellow when status needs review
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=OR($G2="unpriced",$G2="ambiguous")')
    .setBackground('#FFF3B0')
    .setRanges([fullDataRange]).build());

  // Per-status pill colors on col G
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('paid').setBackground('#D4EDDA').setFontColor('#155724').setBold(true)
    .setRanges([statusColAll]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('owed').setBackground('#FFF3CD').setFontColor('#856404')
    .setRanges([statusColAll]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('canceled').setBackground('#E2E3E5').setFontColor('#383D41')
    .setRanges([statusColAll]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('refunded').setBackground('#FFE5CC').setFontColor('#A05A00')
    .setRanges([statusColAll]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('unpriced').setBackground('#F0AD4E').setFontColor('#5A3A00').setBold(true)
    .setRanges([statusColAll]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('ambiguous').setBackground('#FFD966').setFontColor('#5A3A00').setBold(true)
    .setRanges([statusColAll]).build());

  dash.clearConditionalFormatRules();
  dash.setConditionalFormatRules(rules);

  // 8. DM Sans across everything
  dash.getRange(1, 1, dash.getLastRow(), 7).setFontFamily('DM Sans');

  Logger.log('[rebuildDashboardHierarchical_] wrote ' + emails.length + ' customer rows, ' +
             (matrix.length - emails.length * 2) + ' tx rows (' + totalUnpriced + ' unpriced, ' +
             totalAmbiguous + ' ambiguous) including sales tax + processing fee');
}

/**
 * Read existing customer header rows (those with email in col B) and
 * capture name/phone/waiverOrigin/profile so the rebuild doesn't lose
 * fields populated by the legacy GHL-driven pipeline.
 */
function snapshotCustomerHeaderMeta_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return {};
  var values = dash.getRange(2, 1, lastRow - 1, 6).getValues();
  var out = {};
  for (var i = 0; i < values.length; i++) {
    var email = String(values[i][1] || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) continue;
    out[email] = {
      name:         String(values[i][0] || ''),
      phone:        String(values[i][2] || ''),
      waiverOrigin: String(values[i][3] || ''),
      profile:      values[i][5]  // may be HYPERLINK formula — preserve as value
    };
  }
  return out;
}

/**
 * One-shot cleanup: deletes the now-redundant flat "Billing" tab on
 * the central Billing Dashboard sheet (the sheet-driven output moved
 * to the Dashboard tab hierarchically). Safe to re-run.
 */
function deleteBillingFlatTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(BILLING_TAB_NAME);
  if (sh) {
    ss.deleteSheet(sh);
    Logger.log('[deleteBillingFlatTab] deleted flat Billing tab');
    return { deleted: true };
  }
  Logger.log('[deleteBillingFlatTab] no Billing tab to delete');
  return { deleted: false };
}

/**
 * One-shot cleanup: deletes the legacy "Manual Imports" audit tab if
 * present. That tab was populated only during the initial v1 data
 * migration and has been dormant since.
 */
function deleteManualImportsTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Manual Imports');
  if (sh) {
    ss.deleteSheet(sh);
    Logger.log('[deleteManualImportsTab] deleted Manual Imports tab');
    return { deleted: true };
  }
  Logger.log('[deleteManualImportsTab] no Manual Imports tab to delete');
  return { deleted: false };
}

/**
 * Convenience: run all cleanup actions in sequence.
 */
function runCleanupPostRefactor() {
  var a = deleteBillingFlatTab();
  var b = deleteManualImportsTab();
  return { billingFlat: a, manualImports: b };
}

/**
 * One-shot cleanup: deletes the legacy per-sheet "Billing" tabs from
 * every registration sheet. Run once after the consolidation cutover
 * to remove the old per-camp Billing tabs we no longer write to.
 *
 * Safe to re-run (no-op if a sheet's Billing tab is already gone).
 */
function deleteBillingTabsFromRegistrationSheets() {
  var report = [];
  var registrationSheets = discoverRegistrationSheets_();
  registrationSheets.forEach(function(reg) {
    try {
      var ss = SpreadsheetApp.openById(reg.id);
      var sh = ss.getSheetByName(BILLING_TAB_NAME);
      if (sh) {
        ss.deleteSheet(sh);
        report.push(reg.label + ': deleted Billing tab');
      } else {
        report.push(reg.label + ': no Billing tab to delete');
      }
    } catch (e) {
      report.push(reg.label + ': ERROR ' + e.message);
    }
  });
  report.forEach(function(r) { Logger.log('[deleteBillingTabsFromRegistrationSheets] ' + r); });
  return report;
}

/**
 * One-shot diagnostic. Runs buildAllBilling once and dumps verbose
 * logs. Run from the editor as emilio@nilsdigital.com to verify the
 * whole pipeline before installing the trigger.
 */
function testBillingFromSheets() {
  Logger.log('=== testBillingFromSheets @ ' + new Date().toISOString() + ' ===');
  try {
    Logger.log('[0] effective user: ' + Session.getEffectiveUser().getEmail());
  } catch (e) {
    Logger.log('[0] effective user err (non-fatal): ' + e.message);
  }
  buildAllBilling();
  Logger.log('=== testBillingFromSheets done ===');
}

/**
 * Installs a 5-min time-driven trigger on buildAllBilling.
 * Removes any existing triggers for that handler first.
 */
function installBillingFromSheetsTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'buildAllBilling') {
      ScriptApp.deleteTrigger(t);
      Logger.log('[installBillingFromSheetsTrigger] removed old: ' + t.getUniqueId());
    }
  });
  var trigger = ScriptApp.newTrigger('buildAllBilling')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('[installBillingFromSheetsTrigger] installed: ' + trigger.getUniqueId());
}

/* ═════════════════════════════════════════════════════════════════
   PRICING CATALOG
   ═════════════════════════════════════════════════════════════════ */

/**
 * Read the central Pricing tab and build a 3-way lookup structure.
 *
 * Returns {
 *   bySource: Map<lowercase Source label → entry>,
 *   byItem:   Map<lowercase Item label  → entry>,
 *   items:    Array<entry>   // for last-resort fuzzy iteration
 * }
 *
 * The 3-way structure handles the gap between registration sheet text
 * and GHL form labels. Example: GHL form option says "Small (+$30)"
 * (the Source) but the team types just "Small" in the registration
 * sheet. Source-only lookup misses; Item-keyed lookup catches it
 * because PricingGuide stripped the "(+$30)" suffix into the Item col.
 *
 * Tom-edited rows in the Pricing tab win — script never overwrites them.
 *
 * @returns {{bySource: Map, byItem: Map, items: Array}}
 */
function readPricingCatalog_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRICING_SHEET_NAME);
  if (!sh) {
    throw new Error('Pricing sheet not found. Run setupPricingSheet() first.');
  }
  var lastRow = sh.getLastRow();
  if (lastRow < 2) {
    throw new Error('Pricing sheet is empty. Run setupPricingSheet() first.');
  }
  // Detect post-migration column layout: A Category | B Item | C Price |
  // D Multiplier | E Source | F Aliases | G Notes (or pre-migration
  // F Notes if Aliases hasn't been added yet).
  var headerRow = sh.getRange(1, 1, 1, Math.max(7, sh.getLastColumn())).getValues()[0];
  var aliasesColIdx = -1;
  for (var hi = 0; hi < headerRow.length; hi++) {
    if (String(headerRow[hi]).trim().toLowerCase() === 'aliases') {
      aliasesColIdx = hi;
      break;
    }
  }
  var numCols = Math.max(6, aliasesColIdx + 2);  // include Aliases if present
  var rows = sh.getRange(2, 1, lastRow - 1, numCols).getValues();
  var bySource = new Map();
  var byItem = new Map();
  var items = [];
  rows.forEach(function(r) {
    var category = String(r[0] || '').trim();
    var item     = String(r[1] || '').trim();
    var price    = Number(r[2]) || 0;
    var mult     = String(r[3] || '').trim();
    var source   = String(r[4] || '').trim();
    var aliasRaw = aliasesColIdx >= 0 ? String(r[aliasesColIdx] || '') : '';
    if (!item && !source) return;
    var aliases = aliasRaw.split(/[,;\n]+/)
      .map(function(a) { return a.trim().toLowerCase(); })
      .filter(Boolean);
    var entry = {
      category: category, item: item, price: price,
      multiplier: mult, source: source, aliases: aliases
    };
    if (source) bySource.set(source.toLowerCase(), entry);
    if (item)   byItem.set(item.toLowerCase(),     entry);
    items.push(entry);
  });
  return { bySource: bySource, byItem: byItem, items: items };
}

/**
 * Map a field-type tag to a regex that filters Pricing.Category. Used
 * by lookupPrice_ to scope candidates so a "banana" alias for the
 * breakfast row doesn't accidentally match a lunch cell that happens
 * to mention bananas.
 *
 * @param {'lunch'|'breakfast'|'care'|'shirt'|'tuition'|null} fieldType
 * @returns {RegExp|null}  null = no filter (consider all rows)
 */
function categoryFilterFor_(fieldType) {
  switch (fieldType) {
    case 'lunch':     return /lunch/i;
    case 'breakfast': return /breakfast/i;
    case 'care':      return /care/i;
    case 'shirt':     return /shirt/i;
    case 'tuition':   return /duration|tuition/i;
    default:          return null;
  }
}

/**
 * Reduce a string to a comparison-friendly form: lowercased, only
 * alphanumerics. "Small (+$30)" → "small30", "After care weekly option"
 * → "aftercareweeklyoption". Helps the substring fallback match across
 * spacing and punctuation variants ("Aftercare Weekly" ↔ "After care
 * weekly option").
 */
function bfsSquish_(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Detects whether multiple Pricing entries match the same cell at the
 * SAME deterministic stage (exact source / exact item / exact alias).
 * Used to flag rows for human review when the catalog is ambiguous.
 *
 * Returns the count of distinct matches at the highest-priority stage
 * that hit. 0 = no exact match (could still be matched fuzzily later).
 * >1 = ambiguity → caller should flag the row for review.
 */
function countExactMatches_(cellValue, catalog, fieldType) {
  var v = String(cellValue || '').trim();
  if (!v || /^(none|no|n\/a|na)$/i.test(v)) return 0;
  var vLower = v.toLowerCase();
  var catFilter = categoryFilterFor_(fieldType);
  function inScope(entry) {
    return !catFilter || catFilter.test(String(entry.category || ''));
  }

  // Try each deterministic stage; stop at the first stage with matches
  // and report the count there.
  var matches;

  // Stage 1: exact Source
  matches = catalog.items.filter(function(e) {
    return inScope(e) && (e.source || '').toLowerCase() === vLower;
  });
  if (matches.length > 0) return matches.length;

  // Stage 2: exact Item
  matches = catalog.items.filter(function(e) {
    return inScope(e) && (e.item || '').toLowerCase() === vLower;
  });
  if (matches.length > 0) return matches.length;

  // Stage 3: exact Alias
  matches = catalog.items.filter(function(e) {
    return inScope(e) && (e.aliases || []).indexOf(vLower) !== -1;
  });
  if (matches.length > 0) return matches.length;

  return 0;
}

/**
 * Look up a registration cell value in the catalog. Tries, in order:
 *   1. Exact Source match (category-scoped if fieldType given)
 *   2. Exact Item match
 *   3. Exact match against any Alias (comma-separated list per row)
 *   4. Cell contains Source as substring (raw + squished)
 *   5. Cell contains Item as substring (raw + squished)
 *   6. Cell contains any Alias as substring (or alias is contained in cell)
 *   7. Catalog Item contains cell as substring (squished)
 *
 * The category-scope filter prevents a "banana" alias on the breakfast
 * row from matching a lunch cell that mentions bananas in passing.
 *
 * @param {string} cellValue
 * @param {object} catalog  from readPricingCatalog_
 * @param {string=} fieldType  'lunch'|'breakfast'|'care'|'shirt'|'tuition'
 * @returns {object|null} matching entry, or null
 */
function lookupPrice_(cellValue, catalog, fieldType) {
  var v = String(cellValue || '').trim();
  if (!v) return null;
  if (/^(none|no|n\/a|na)$/i.test(v)) return null;

  var vLower = v.toLowerCase();
  var vSquish = bfsSquish_(v);
  var catFilter = categoryFilterFor_(fieldType);
  function inScope(entry) {
    return !catFilter || catFilter.test(String(entry.category || ''));
  }

  // 1 + 2: exact matches (still scoped)
  var src = catalog.bySource.get(vLower);
  if (src && inScope(src)) return src;
  var itm = catalog.byItem.get(vLower);
  if (itm && inScope(itm)) return itm;

  // 3: exact alias match
  var hit = null;
  catalog.items.forEach(function(entry) {
    if (hit || !inScope(entry)) return;
    for (var i = 0; i < entry.aliases.length; i++) {
      if (entry.aliases[i] === vLower) { hit = entry; return; }
    }
  });
  if (hit) return hit;

  // 4: cell contains Source
  catalog.bySource.forEach(function(meta, key) {
    if (hit || !inScope(meta)) return;
    if (vLower.indexOf(key) !== -1) hit = meta;
    else if (vSquish.indexOf(bfsSquish_(key)) !== -1) hit = meta;
  });
  if (hit) return hit;

  // 5: cell contains Item
  catalog.byItem.forEach(function(meta, key) {
    if (hit || !inScope(meta)) return;
    if (vLower.indexOf(key) !== -1) hit = meta;
    else if (vSquish.indexOf(bfsSquish_(key)) !== -1) hit = meta;
  });
  if (hit) return hit;

  // 6: alias substring match — bidirectional. Catches "Daily ($10) with
  //    fruit (banana)" cell matching breakfast alias "with fruit", and
  //    catches alias "banana" appearing in the cell.
  catalog.items.forEach(function(entry) {
    if (hit || !inScope(entry)) return;
    for (var i = 0; i < entry.aliases.length; i++) {
      var alias = entry.aliases[i];
      if (!alias || alias.length < 3) continue;
      if (vLower.indexOf(alias) !== -1) { hit = entry; return; }
      var aliasSquish = bfsSquish_(alias);
      if (aliasSquish.length >= 3 && vSquish.indexOf(aliasSquish) !== -1) {
        hit = entry; return;
      }
    }
  });
  if (hit) return hit;

  // 7: Item contains cell — covers e.g. cell="Aftercare Weekly"
  //    matching catalog item="After care weekly option"
  if (vSquish.length >= 4) {
    catalog.items.forEach(function(entry) {
      if (hit || !inScope(entry)) return;
      if (!entry.item) return;
      var itemSquish = bfsSquish_(entry.item);
      if (itemSquish.length && itemSquish.indexOf(vSquish) !== -1) hit = entry;
    });
  }
  return hit;
}

/* ═════════════════════════════════════════════════════════════════
   REGISTRATION SHEET READERS
   ═════════════════════════════════════════════════════════════════ */

/**
 * Walk a registration sheet's week tabs, extract one enrollment per
 * student row. Shape matches what readCampSheet_ / readFreeSheet_ in
 * Snapshot.js return, plus extra cells (Before/After care, T-shirt,
 * etc.) we need for billing.
 *
 * @param {{id, label, type}} reg  Registration sheet metadata
 * @returns {Array<Enrollment>}
 */
function readRegistrationEnrollments_(reg) {
  var ss = SpreadsheetApp.openById(reg.id);
  var tabs = ss.getSheets();
  var enrollments = [];

  for (var t = 0; t < tabs.length && t < BFS_WEEK_ORDER.length; t++) {
    var week = BFS_WEEK_ORDER[t];
    var sheet = tabs[t];
    var range = sheet.getDataRange();
    if (!range || range.getNumRows() < 2) continue;

    var values = range.getValues();
    var header = values[0].map(function(h) {
      return String(h || '').replace(/\s+/g, ' ').trim();
    });

    // Header positions. Paid + Free sheets differ in some columns,
    // so we look up each by name and default to -1 when absent.
    var col = {
      student:   bfsCol_(header, ['Student Name']),
      email:     bfsCol_(header, ['Email', 'Email Address']),
      breakfast: bfsCol_(header, ['Breakfast']),
      lunch:     bfsCol_(header, ['Lunch']),
      care:      bfsCol_(header, ['Before / After Care', 'Before/After Care']),
      shirt:     bfsCol_(header, ['Shirt?', 'Shirt Size']),
      notes:     bfsCol_(header, ['Additional Notes']),
      mon:       bfsCol_(header, ['Mon', 'Monday']),
      tue:       bfsCol_(header, ['Tue', 'Tuesday']),
      wed:       bfsCol_(header, ['Wed', 'Wednesday']),
      thu:       bfsCol_(header, ['Thu', 'Thursday']),
      fri:       bfsCol_(header, ['Fri', 'Friday']),
    };
    if (col.student < 0) continue;  // not a recognizable enrollment tab

    var sheetGid = sheet.getSheetId();

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var student = String(row[col.student] || '').trim();
      if (!student) continue;
      var email = col.email >= 0 ? String(row[col.email] || '').trim() : '';

      // Days attended — for FREE camp sheets without per-day columns,
      // all five default to true (kid attends every weekday).
      var days;
      if (col.mon >= 0) {
        days = {
          Mon: bfsDayChecked_(row[col.mon]),
          Tue: bfsDayChecked_(row[col.tue]),
          Wed: bfsDayChecked_(row[col.wed]),
          Thu: bfsDayChecked_(row[col.thu]),
          Fri: bfsDayChecked_(row[col.fri]),
        };
      } else {
        days = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true };
      }
      var dayCount = 0;
      ['Mon','Tue','Wed','Thu','Fri'].forEach(function(d) { if (days[d]) dayCount++; });

      var rowNumber = r + 1;  // Apps Script ranges are 1-indexed
      enrollments.push({
        sheetId:    reg.id,
        sheetLabel: reg.label,
        type:       reg.type,
        week:       week,
        student:    student,
        email:      email.toLowerCase(),
        emailRaw:   email,
        days:       days,
        dayCount:   dayCount,
        cells: {
          breakfast: col.breakfast >= 0 ? String(row[col.breakfast] || '').trim() : '',
          lunch:     col.lunch >= 0     ? String(row[col.lunch] || '').trim()     : '',
          care:      col.care >= 0      ? String(row[col.care] || '').trim()      : '',
          shirt:     col.shirt >= 0     ? String(row[col.shirt] || '').trim()     : '',
        },
        // Coordinates of the source row, used to deep-link to the
        // exact cell from the central Billing tab. cellLinks: per-item
        // type, a full URL to that cell in the registration sheet.
        sourceGid:  sheetGid,
        sourceRow:  rowNumber,
        cellLinks: {
          lunch:     col.lunch >= 0     ? bfsCellUrl_(reg.id, sheetGid, rowNumber, col.lunch + 1)     : '',
          breakfast: col.breakfast >= 0 ? bfsCellUrl_(reg.id, sheetGid, rowNumber, col.breakfast + 1) : '',
          care:      col.care >= 0      ? bfsCellUrl_(reg.id, sheetGid, rowNumber, col.care + 1)     : '',
          shirt:     col.shirt >= 0     ? bfsCellUrl_(reg.id, sheetGid, rowNumber, col.shirt + 1)    : '',
          // For tuition there's no single cell — link to the whole row
          row:       bfsRowUrl_(reg.id, sheetGid, rowNumber),
        },
        notes:      col.notes >= 0 ? String(row[col.notes] || '').trim() : '',
        incomplete: !email,
      });
    }
  }

  return enrollments;
}

/**
 * Convert a 1-indexed column number to an A1 letter. 1→A, 2→B, ...,
 * 26→Z, 27→AA, 28→AB, etc.
 */
function bfsColLetter_(n) {
  var letter = '';
  while (n > 0) {
    var rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/**
 * Build a deep-link URL to a specific cell in a Google Sheet.
 */
function bfsCellUrl_(spreadsheetId, gid, row, colNum) {
  var col = bfsColLetter_(colNum);
  return 'https://docs.google.com/spreadsheets/d/' + spreadsheetId +
         '/edit#gid=' + gid + '&range=' + col + row;
}

/**
 * Build a deep-link URL to an entire row in a Google Sheet.
 */
function bfsRowUrl_(spreadsheetId, gid, row) {
  return 'https://docs.google.com/spreadsheets/d/' + spreadsheetId +
         '/edit#gid=' + gid + '&range=' + row + ':' + row;
}

/* ═════════════════════════════════════════════════════════════════
   AFTER-SCHOOL READER
   ═════════════════════════════════════════════════════════════════
   After-school sheets have a totally different schema from summer
   camp: one "Enrollment" tab (not 12 weekly tabs), columns
     Student Name | Email | T Shirt | Grade
   followed by either monthly columns (January..December) or
   quarterly columns (Q1..Q4). Each filled cell = that student is
   active for that period.

   We generate one enrollment per (student × active period). The
   "program" is the sheet's title (e.g. "Linwood Holton Elementary:
   Friday 3-3:45PM"). The billing period (month/quarter) is detected
   from which column set is present.

   Pricing: looked up in the central Pricing tab using the program
   name as the source/alias key. If no Pricing row exists yet, the
   line item is generated as (unpriced) — yellow row + Fix Link
   directing the team to the right cell so Tom can add it later.
   ═══════════════════════════════════════════════════════════════ */

const AFTER_SCHOOL_MONTH_COLUMNS = [
  'January', 'February', 'March',     'April',
  'May',     'June',     'July',      'August',
  'September','October', 'November',  'December'
];
const AFTER_SCHOOL_QUARTER_COLUMNS = ['Q1', 'Q2', 'Q3', 'Q4'];

function readAfterSchoolEnrollments_(reg) {
  var ss = SpreadsheetApp.openById(reg.id);
  var sheet = ss.getSheetByName('Enrollment');
  if (!sheet) {
    // Fall back to the first tab. The APPLICATION template names it
    // "Enrollment", but any future variant just picks tab 0.
    var tabs = ss.getSheets();
    if (tabs.length === 0) return [];
    sheet = tabs[0];
  }

  var range = sheet.getDataRange();
  if (!range || range.getNumRows() < 2) return [];
  var values = range.getValues();
  var header = values[0].map(function(h) {
    return String(h || '').replace(/\s+/g, ' ').trim();
  });

  var col = {
    student: bfsCol_(header, ['Student Name']),
    email:   bfsCol_(header, ['Email', 'Email Address']),
    shirt:   bfsCol_(header, ['T Shirt', 'T-Shirt', 'Shirt Size']),
    grade:   bfsCol_(header, ['Grade']),
  };
  if (col.student < 0) return [];

  // Detect schema by which column set is present.
  var periodCols = [];
  var billingPeriod = null;
  for (var i = 0; i < AFTER_SCHOOL_MONTH_COLUMNS.length; i++) {
    var ix = bfsCol_(header, [AFTER_SCHOOL_MONTH_COLUMNS[i]]);
    if (ix >= 0) periodCols.push({ name: AFTER_SCHOOL_MONTH_COLUMNS[i], col: ix });
  }
  if (periodCols.length > 0) {
    billingPeriod = 'month';
  } else {
    for (var q = 0; q < AFTER_SCHOOL_QUARTER_COLUMNS.length; q++) {
      var qx = bfsCol_(header, [AFTER_SCHOOL_QUARTER_COLUMNS[q]]);
      if (qx >= 0) periodCols.push({ name: AFTER_SCHOOL_QUARTER_COLUMNS[q], col: qx });
    }
    if (periodCols.length > 0) billingPeriod = 'quarter';
  }
  if (!billingPeriod) return [];  // Neither monthly nor quarterly schema

  var sheetGid = sheet.getSheetId();
  var enrollments = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var student = String(row[col.student] || '').trim();
    if (!student) continue;
    var email = col.email >= 0 ? String(row[col.email] || '').trim() : '';
    var shirt = col.shirt >= 0 ? String(row[col.shirt] || '').trim() : '';
    var grade = col.grade >= 0 ? String(row[col.grade] || '').trim() : '';
    var rowNumber = r + 1;

    // One enrollment per (student × active period). A period is
    // "active" when the cell has any non-blank, non-marker value.
    periodCols.forEach(function(p) {
      var cellVal = String(row[p.col] || '').trim();
      if (!cellVal) return;
      if (isBfsYesNoMarker_(cellVal) && /^(no|n|false)$/i.test(cellVal)) return;  // explicit no = skip

      enrollments.push({
        sheetId:       reg.id,
        sheetLabel:    reg.label,
        type:          'after-school',
        billingPeriod: billingPeriod,         // 'month' | 'quarter'
        week:          p.name,                // reused as the "Period" display
        program:       reg.label,             // sheet title = school+program name
        student:       student,
        email:         email.toLowerCase(),
        emailRaw:      email,
        grade:         grade,
        days:          { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true },
        dayCount:      5,
        cells: {
          breakfast: '', lunch: '', care: '',
          shirt:     shirt
        },
        sourceGid:     sheetGid,
        sourceRow:     rowNumber,
        cellLinks: {
          shirt: col.shirt >= 0 ? bfsCellUrl_(reg.id, sheetGid, rowNumber, col.shirt + 1) : '',
          period: bfsCellUrl_(reg.id, sheetGid, rowNumber, p.col + 1),
          row:    bfsRowUrl_(reg.id, sheetGid, rowNumber),
        },
        notes:      '',
        incomplete: !email,
      });
    });
  }

  return enrollments;
}

/**
 * Price an after-school enrollment. The program name (sheet title) is
 * the lookup key. If no matching Pricing row exists, the line item is
 * created as (unpriced) — yellow row + Fix Link points to the period
 * cell so Tom knows what to add to the Pricing catalog.
 */
function priceAfterSchoolEnrollment_(e, catalog) {
  var items = [];
  var fpBase = [e.email, e.student, e.program, e.week].map(bfsSlug_).join('|');

  // Find a Pricing row matching this after-school program.
  // Scope: only catalog entries whose Category contains "after school".
  var entry = null;
  var pgLower = String(e.program || '').toLowerCase();
  var pgSquish = bfsSquish_(e.program);

  catalog.items.forEach(function(m) {
    if (entry) return;
    if (!/after\s*school/i.test(String(m.category || ''))) return;
    var src = String(m.source || '').toLowerCase();
    var itm = String(m.item || '').toLowerCase();
    if (src === pgLower || itm === pgLower) { entry = m; return; }
    // Alias match
    for (var i = 0; i < (m.aliases || []).length; i++) {
      if (m.aliases[i] === pgLower) { entry = m; return; }
    }
    // Squished substring
    var srcSq = bfsSquish_(src);
    var itmSq = bfsSquish_(itm);
    if (srcSq && (pgSquish.indexOf(srcSq) !== -1 || srcSq.indexOf(pgSquish) !== -1)) entry = m;
    else if (itmSq && (pgSquish.indexOf(itmSq) !== -1 || itmSq.indexOf(pgSquish) !== -1)) entry = m;
  });

  var multStr = e.billingPeriod === 'month' ? '/month' : '/quarter';
  if (entry && entry.price > 0) {
    items.push({
      kind:       'after-school',
      label:      e.program + ' (' + e.week + ')',
      price:      entry.price,
      multiplier: entry.multiplier || multStr,
      qty:        1,
      total:      entry.price,
      unpriced:   false,
      source:     e.program,
      linkToSource: e.cellLinks ? e.cellLinks.period : '',
      fingerprint: fpBase + '|tuition'
    });
  } else {
    items.push({
      kind:       'after-school',
      label:      UNPRICED_TAG + ' After School: ' + e.program + ' (' + e.week + ')',
      price:      0,
      multiplier: multStr,
      qty:        1,
      total:      0,
      unpriced:   true,
      source:     e.program,
      linkToSource: e.cellLinks ? e.cellLinks.period : '',
      fingerprint: fpBase + '|tuition'
    });
  }

  // After-school T-shirt — flat one-time charge per student if specified
  if (e.cells.shirt && !/^none$/i.test(e.cells.shirt) && !isBfsYesNoMarker_(e.cells.shirt)) {
    var shirt = lookupPrice_(e.cells.shirt, catalog, 'shirt');
    if (shirt) {
      items.push({
        kind:       'shirt',
        label:      'T-Shirt (' + shirt.item + ')',
        price:      shirt.price,
        multiplier: shirt.multiplier || '',
        qty:        1,
        total:      shirt.price,
        unpriced:   false,
        source:     e.cells.shirt,
        linkToSource: e.cellLinks ? e.cellLinks.shirt : '',
        oneTimePerStudent: true,
        fingerprint: [e.email, e.student].map(bfsSlug_).join('|') + '|shirt|' + bfsSlug_(shirt.item)
      });
    } else {
      items.push({
        kind:       'shirt',
        label:      UNPRICED_TAG + ' T-Shirt: ' + e.cells.shirt,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.shirt,
        linkToSource: e.cellLinks ? e.cellLinks.shirt : '',
        oneTimePerStudent: true,
        fingerprint: [e.email, e.student].map(bfsSlug_).join('|') + '|shirt|' + bfsSlug_(e.cells.shirt)
      });
    }
  }

  return items;
}

function bfsCol_(header, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var want = candidates[i].toLowerCase();
    for (var j = 0; j < header.length; j++) {
      if (header[j].toLowerCase() === want) return j;
    }
  }
  return -1;
}

function bfsDayChecked_(v) {
  if (v === true) return true;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  if (!s) return false;
  if (s === 'no' || s === 'n' || s === 'x' || s === 'false') return false;
  if (s === 'yes' || s === 'y' || s === 'true' || s === '✓' || s === '✔') return true;
  return s.length > 0 && s !== 'no';
}

/* ═════════════════════════════════════════════════════════════════
   PRICING ENROLLMENTS → LINE ITEMS
   ═════════════════════════════════════════════════════════════════ */

/**
 * Convert one enrollment into a list of priced line items.
 * Each item: { kind, label, price, multiplier, qty, total, source, fingerprint }
 *
 * Pricing rules:
 *   - Tuition (paid camps only): Pricing.Category="Select Camp Duration",
 *     match by day count ("1 day", "2 days", ..., "5 days"). Charge per week.
 *   - Lunch: lookup the lunch cell against Pricing.Source. If /day, multiply
 *     by dayCount. If /week, charge once.
 *   - Breakfast: same as lunch
 *   - Care (before/after): same
 *   - T-shirt: flat charge once per registration
 *
 * @param {Enrollment} e
 * @param {Map} catalog
 * @returns {Array<LineItem>}
 */
function priceEnrollment_(e, catalog) {
  // Route after-school enrollments through their own pricer — they
  // have a different shape (no per-day attendance, no lunch/breakfast/
  // care, billed monthly or quarterly per program).
  if (e.type === 'after-school') {
    return priceAfterSchoolEnrollment_(e, catalog);
  }

  var items = [];
  var fpBase = [e.email, e.student, e.week].map(bfsSlug_).join('|');

  // 1. Tuition (paid camps only; FREE camps are $0)
  if (e.type === 'summer-paid' && e.dayCount > 0) {
    var tuitionKey = e.dayCount === 1 ? '1 day' : (e.dayCount + ' days');
    // Find by Category + Item match (multiple variants exist as "$X")
    var tuitionPrice = null, tuitionMult = '/week', tuitionSource = '';
    catalog.items.forEach(function(m) {
      if (tuitionPrice !== null) return;
      if (/camp duration/i.test(m.category) && new RegExp('^' + tuitionKey + '$', 'i').test(m.item)) {
        tuitionPrice  = m.price;
        tuitionMult   = m.multiplier || '/week';
        tuitionSource = m.source || m.item;
      }
    });
    items.push({
      kind:       'tuition',
      label:      'Camp Tuition (' + tuitionKey + ')',
      price:      tuitionPrice == null ? 0 : tuitionPrice,
      multiplier: tuitionMult,
      qty:        1,  // one week per row
      total:      tuitionPrice == null ? 0 : tuitionPrice,
      unpriced:   tuitionPrice == null,
      source:     tuitionSource || (UNPRICED_TAG + ' ' + tuitionKey),
      linkToSource: e.cellLinks ? e.cellLinks.row : '',
      fingerprint: fpBase + '|tuition|' + tuitionKey
    });
  }

  // 2. Lunch
  if (e.cells.lunch && !/^none$/i.test(e.cells.lunch) && !isBfsYesNoMarker_(e.cells.lunch)) {
    var lunchPrice = lookupPrice_(e.cells.lunch, catalog, 'lunch');
    if (lunchPrice) {
      var qty = lunchPrice.multiplier === '/day' ? e.dayCount : 1;
      items.push({
        kind:       'lunch',
        label:      'Lunch: ' + lunchPrice.item,
        price:      lunchPrice.price,
        multiplier: lunchPrice.multiplier,
        qty:        qty,
        total:      lunchPrice.price * qty,
        unpriced:   false,
        ambiguous:  countExactMatches_(e.cells.lunch, catalog, 'lunch') > 1,
        source:     e.cells.lunch,
        linkToSource: e.cellLinks ? e.cellLinks.lunch : '',
        fingerprint: fpBase + '|lunch|' + bfsSlug_(lunchPrice.item)
      });
    } else {
      items.push({
        kind:       'lunch',
        label:      UNPRICED_TAG + ' Lunch: ' + e.cells.lunch,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.lunch,
        linkToSource: e.cellLinks ? e.cellLinks.lunch : '',
        fingerprint: fpBase + '|lunch|' + bfsSlug_(e.cells.lunch)
      });
    }
  }

  // 3. Breakfast
  if (e.cells.breakfast && !/^none$/i.test(e.cells.breakfast) && !isBfsYesNoMarker_(e.cells.breakfast)) {
    var bf = lookupPrice_(e.cells.breakfast, catalog, 'breakfast');
    if (bf) {
      var bqty = bf.multiplier === '/day' ? e.dayCount : 1;
      items.push({
        kind:       'breakfast',
        label:      'Breakfast: ' + bf.item,
        price:      bf.price,
        multiplier: bf.multiplier,
        qty:        bqty,
        total:      bf.price * bqty,
        unpriced:   false,
        ambiguous:  countExactMatches_(e.cells.breakfast, catalog, 'breakfast') > 1,
        source:     e.cells.breakfast,
        linkToSource: e.cellLinks ? e.cellLinks.breakfast : '',
        fingerprint: fpBase + '|breakfast|' + bfsSlug_(bf.item)
      });
    } else {
      items.push({
        kind:       'breakfast',
        label:      UNPRICED_TAG + ' Breakfast: ' + e.cells.breakfast,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.breakfast,
        linkToSource: e.cellLinks ? e.cellLinks.breakfast : '',
        fingerprint: fpBase + '|breakfast|' + bfsSlug_(e.cells.breakfast)
      });
    }
  }

  // 4. Care (before / after)
  if (e.cells.care && !/^none$/i.test(e.cells.care) && !isBfsYesNoMarker_(e.cells.care)) {
    var care = lookupPrice_(e.cells.care, catalog, 'care');
    if (care) {
      var cqty = care.multiplier === '/day' ? e.dayCount : 1;
      items.push({
        kind:       'care',
        label:      care.item,
        price:      care.price,
        multiplier: care.multiplier,
        qty:        cqty,
        total:      care.price * cqty,
        unpriced:   false,
        source:     e.cells.care,
        linkToSource: e.cellLinks ? e.cellLinks.care : '',
        fingerprint: fpBase + '|care|' + bfsSlug_(care.item)
      });
    } else {
      items.push({
        kind:       'care',
        label:      UNPRICED_TAG + ' Care: ' + e.cells.care,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.care,
        linkToSource: e.cellLinks ? e.cellLinks.care : '',
        fingerprint: fpBase + '|care|' + bfsSlug_(e.cells.care)
      });
    }
  }

  // 5. T-shirt — flat one-time charge per registration. To avoid
  // duplicating across weeks for the same student, the fingerprint
  // omits week and the caller dedupes.
  if (e.cells.shirt && !/^none$/i.test(e.cells.shirt) && !isBfsYesNoMarker_(e.cells.shirt)) {
    var shirt = lookupPrice_(e.cells.shirt, catalog, 'shirt');
    if (shirt) {
      items.push({
        kind:       'shirt',
        label:      'T-Shirt (' + shirt.item + ')',
        price:      shirt.price,
        multiplier: shirt.multiplier || '',
        qty:        1,
        total:      shirt.price,
        unpriced:   false,
        source:     e.cells.shirt,
        linkToSource: e.cellLinks ? e.cellLinks.shirt : '',
        oneTimePerStudent: true,
        fingerprint: [e.email, e.student].map(bfsSlug_).join('|') + '|shirt|' + bfsSlug_(shirt.item)
      });
    } else {
      items.push({
        kind:       'shirt',
        label:      UNPRICED_TAG + ' T-Shirt: ' + e.cells.shirt,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.shirt,
        linkToSource: e.cellLinks ? e.cellLinks.shirt : '',
        oneTimePerStudent: true,
        fingerprint: [e.email, e.student].map(bfsSlug_).join('|') + '|shirt|' + bfsSlug_(e.cells.shirt)
      });
    }
  }

  return items;
}

function bfsSlug_(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Recognizes a Yes/No/marker cell value (case-insensitive). The FREE
 * camp sheets use "Yes"/"No" in Breakfast/Lunch columns to mean "kid
 * wants the free meal" — these don't correspond to a priced line item
 * and should be skipped (no row, neither priced nor unpriced).
 */
function isBfsYesNoMarker_(v) {
  var t = String(v || '').trim();
  return /^(yes|y|no|n|true|false|✓|✔|x)$/i.test(t);
}

/* ═════════════════════════════════════════════════════════════════
   PER-SHEET BILLING TAB BUILD
   ═════════════════════════════════════════════════════════════════ */

/**
 * Build/refresh the Billing tab on one registration sheet.
 * Idempotent: status pills from a prior run are preserved by fingerprint.
 *
 * @param {{id, label, type}} reg
 * @param {Map} catalog
 * @returns {{enrollments, txRows, unpriced}}
 */
function buildBillingForSheet_(reg, catalog) {
  var ss = SpreadsheetApp.openById(reg.id);
  var billing = ss.getSheetByName(BILLING_TAB_NAME);

  // Snapshot existing status pills (by fingerprint) before clearing
  var existingStatus = {};
  if (billing) {
    var lr = billing.getLastRow();
    if (lr >= 3) {  // row 1 = title, row 2 = header, row 3+ = data
      var existing = billing.getRange(3, 1, lr - 2, 9).getValues();
      existing.forEach(function(row) {
        var fp = String(row[0] || '');
        var status = String(row[8] || '');
        if (fp && status) existingStatus[fp] = status;
      });
    }
  } else {
    billing = ss.insertSheet(BILLING_TAB_NAME);
    // Move to the END of the tab list
    var pos = ss.getNumSheets();
    ss.setActiveSheet(billing);
    ss.moveActiveSheet(pos);
  }

  // Walk enrollments → priced line items
  var enrollments = readRegistrationEnrollments_(reg);
  var allItems = [];
  var seenShirts = {};  // dedupe one-time-per-student items
  enrollments.forEach(function(e) {
    var items = priceEnrollment_(e, catalog);
    items.forEach(function(it) {
      if (it.oneTimePerStudent) {
        if (seenShirts[it.fingerprint]) return;
        seenShirts[it.fingerprint] = true;
      }
      it.enrollment = e;  // attach for the writer
      allItems.push(it);
    });
  });

  // Sort: parent email → student → week → kind
  allItems.sort(function(a, b) {
    var byEmail = (a.enrollment.email || '').localeCompare(b.enrollment.email || '');
    if (byEmail !== 0) return byEmail;
    var byStudent = (a.enrollment.student || '').localeCompare(b.enrollment.student || '');
    if (byStudent !== 0) return byStudent;
    var byWeek = BFS_WEEK_ORDER.indexOf(a.enrollment.week) - BFS_WEEK_ORDER.indexOf(b.enrollment.week);
    if (byWeek !== 0) return byWeek;
    return (a.kind || '').localeCompare(b.kind || '');
  });

  // Render
  renderBillingTab_(billing, reg, allItems, existingStatus);

  var unpricedCount = allItems.filter(function(it) { return it.unpriced; }).length;
  return {
    enrollments: enrollments.length,
    txRows: allItems.length,
    unpriced: unpricedCount
  };
}

function renderBillingTab_(billing, reg, items, existingStatus) {
  billing.clear();
  billing.clearConditionalFormatRules();

  var NUM_COLS = 10;  // includes new "Fix Link" column
  var BILLING_FONT = 'DM Sans';  // applied to every cell at the end

  // Row 1: title banner
  var title = 'Billing — ' + reg.label;
  billing.getRange(1, 1, 1, NUM_COLS).merge();
  var unpricedCount = items.filter(function(it) { return it.unpriced; }).length;
  var ambigCount    = items.filter(function(it) { return it.ambiguous && !it.unpriced; }).length;
  var reviewBlurb = unpricedCount + ' unpriced';
  if (ambigCount) reviewBlurb += ' + ' + ambigCount + ' ambiguous';
  billing.getRange(1, 1)
    .setValue(title + '   |   ' + items.length + ' line items   |   ' +
              reviewBlurb + ' need review   |   last refreshed ' +
              new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))
    .setBackground('#0F3634').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(12)
    .setHorizontalAlignment('left');
  billing.setRowHeight(1, 32);

  // Row 2: column headers
  var headers = [
    'Fingerprint', 'Parent Email', 'Student', 'Week', 'Item',
    'Unit Price', 'Qty', 'Total', 'Status', 'Fix Link'
  ];
  billing.getRange(2, 1, 1, headers.length).setValues([headers])
    .setBackground('#143980').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11);
  billing.setFrozenRows(2);

  // Hide column A (fingerprint) — used internally for status preservation
  billing.hideColumns(1);

  // Build the data block. The Fix Link col is left as a string for
  // priced rows ('') and as a HYPERLINK formula for unpriced rows.
  // Mixing values + formulas in one setValues call needs the formula
  // string to be a true formula (starting with '='), which Sheets
  // recognizes and evaluates. Confirmed Apps Script behavior.
  var rows = items.map(function(it) {
    var defaultStatus = it.unpriced
      ? 'unpriced'
      : (it.ambiguous ? 'ambiguous' : 'owed');
    var status = existingStatus[it.fingerprint] || defaultStatus;
    var linkCell = '';
    // Surface a "Open cell" jump-link whenever the row needs human
    // attention (unmatched OR multiple matches) so the team can fix
    // it in the registration sheet directly.
    if ((it.unpriced || it.ambiguous) && it.linkToSource) {
      linkCell = '=HYPERLINK("' + it.linkToSource + '","Open cell")';
    }
    return [
      it.fingerprint,
      it.enrollment.emailRaw || it.enrollment.email,
      it.enrollment.student,
      it.enrollment.week,
      it.label,
      it.price,
      it.qty + (it.multiplier ? ' (' + it.multiplier.replace('/', 'per ') + ')' : ''),
      it.total,
      status,
      linkCell
    ];
  });

  if (rows.length) {
    billing.getRange(3, 1, rows.length, NUM_COLS).setValues(rows);
    billing.getRange(3, 6, rows.length, 1).setNumberFormat('"$"#,##0.00');
    billing.getRange(3, 8, rows.length, 1).setNumberFormat('"$"#,##0.00');

    // Status dropdown
    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['owed', 'paid', 'canceled', 'refunded', 'unpriced', 'ambiguous'], true)
      .setAllowInvalid(false).build();
    billing.getRange(3, 9, rows.length, 1).setDataValidation(statusRule);

    var rules = [];

    // ENTIRE-ROW yellow highlight when status needs review (either
    // unmatched or multiple-match-ambiguous). What the team scans for.
    var allRows = billing.getRange(3, 1, rows.length, NUM_COLS);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=OR($I3="unpriced",$I3="ambiguous")')
      .setBackground('#FFF3B0')
      .setRanges([allRows]).build());

    // Per-status color on the Status pill column (col I)
    var statusCol = billing.getRange(3, 9, rows.length, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('paid').setBackground('#D4EDDA').setFontColor('#155724').setBold(true)
      .setRanges([statusCol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('owed').setBackground('#FFF3CD').setFontColor('#856404')
      .setRanges([statusCol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('canceled').setBackground('#E2E3E5').setFontColor('#383D41')
      .setRanges([statusCol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('refunded').setBackground('#FFE5CC').setFontColor('#A05A00')
      .setRanges([statusCol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('unpriced').setBackground('#F0AD4E').setFontColor('#5A3A00').setBold(true)
      .setRanges([statusCol]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('ambiguous').setBackground('#FFD966').setFontColor('#5A3A00').setBold(true)
      .setRanges([statusCol]).build());

    billing.setConditionalFormatRules(rules);
  }

  // Column widths
  billing.setColumnWidth(2, 220);  // Parent Email
  billing.setColumnWidth(3, 160);  // Student
  billing.setColumnWidth(4, 140);  // Week
  billing.setColumnWidth(5, 280);  // Item
  billing.setColumnWidth(6, 100);  // Unit Price
  billing.setColumnWidth(7, 120);  // Qty
  billing.setColumnWidth(8, 100);  // Total
  billing.setColumnWidth(9, 110);  // Status
  billing.setColumnWidth(10, 120); // Fix Link

  // Filter on header row
  if (billing.getFilter()) billing.getFilter().remove();
  billing.getRange(2, 1, Math.max(rows.length + 1, 2), NUM_COLS).createFilter();

  // Apply DM Sans across every cell in the rendered area. Done last so
  // it covers the banner, headers, and every data row uniformly.
  var totalRows = 2 + rows.length;
  billing.getRange(1, 1, totalRows, NUM_COLS).setFontFamily(BILLING_FONT);
}
