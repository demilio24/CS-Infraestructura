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
