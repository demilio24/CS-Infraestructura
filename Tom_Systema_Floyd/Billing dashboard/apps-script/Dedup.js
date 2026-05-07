/** ─── Dedup.gs ─────────────────────────────────────────────────
 *  Bulletproof dedup of duplicate charges on the Dashboard.
 *
 *  Two flavors of duplicate to handle:
 *
 *    A) GHL polled row + legacy import row for the same item-type and
 *       same week (or same item for week-less items like t-shirts).
 *       The import row is the duplicate; GHL is authoritative because
 *       it carries a real Stripe-linked submission ID.
 *
 *    B) Multiple legacy import rows for the same student that should
 *       collapse: e.g., a t-shirt logged once per attended week, when
 *       in reality the student only buys one t-shirt total. Or a
 *       student registered redundantly across two camp tabs.
 *
 *  Authority order to keep rows when collapsing:
 *      1. GHL polled rows (Submission ID present)
 *      2. Earliest legacy import rows by sheet-row number
 *
 *  Expected per-bucket count (the cap before we start deleting):
 *
 *    For a (customer, item-prefix, week) bucket:
 *        target = max(
 *            count of GHL rows already in that bucket,
 *            unique students for that customer-and-week from the audit
 *        )
 *
 *    For a (customer, "Student T-Shirt") bucket (week-less):
 *        target = max(
 *            count of GHL t-shirts,
 *            unique students for that customer from the audit
 *        )
 *
 *    For everything else (CC verification fee, manually-added rows
 *    with no audit signal): leave alone.
 *
 *  Origin detection (col B cell note):
 *    - GHL: contains "Submission ID:"
 *    - Import: doesn't, but does contain "Field:"
 *    - Manual / legacy normalized GHL rows that pre-date the new note
 *      format default to "GHL" so we never delete a manually-curated
 *      row.
 */

const ITEM_PREFIX_RE = /^(.+?)\s*\(Summer Camp\)/;
const TSHIRT_PREFIX = 'Student T-Shirt';
const MONTH_NUMBERS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

// ─── findDuplicateCharges ──────────────────────────────────────────
function findDuplicateCharges() { return runDedupPass_({ apply: false }); }

// ─── consolidateDuplicateCharges ───────────────────────────────────
function consolidateDuplicateCharges() { return runDedupPass_({ apply: true }); }

function runDedupPass_(opts) {
  var apply = !!(opts && opts.apply);
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { lines: ['Empty dashboard.'], deleted: 0 };

  // 1. Build the audit map: (email, weekKey) -> Set<student>; (email) -> Set<student>
  var auditByCustWeek = {};   // 'email||weekKey' -> Set<student>
  var auditByCust = {};       // 'email'          -> Set<student>
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var auditSheet = ss.getSheetByName('Manual Imports');
  if (auditSheet && auditSheet.getLastRow() > 1) {
    // Cols: A timestamp | B importKey | C sheetId | D sheetName | E campus
    //       F tab | G sourceRow | H email | I customerName | J student
    //       K customerRow | L txRowsAdded | M notes
    var aData = auditSheet.getRange(2, 1, auditSheet.getLastRow() - 1, 13).getValues();
    aData.forEach(function(r) {
      var email = String(r[7] || '').trim().toLowerCase();
      var tab   = String(r[5] || '').trim();
      var stu   = String(r[9] || '').trim();
      if (!email || !stu) return;
      var weekStart = parseTabStartDate_(tab, 2026);
      var weekKey = weekStart ? weekStart.toISOString().substring(0, 10) : '__noweek';
      var ck1 = email + '||' + weekKey;
      var ck2 = email;
      if (!auditByCustWeek[ck1]) auditByCustWeek[ck1] = {};
      auditByCustWeek[ck1][stu.toLowerCase()] = true;
      if (!auditByCust[ck2]) auditByCust[ck2] = {};
      auditByCust[ck2][stu.toLowerCase()] = true;
    });
  }

  // 2. Walk Dashboard, classify rows, group per customer per bucket.
  var values = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  var bNotes = dash.getRange(2, 2, lastRow - 1, 1).getNotes();

  var customers = [];
  var current = null;
  for (var i = 0; i < values.length; i++) {
    var sheetRow = i + 2;
    var a = String(values[i][0] || '').trim();
    var b = String(values[i][1] || '').trim();
    if (b.indexOf('@') !== -1) {
      current = { row: sheetRow, name: a, email: b.toLowerCase(), txRows: [] };
      customers.push(current);
      continue;
    }
    if (a.toUpperCase() === 'DATE') continue;
    if (!a || !current) continue;

    var note = String(bNotes[i][0] || '');
    var origin = note.indexOf('Submission ID:') !== -1 ? 'ghl' : 'import';
    var prefix = extractItemPrefix_(b);
    var weekDate = extractWeekStartDate_(b, 2026);
    // T-shirts and CC verification fees are intentionally not week-keyed.
    var weekKey = weekDate ? weekDate.toISOString().substring(0, 10) : '__noweek';

    // CC verification fee never gets touched.
    if (/cc verification fee/i.test(b)) {
      origin = 'protected';
    }

    current.txRows.push({
      row: sheetRow,
      item: b,
      origin: origin,
      prefix: prefix,
      weekKey: weekKey,
      total: Number(values[i][5]) || 0,
      status: String(values[i][6] || '').toLowerCase().trim()
    });
  }

  // 3. Per customer, per bucket, decide which rows to delete.
  var toDelete = [];
  customers.forEach(function(c) {
    if (!c.txRows.length) return;
    var byBucket = {};
    c.txRows.forEach(function(tx) {
      if (tx.origin === 'protected') return;
      var k = tx.prefix + '||' + tx.weekKey;
      if (!byBucket[k]) byBucket[k] = { ghl: [], imp: [] };
      byBucket[k][tx.origin === 'ghl' ? 'ghl' : 'imp'].push(tx);
    });
    Object.keys(byBucket).forEach(function(k) {
      var grp = byBucket[k];
      var anyTx = grp.ghl[0] || grp.imp[0];
      if (!anyTx) return;
      var prefix = anyTx.prefix;
      var weekKey = anyTx.weekKey;

      // Compute target (expected) count for this bucket.
      var target;
      if (prefix === TSHIRT_PREFIX) {
        // T-shirt: target = max(GHL count, unique students for this customer)
        var auditStudents = auditByCust[c.email] ? Object.keys(auditByCust[c.email]).length : 0;
        target = Math.max(grp.ghl.length, auditStudents);
      } else if (weekKey === '__noweek') {
        // Other week-less items: leave them alone (no signal to dedup against).
        return;
      } else {
        // Week-based item: target = max(GHL count, unique students for week)
        var weekAuditStudents = auditByCustWeek[c.email + '||' + weekKey]
          ? Object.keys(auditByCustWeek[c.email + '||' + weekKey]).length : 0;
        target = Math.max(grp.ghl.length, weekAuditStudents);
      }

      // Sorted "kept" list: GHL first (authoritative), then imports
      // ordered by sheet row (earliest wins).
      var sorted = grp.ghl.slice().concat(grp.imp.slice().sort(function(a, b) {
        return a.row - b.row;
      }));

      // Anything beyond `target` gets deleted.
      var excess = sorted.slice(target);
      excess.forEach(function(tx) {
        // Safety: never delete a GHL row.
        if (tx.origin === 'ghl') return;
        toDelete.push({
          customerRow: c.row,
          customerName: c.name,
          customerEmail: c.email,
          txRow: tx.row,
          item: tx.item,
          total: tx.total,
          status: tx.status,
          prefix: prefix,
          weekKey: weekKey,
          target: target,
          ghlCount: grp.ghl.length,
          impCount: grp.imp.length
        });
      });
    });
  });

  // 4. Apply deletions in descending row order.
  var customersTouched = {};
  if (apply && toDelete.length) {
    var descending = toDelete.slice().sort(function(a, b) { return b.txRow - a.txRow; });
    descending.forEach(function(d) {
      try { dash.deleteRow(d.txRow); customersTouched[d.customerRow] = true; }
      catch (e) {}
    });
    Object.keys(customersTouched).forEach(function(rowStr) {
      var r = parseInt(rowStr, 10);
      try { updateBalanceFormula(r, null); } catch (e) {}
      try { refreshBalanceNoteForCustomer(r); } catch (e) {}
    });
    try { regroupAllCustomers(); } catch (e) {}
    try { refreshGrandTotalHeader(); } catch (e) {}
  }

  // 5. Render report.
  var lines = [];
  lines.push((apply ? '=== Dedup APPLIED ===' : '=== Dedup DRY RUN (no changes) ==='));
  lines.push('Customers walked:        ' + customers.length);
  lines.push('Excess rows detected:    ' + toDelete.length);
  if (apply) lines.push('Customers refreshed:    ' + Object.keys(customersTouched).length);
  lines.push('');

  if (!toDelete.length) {
    lines.push('No excess rows. Dashboard is clean.');
    return { lines: lines, deleted: 0 };
  }

  var byCust = {};
  toDelete.forEach(function(d) {
    var k = d.customerRow + '|' + d.customerName;
    if (!byCust[k]) byCust[k] = [];
    byCust[k].push(d);
  });
  Object.keys(byCust).forEach(function(k) {
    var dups = byCust[k];
    var first = dups[0];
    var avoided = dups.reduce(function(s, d) { return s + d.total; }, 0);
    lines.push('--- ' + first.customerName + ' (' + first.customerEmail + ') ---');
    lines.push('  Customer row: ' + first.customerRow + ' | excess: ' +
               dups.length + ' | total avoided: $' + avoided.toFixed(2));
    dups.forEach(function(d) {
      lines.push('    ' + (apply ? 'DELETED' : 'WOULD DELETE') + ' r' + d.txRow +
                 ' | "' + d.item + '" | $' + d.total.toFixed(2) +
                 ' | bucket=(' + d.prefix + ', ' + d.weekKey + ')' +
                 ' | target=' + d.target + ' (ghl=' + d.ghlCount + ', imp=' + d.impCount + ')');
    });
  });

  return {
    lines: lines,
    deleted: apply ? toDelete.length : 0,
    candidates: toDelete.length,
    customersAffected: Object.keys(byCust).length
  };
}

// ─── helpers ──────────────────────────────────────────────────────
function extractItemPrefix_(item) {
  var s = String(item || '').trim();
  var m = s.match(ITEM_PREFIX_RE);
  if (m) return m[1].trim();
  var ci = s.indexOf(':');
  return ci > 0 ? s.substring(0, ci).trim() : s;
}

function extractWeekStartDate_(item, year) {
  var s = String(item || '');
  var m = s.match(/\(([A-Za-z]{3,})\s+(\d{1,2})(?:st|nd|rd|th)?\s*-/);
  if (m) {
    var month = MONTH_NUMBERS[m[1].toLowerCase()];
    if (month) return new Date(year, month - 1, parseInt(m[2], 10));
  }
  m = s.match(/\((\d{1,2})\/(\d{1,2})\s*-/);
  if (m) return new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  return null;
}

function parseTabStartDate_(name, year) {
  var m = String(name).match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return new Date(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
}
