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
// Hardcoded for Phase 1. Auto-discovery via Drive folder + structure
// detection lands in Phase 2 when the after-school folder is wired in.
const REGISTRATION_SHEETS = [
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

/**
 * Main worker — refreshes the Billing tab in every registration sheet.
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
    Logger.log('[buildAllBilling] pricing catalog: ' + catalog.size + ' entries');

    var results = [];
    REGISTRATION_SHEETS.forEach(function(reg) {
      try {
        var r = buildBillingForSheet_(reg, catalog);
        results.push(reg.label + ': ' + r.enrollments + ' enrollments, ' +
                     r.txRows + ' tx rows, ' + r.unpriced + ' unpriced');
      } catch (e) {
        results.push(reg.label + ': ERROR ' + e.message);
        Logger.log('[buildAllBilling] ' + reg.label + ' failed: ' + e.message +
                   '\n' + (e.stack || ''));
      }
    });

    var elapsedMs = Date.now() - startedAt.getTime();
    Logger.log('[buildAllBilling] done in ' + elapsedMs + 'ms\n  - ' +
               results.join('\n  - '));
  } finally {
    lock.releaseLock();
  }
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
 * Read the central Pricing tab into a Map keyed by the raw source
 * label (column E). Values: { category, item, price, multiplier }.
 *
 * The script matches a registration cell value (e.g., "Pizza ($30/week)")
 * against catalog keys to find its price. Tom-edited rows in the
 * Pricing tab win — script never overwrites them.
 *
 * @returns {Map<string, {category, item, price, multiplier}>}
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
  // Columns: A Category | B Item | C Price | D Multiplier | E Source | F Notes
  var rows = sh.getRange(2, 1, lastRow - 1, 6).getValues();
  var map = new Map();
  rows.forEach(function(r) {
    var category = String(r[0] || '').trim();
    var item     = String(r[1] || '').trim();
    var price    = Number(r[2]) || 0;
    var mult     = String(r[3] || '').trim();
    var source   = String(r[4] || '').trim();
    if (!source) return;
    map.set(source.toLowerCase(), {
      category: category, item: item, price: price, multiplier: mult
    });
  });
  return map;
}

/**
 * Look up a registration cell value in the catalog. Tries exact match
 * first, then a fuzzy contains-match on the dollar-suffix pattern.
 * Returns null on miss.
 */
function lookupPrice_(cellValue, catalog) {
  var v = String(cellValue || '').trim();
  if (!v || /^none$/i.test(v) || /^no$/i.test(v) || /^n\/a$/i.test(v)) return null;

  // Exact (case-insensitive) match against the Source column
  var direct = catalog.get(v.toLowerCase());
  if (direct) return direct;

  // Fuzzy: the cell might be a longer string containing the catalog
  // label (e.g., "Celis Special $15/day (added 5/2026)"). Walk the
  // catalog and return the first entry whose source appears in the cell.
  var hit = null;
  catalog.forEach(function(meta, key) {
    if (hit) return;
    if (v.toLowerCase().indexOf(key) !== -1) hit = meta;
  });
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
        notes:      col.notes >= 0 ? String(row[col.notes] || '').trim() : '',
        incomplete: !email,
      });
    }
  }

  return enrollments;
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
  var items = [];
  var fpBase = [e.email, e.student, e.week].map(bfsSlug_).join('|');

  // 1. Tuition (paid camps only; FREE camps are $0)
  if (e.type === 'summer-paid' && e.dayCount > 0) {
    var tuitionKey = e.dayCount === 1 ? '1 day' : (e.dayCount + ' days');
    // Find by Category + Item match (multiple variants exist as "$X")
    var tuitionPrice = null, tuitionMult = '/week', tuitionSource = '';
    catalog.forEach(function(m, src) {
      if (tuitionPrice !== null) return;
      if (/camp duration/i.test(m.category) && new RegExp('^' + tuitionKey + '$', 'i').test(m.item)) {
        tuitionPrice  = m.price;
        tuitionMult   = m.multiplier || '/week';
        tuitionSource = src;
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
      fingerprint: fpBase + '|tuition|' + tuitionKey
    });
  }

  // 2. Lunch
  if (e.cells.lunch && !/^none$/i.test(e.cells.lunch)) {
    var lunchPrice = lookupPrice_(e.cells.lunch, catalog);
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
        source:     e.cells.lunch,
        fingerprint: fpBase + '|lunch|' + bfsSlug_(lunchPrice.item)
      });
    } else {
      items.push({
        kind:       'lunch',
        label:      UNPRICED_TAG + ' Lunch: ' + e.cells.lunch,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.lunch,
        fingerprint: fpBase + '|lunch|' + bfsSlug_(e.cells.lunch)
      });
    }
  }

  // 3. Breakfast
  if (e.cells.breakfast && !/^none$/i.test(e.cells.breakfast)) {
    var bf = lookupPrice_(e.cells.breakfast, catalog);
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
        source:     e.cells.breakfast,
        fingerprint: fpBase + '|breakfast|' + bfsSlug_(bf.item)
      });
    } else {
      items.push({
        kind:       'breakfast',
        label:      UNPRICED_TAG + ' Breakfast: ' + e.cells.breakfast,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.breakfast,
        fingerprint: fpBase + '|breakfast|' + bfsSlug_(e.cells.breakfast)
      });
    }
  }

  // 4. Care (before / after)
  if (e.cells.care && !/^none$/i.test(e.cells.care)) {
    var care = lookupPrice_(e.cells.care, catalog);
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
        fingerprint: fpBase + '|care|' + bfsSlug_(care.item)
      });
    } else {
      items.push({
        kind:       'care',
        label:      UNPRICED_TAG + ' Care: ' + e.cells.care,
        price:      0, multiplier: '', qty: 1, total: 0,
        unpriced:   true,
        source:     e.cells.care,
        fingerprint: fpBase + '|care|' + bfsSlug_(e.cells.care)
      });
    }
  }

  // 5. T-shirt — flat one-time charge per registration. To avoid
  // duplicating across weeks for the same student, the fingerprint
  // omits week and the caller dedupes.
  if (e.cells.shirt && !/^none$/i.test(e.cells.shirt) && !/^no$/i.test(e.cells.shirt)) {
    var shirt = lookupPrice_(e.cells.shirt, catalog);
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

  // Row 1: title banner
  var title = 'Billing — ' + reg.label;
  billing.getRange(1, 1, 1, 9).merge();
  billing.getRange(1, 1)
    .setValue(title + '   |   ' + items.length + ' line items   |   last refreshed ' +
              new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))
    .setBackground('#0F3634').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(12)
    .setHorizontalAlignment('left');
  billing.setRowHeight(1, 32);

  // Row 2: column headers
  var headers = [
    'Fingerprint', 'Parent Email', 'Student', 'Week', 'Item',
    'Unit Price', 'Qty', 'Total', 'Status'
  ];
  billing.getRange(2, 1, 1, headers.length).setValues([headers])
    .setBackground('#143980').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11);
  billing.setFrozenRows(2);

  // Hide column A (fingerprint) — used internally for status preservation
  billing.hideColumns(1);

  // Render data rows
  var rows = items.map(function(it) {
    var status = existingStatus[it.fingerprint] || (it.unpriced ? 'unpriced' : 'owed');
    return [
      it.fingerprint,
      it.enrollment.emailRaw || it.enrollment.email,
      it.enrollment.student,
      it.enrollment.week,
      it.label,
      it.price,
      it.qty + (it.multiplier ? ' (' + it.multiplier.replace('/', 'per ') + ')' : ''),
      it.total,
      status
    ];
  });

  if (rows.length) {
    billing.getRange(3, 1, rows.length, 9).setValues(rows);
    billing.getRange(3, 6, rows.length, 1).setNumberFormat('"$"#,##0.00');
    billing.getRange(3, 8, rows.length, 1).setNumberFormat('"$"#,##0.00');

    // Status dropdown
    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['owed', 'paid', 'canceled', 'refunded', 'unpriced'], true)
      .setAllowInvalid(false).build();
    billing.getRange(3, 9, rows.length, 1).setDataValidation(statusRule);

    // Conditional formatting on status column
    var rules = [];
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('paid').setBackground('#D4EDDA').setFontColor('#155724').setBold(true)
      .setRanges([billing.getRange(3, 9, rows.length, 1)]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('owed').setBackground('#FFF3CD').setFontColor('#856404')
      .setRanges([billing.getRange(3, 9, rows.length, 1)]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('canceled').setBackground('#E2E3E5').setFontColor('#383D41')
      .setRanges([billing.getRange(3, 9, rows.length, 1)]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('refunded').setBackground('#FFE5CC').setFontColor('#A05A00')
      .setRanges([billing.getRange(3, 9, rows.length, 1)]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('unpriced').setBackground('#F8D7DA').setFontColor('#721C24').setBold(true)
      .setRanges([billing.getRange(3, 9, rows.length, 1)]).build());
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

  // Filter on header row
  if (billing.getFilter()) billing.getFilter().remove();
  billing.getRange(2, 1, Math.max(rows.length + 1, 2), 9).createFilter();
}
