/** ─── PricingGuide.gs ─────────────────────────────────────────
 *  Installs a "Pricing Syntax" dropdown banner at the top of the Logs
 *  sheet (row 1, merged across cols A:F) so the team has the pricing
 *  rules at hand whenever they're auditing a poll. Opening the
 *  dropdown shows every rule as a list option; picking one resets the
 *  cell to the default label (handled in Triggers.gs onEdit).
 *
 *  No em-dashes anywhere in the option strings.
 *
 *  Idempotent: re-running refreshes the dropdown options without
 *  inserting another banner row.
 */

const PRICING_GUIDE_SHEET_NAME = 'Pricing Syntax';   // legacy tab to delete on first run
const LOGS_SHEET_NAME = 'Logs';
const PRICING_BANNER_DEFAULT = 'PRICING SYNTAX (open to read)';

const PRICING_DROPDOWN_OPTIONS = [
  PRICING_BANNER_DEFAULT,
  'Per-week pricing: form answer must contain $X/week',
  'Per-day pricing: form answer must contain $X/day',
  'Flat pricing: $X with no /day or /week multiplier',
  'Item label format: <Form Question>: <Form Answer>',
  'Multi-week answers: each selected week becomes its own row',
  'Total formula: per_week = unit x weeks',
  'Total formula: per_day = unit x days x weeks',
  'Total formula: flat = unit',
  'Avoid: generic answers like Full Week (need explicit $X/week)',
  'Avoid: price in the QUESTION instead of the ANSWER',
  'Avoid: "$365 per week" (parser needs the slash, not the word per)',
  'Avoid: comma in number ($1,200 parses as $1)',
  'Legacy rows tagged "(normalized from legacy form syntax)" are pre-fix.'
];

// ─── installLogsPricingDropdown ─────────────────────────────────────
/**
 * Installs / refreshes the pricing dropdown banner on the Logs sheet.
 * Inserts a new row 1 above the existing header on first run, then
 * leaves it in place forever after. Filter view + frozen rows updated
 * accordingly. Existing log entries shift down by 1 the first time
 * (no data lost).
 *
 * @returns {{ action, lastRow }}
 */
function installLogsPricingDropdown() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOGS_SHEET_NAME);
  if (!sheet) {
    return { action: 'no_logs_sheet', lastRow: 0 };
  }

  var firstCellValue = String(sheet.getRange(1, 1).getValue() || '').trim();
  var bannerAlreadyInstalled =
    PRICING_DROPDOWN_OPTIONS.indexOf(firstCellValue) !== -1 ||
    firstCellValue.indexOf('PRICING SYNTAX') === 0;

  if (!bannerAlreadyInstalled) {
    // Existing layout: row 1 = column headers, row 2+ = log entries.
    // Insert a fresh row above and shift everything down by 1.
    sheet.insertRowBefore(1);

    // Re-apply the row-1 filter that setupLogsSheet originally placed
    // on the (now) shifted header row. Any pre-existing filter has to
    // be removed first, since createFilter only allows one per sheet.
    var existingFilter = sheet.getFilter();
    if (existingFilter) existingFilter.remove();
    sheet.getRange(2, 1, 1, 6).createFilter();
  }

  // Banner row formatting + dropdown — idempotent.
  applyPricingBanner_(sheet);

  // Freeze BOTH the banner and the column-header row so they stick
  // when scrolling.
  sheet.setFrozenRows(2);

  return {
    action: bannerAlreadyInstalled ? 'refreshed' : 'inserted',
    lastRow: sheet.getLastRow()
  };
}

// ─── applyPricingBanner_ ───────────────────────────────────────────
function applyPricingBanner_(sheet) {
  // Merge cols A:F across row 1 so the dropdown reads as a banner.
  var bannerRange = sheet.getRange(1, 1, 1, 6);
  // Break any leftover merge before re-merging (idempotent).
  try { bannerRange.breakApart(); } catch (e) {}
  bannerRange.merge();

  var cell = sheet.getRange(1, 1);
  cell.clearDataValidations();
  cell.clearNote();

  // Keep the cell's current value if it's a valid option (e.g., the
  // user just picked one and we're refreshing); otherwise set the
  // default label.
  var current = String(cell.getValue() || '').trim();
  if (PRICING_DROPDOWN_OPTIONS.indexOf(current) === -1) {
    cell.setValue(PRICING_BANNER_DEFAULT);
  }

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PRICING_DROPDOWN_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  cell.setDataValidation(rule);

  bannerRange
    .setBackground('#143980')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);
}

// ─── resetPricingBannerCell ────────────────────────────────────────
/**
 * Reset the banner cell back to the default label after the user
 * picks a rule from the dropdown. Called from the Logs branch of
 * onEdit in Triggers.gs.
 */
function resetPricingBannerCell() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOGS_SHEET_NAME);
  if (!sheet) return;
  sheet.getRange(1, 1).setValue(PRICING_BANNER_DEFAULT);
}

// ─── removeStandalonePricingSyntaxTab ──────────────────────────────
/**
 * One-shot cleanup: remove the legacy "Pricing Syntax" sheet that the
 * earlier setupPricingSyntaxSheet built. Safe to call when the sheet
 * no longer exists (no-op).
 */
function removeStandalonePricingSyntaxTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRICING_GUIDE_SHEET_NAME);
  if (!sh) return { removed: false, reason: 'sheet not found' };
  ss.deleteSheet(sh);
  return { removed: true };
}

/* ═════════════════════════════════════════════════════════════════════
   "Pricing" sheet — the team-editable price catalog
   ═════════════════════════════════════════════════════════════════════
   Built so the upcoming "registration-sheets-drive-billing" rewrite has
   a single source of truth for prices Tom can edit. The team edits
   prices here; the upcoming rewrite reads from here every poll.

   This is a one-shot setup. After the initial population, Tom curates
   the sheet manually. The script never overwrites it.
   ═══════════════════════════════════════════════════════════════════ */

const PRICING_SHEET_NAME = 'Pricing';

/**
 * Walk a subaccount's cached FieldRegistry, pull every picklist option
 * whose label has a $ in it, parse the price + multiplier, and return
 * a normalized list of priced items.
 *
 * Defensive: handles three picklistOption shapes GHL returns across
 * versions ({label, value} objects, plain strings, and {key, value}).
 *
 * @param {string} subaccountName  e.g. 'Florida'
 * @returns {Array<{fieldName, fieldId, optionLabel, cleanLabel, price, multiplier}>}
 */
function extractPricedOptionsFromRegistry(subaccountName) {
  var registry = getFieldRegistry(subaccountName);
  var out = [];
  registry.forEach(function(meta, fieldId) {
    var opts = (meta && meta.picklistOptions) || [];
    if (!opts.length) return;
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var label = '';
      if (typeof o === 'string') label = o;
      else if (o && typeof o === 'object') label = o.label || o.value || o.key || '';
      label = String(label).trim();
      if (!label || label.indexOf('$') === -1) continue;
      var price = parsePrice(label);
      if (price === null) continue;
      var mult = extractMultiplier(label);
      out.push({
        fieldName:   meta.name || '(unnamed field)',
        fieldId:     fieldId,
        optionLabel: label,
        cleanLabel:  stripPriceFromLabel(label),
        price:       price,
        multiplier:  mult || ''
      });
    }
  });
  return out;
}

/**
 * Build (or refresh) the "Pricing" sheet from GHL field picklist
 * options. Idempotent. Sorts by field name, then by price.
 *
 * Columns:
 *   A Category    – the GHL form field name (Camp Duration, Lunch, etc.)
 *   B Item        – the priced option's clean label (price stripped)
 *   C Price       – numeric, currency-formatted
 *   D Multiplier  – '/day' | '/week' | '' (flat)
 *   E Source      – the raw option label as it appears in GHL forms
 *   F Notes       – left blank for the team to annotate
 *
 * Run once from the editor (as emilio@nilsdigital.com so the
 * FieldRegistry fetch lands under the Workspace quota).
 */
function setupPricingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRICING_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(PRICING_SHEET_NAME);
  } else {
    // Preserve existing data on re-run unless explicitly nuked.
    var existingRows = sh.getLastRow();
    if (existingRows > 1) {
      Logger.log('[setupPricingSheet] Pricing sheet already has ' +
                 (existingRows - 1) + ' rows. Skipping refresh to avoid ' +
                 'clobbering Tom\'s edits. To force-refresh, delete the ' +
                 'sheet and re-run.');
      return { action: 'skipped_existing', rows: existingRows - 1 };
    }
    sh.clearContents();
    sh.clearFormats();
  }

  // Header
  var headers = ['Category', 'Item', 'Price', 'Multiplier', 'Source (raw GHL label)', 'Notes'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#0F3634').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11);
  sh.setFrozenRows(1);

  // Pull priced options. Florida is the polling subaccount; other states
  // are routed via WaiverOrigin but use the same form catalog.
  var priced = extractPricedOptionsFromRegistry('Florida');

  // Sort by field name then price asc
  priced.sort(function(a, b) {
    var byField = String(a.fieldName).localeCompare(String(b.fieldName));
    if (byField !== 0) return byField;
    return Number(a.price) - Number(b.price);
  });

  var rows = priced.map(function(p) {
    return [
      p.fieldName,
      p.cleanLabel || p.optionLabel,
      p.price,
      p.multiplier,
      p.optionLabel,
      ''
    ];
  });

  if (rows.length) {
    sh.getRange(2, 1, rows.length, 6).setValues(rows);
    sh.getRange(2, 3, rows.length, 1).setNumberFormat('"$"#,##0.00');
  }

  // Column widths
  sh.setColumnWidth(1, 200);  // Category
  sh.setColumnWidth(2, 300);  // Item
  sh.setColumnWidth(3, 90);   // Price
  sh.setColumnWidth(4, 100);  // Multiplier
  sh.setColumnWidth(5, 350);  // Source raw label
  sh.setColumnWidth(6, 260);  // Notes

  // Filter on header row
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, Math.max(rows.length + 1, 2), 6).createFilter();

  Logger.log('[setupPricingSheet] Wrote ' + rows.length + ' priced items from GHL Florida field registry.');
  return { action: 'created', rows: rows.length };
}

/**
 * Force-rebuild: wipes the Pricing sheet and repopulates from the GHL
 * registry. Use only when you want to throw away Tom's manual edits.
 */
function forceRebuildPricingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRICING_SHEET_NAME);
  if (sh) ss.deleteSheet(sh);
  return setupPricingSheet();
}
