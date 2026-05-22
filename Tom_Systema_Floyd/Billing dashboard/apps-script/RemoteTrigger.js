/** ─── RemoteTrigger.gs ──────────────────────────────────────────
 *  Token-gated webapp endpoint that lets a remote caller (e.g.
 *  Claude Code via curl) invoke a whitelisted set of script
 *  functions without manual editor interaction.
 *
 *  Setup (one-time):
 *    1. Generate a long random token (32+ chars). Example:
 *         node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
 *    2. Set Script Property REMOTE_TRIGGER_TOKEN to that value.
 *       Project Settings -> Script Properties -> Add property.
 *    3. Deploy as web app: Deploy -> New deployment -> Type: Web app,
 *       Execute as: Me (emilio@nilsdigital.com),
 *       Who has access: Anyone. Copy the /exec URL.
 *    4. The /exec URL + token are everything a caller needs.
 *
 *  Invoke:
 *    GET <url>?fn=<name>&token=<secret>[&sync=1]
 *
 *  Modes:
 *    sync=0 (default) -> schedules a one-time time-based trigger
 *                        ~10s in the future and returns immediately.
 *                        The function runs as a regular trigger
 *                        (no webapp 6-min cap, full 30-min cap).
 *                        Best for nuclearResetBilling (~5 min).
 *                        Caller watches the editor's Executions tab.
 *    sync=1            -> invokes the function inside the webapp
 *                        request and returns its result. Subject to
 *                        the 6-min webapp execution cap. Best for
 *                        fast functions (fixDashboardStatusValidation,
 *                        debugQuotaState, tailLogs).
 *
 *  List functions:
 *    GET <url>?list=1&token=<secret>
 *
 *  Tail logs (handy for progress checks after a scheduled run):
 *    GET <url>?fn=tailLogs&token=<secret>&sync=1&n=20
 *
 *  Security:
 *    - The webapp deployment is publicly reachable (ANYONE_ANONYMOUS).
 *      Access is gated entirely by the token + whitelist.
 *    - The whitelist intentionally excludes destructive operations
 *      (no "delete all customers", no arbitrary SQL, etc.). Every
 *      whitelisted function is idempotent or reversible.
 *    - Rotate the token by setting a new value in Script Properties.
 *      The old token is immediately invalid; no redeploy needed.
 *  ──────────────────────────────────────────────────────────── */

const REMOTE_TRIGGER_TOKEN_PROP = 'REMOTE_TRIGGER_TOKEN';

// Function name -> short description. Only listed functions can be
// invoked through this endpoint.
const REMOTE_TRIGGER_WHITELIST = {
  // Long-running rebuild + reconcile entry points
  nuclearResetBilling:             'Full Dashboard rebuild from registration sheets, with status preservation. ~5 min. Use sync=0.',
  buildAllBilling:                 '5-min reconciler (diff-based). ~5-30s for small diffs.',
  pollFloridaSubmissions:          'GHL fee-only poll for $1 CC verification. ~10-30s.',

  // Surgical fixes
  fixDashboardGroups:              'Rebuild +/- row groups per customer. ~5-10s.',
  fixDashboardStatusValidation:    'Re-scope status dropdown to tx rows only. ~5-10s.',
  sanitizeDashboardCustomerHeaders: 'Strip placeholder text + em-dashes from customer headers. ~5s.',
  removeItemUnderlines:            'Strip default underline from HYPERLINK cells (Item, Profile). ~3-5s.',
  installFormSheetQuickLinks:      'Write the 4 form-sheet HYPERLINK chips (Vladimir, Private Lessons, Rent-A-Sensei, Balloons) + folder link into Dashboard cols K1-O1. Idempotent. ~3-5s. Use sync=1.',

  // Pricing tab maintenance
  setupPricingSheet:               'First-time bootstrap of Pricing tab from GHL form fields.',
  migratePricingSheetAddAliases:   'Add Aliases column to Pricing tab.',
  prettifyPricingSheet:            'Reformat Pricing tab into banded sections.',

  // Manual Items tab (operator escape hatch for non-reg-sheet charges)
  setupManualItemsTab:             'Bootstrap the Manual Items tab. Idempotent. Use sync=1.',
  addManualItem:                   'Append a row to the Manual Items tab. Params: &email=&student=&label=&amount= (negative OK for credits) [&qty=N (default 1)][&applyProcessing=Yes|No (default Yes)][&applyTax=Yes (default No)][&period=][&status=owed|paid|canceled][&refresh=1 schedules a 10s buildAllBilling trigger]. Use sync=1.',
  testAddManualItemTemplate:       'Render the AddManualItem.html template with stub data; returns ok:true if the template parses cleanly. Use sync=1.',

  // Trigger management
  installBillingFromSheetsTrigger:    '(Re)install 5-min buildAllBilling trigger.',
  installPollingTrigger:              '(Re)install 5-min pollFloridaSubmissions trigger.',
  installDailyHealthCheckTrigger:     '(Re)install daily dailyHealthCheck trigger (9 AM Central, polling watchdog).',
  installDailyDashboardSelfHealTrigger: '(Re)install daily 3 AM dashboard self-heal trigger (audit + conditional nuclearResetBilling).',
  dailyDashboardSelfHeal:             'Run the dashboard self-heal once: audit + nuclearResetBilling only if needed. Use sync=0 for long runs.',

  // Diagnostics (read-only)
  debugQuotaState:                 'Dump effective user, triggers, last-poll info. Read-only.',
  tailLogs:                        'Return last N rows of the Logs sheet. Pass &n=<rows> (default 20). Use sync=1.',
  remoteTriggerStatus:             'Return current trigger inventory + last reconcile / nuclear summary. Read-only.',
  traceCustomer:                   'Return a customer\'s Dashboard rows + col B cell notes (with source provenance). Pass &email=<addr>. Use sync=1.',
  traceAllFreeCampSources:         'Scan every tx row\'s col B note. Return ones whose Source line mentions FREE Upper / FREE Lower. Use sync=1.',
  listShirtOnlyCustomers:          'Walk the Dashboard and return every customer whose ONLY tx items are shirts (no tuition/lunch/breakfast/care). Includes source provenance per row. Use sync=1.',
  dumpRegRow:                      'Return the raw cells of one row from a registration sheet. Pass &sheetId=<id>&tabName=<short-tab>&row=<N>. Useful for verifying what\'s actually in the source. Use sync=1.',
  dashboardStats:                  'Count unique parents, unique students, tx rows, and status counts on the Billing Dashboard. Use sync=1.',
  registrationStats:               'Per-sheet count of enrollments, unique students, unique parents, and dayCount=0 phantom registrations from the source registration sheets. Use sync=1.',
  sampleCanceledRows:              'Return the first N (default 10) canceled tx rows on the Dashboard, including each row\'s col B note source. Use sync=1, pass &n=<count>.',
};

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var token = String(p.token || '');
    var fn = String(p.fn || '');
    var sync = String(p.sync || '0') === '1';
    var listOnly = String(p.list || '0') === '1';

    var expected = PropertiesService.getScriptProperties().getProperty(REMOTE_TRIGGER_TOKEN_PROP);
    if (!expected) {
      return _rtJson_({
        ok: false,
        error: 'Token not configured. Set Script Property REMOTE_TRIGGER_TOKEN before invoking.'
      });
    }
    if (token !== expected) {
      // Don't leak whether the property is set; just fail the same way.
      return _rtJson_({ ok: false, error: 'Invalid token.' });
    }

    if (listOnly) {
      return _rtJson_({
        ok: true,
        whitelist: REMOTE_TRIGGER_WHITELIST,
        usage: {
          schedule: '?fn=<name>&token=...      (default; runs as trigger, ~10s delay)',
          sync:     '?fn=<name>&token=...&sync=1  (runs inside the request, 6-min cap)',
          list:     '?list=1&token=...          (this listing)'
        }
      });
    }

    if (!fn) {
      return _rtJson_({
        ok: false,
        error: 'Missing ?fn=<function>.',
        hint: 'GET ?list=1&token=... to see available functions.'
      });
    }
    if (!REMOTE_TRIGGER_WHITELIST.hasOwnProperty(fn)) {
      return _rtJson_({
        ok: false,
        error: 'Function not in whitelist: ' + fn,
        whitelist: Object.keys(REMOTE_TRIGGER_WHITELIST)
      });
    }

    if (sync) {
      var startedAt = new Date();
      var result;
      try {
        result = _rtDispatch_(fn, p);
      } catch (callErr) {
        return _rtJson_({
          ok: false, fn: fn, mode: 'sync',
          error: String(callErr && callErr.message || callErr),
          stack: String(callErr && callErr.stack || ''),
          elapsedMs: Date.now() - startedAt.getTime()
        });
      }
      return _rtJson_({
        ok: true, fn: fn, mode: 'sync',
        elapsedMs: Date.now() - startedAt.getTime(),
        result: result === undefined ? null : result
      });
    }

    // Schedule a one-time trigger ~10s in the future. Apps Script
    // auto-deletes one-time triggers after they fire so no inventory
    // bloat.
    var trigger = ScriptApp.newTrigger(fn).timeBased().after(10 * 1000).create();
    return _rtJson_({
      ok: true, fn: fn, mode: 'scheduled',
      afterSeconds: 10,
      triggerId: trigger.getUniqueId(),
      note: 'Watch the editor Executions tab for progress. Call ?fn=tailLogs&sync=1 to peek at Logs sheet.'
    });
  } catch (err) {
    return _rtJson_({
      ok: false,
      error: String(err && err.message || err),
      stack: String(err && err.stack || '')
    });
  }
}

/**
 * Explicit dispatcher. Each case maps a whitelisted name to a
 * call. Adding a new function requires:
 *   1. Add the function name + description to REMOTE_TRIGGER_WHITELIST.
 *   2. Add a case here.
 *
 * Explicit dispatch (no `eval` / `globalThis[fn]()`) keeps the
 * blast radius of a future bug minimal — only functions named
 * here can ever be invoked through this endpoint.
 */
function _rtDispatch_(fn, params) {
  switch (fn) {
    case 'nuclearResetBilling':              return nuclearResetBilling();
    case 'buildAllBilling':                  return buildAllBilling();
    case 'pollFloridaSubmissions':           return pollFloridaSubmissions();
    case 'fixDashboardGroups':               return fixDashboardGroups();
    case 'fixDashboardStatusValidation':     return fixDashboardStatusValidation();
    case 'sanitizeDashboardCustomerHeaders': return sanitizeDashboardCustomerHeaders();
    case 'removeItemUnderlines':             return removeItemUnderlines();
    case 'installFormSheetQuickLinks':       return installFormSheetQuickLinks();
    case 'setupPricingSheet':                return setupPricingSheet();
    case 'migratePricingSheetAddAliases':    return migratePricingSheetAddAliases();
    case 'prettifyPricingSheet':             return prettifyPricingSheet();
    case 'setupManualItemsTab':              return setupManualItemsTab();
    case 'addManualItem':                    return _rtAddManualItem_(params);
    case 'testAddManualItemTemplate':        return testAddManualItemTemplate();
    case 'installBillingFromSheetsTrigger':  return installBillingFromSheetsTrigger();
    case 'installPollingTrigger':            return installPollingTrigger();
    case 'installDailyHealthCheckTrigger':   return installDailyHealthCheckTrigger();
    case 'installDailyDashboardSelfHealTrigger': return installDailyDashboardSelfHealTrigger();
    case 'dailyDashboardSelfHeal':           return dailyDashboardSelfHeal();
    case 'debugQuotaState':                  return debugQuotaState();
    case 'tailLogs':                         return _rtTailLogs_(params);
    case 'remoteTriggerStatus':              return _rtStatus_();
    case 'traceCustomer':                    return _rtTraceCustomer_(params);
    case 'traceAllFreeCampSources':          return _rtTraceFreeCampSources_();
    case 'listShirtOnlyCustomers':           return _rtListShirtOnlyCustomers_();
    case 'dumpRegRow':                       return _rtDumpRegRow_(params);
    case 'dashboardStats':                   return _rtDashboardStats_();
    case 'registrationStats':                return _rtRegistrationStats_();
    case 'sampleCanceledRows':               return _rtSampleCanceledRows_(params);
    default: throw new Error('Dispatcher missing for whitelisted fn: ' + fn);
  }
}

function _rtTailLogs_(params) {
  var n = Math.max(1, Math.min(200, Number((params && params.n) || 20)));
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Logs');
  if (!sh) return { ok: false, error: 'Logs sheet not found' };
  var lr = sh.getLastRow();
  if (lr < 2) return { ok: true, count: 0, rows: [] };
  var firstRow = Math.max(2, lr - n + 1);
  var lc = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lc).getValues()[0];
  var data = sh.getRange(firstRow, 1, lr - firstRow + 1, lc).getValues();
  // Convert to array of {header: value} objects for readability
  var rows = data.map(function(r) {
    var o = {};
    for (var i = 0; i < headers.length; i++) {
      var v = r[i];
      o[String(headers[i] || ('col' + (i + 1)))] = v instanceof Date ? v.toISOString() : v;
    }
    return o;
  });
  return { ok: true, count: rows.length, firstRow: firstRow, lastRow: lr, rows: rows };
}

function _rtStatus_() {
  var props = PropertiesService.getScriptProperties();
  var triggers = ScriptApp.getProjectTriggers().map(function(t) {
    return {
      uniqueId:        t.getUniqueId(),
      handlerFunction: t.getHandlerFunction(),
      eventType:       String(t.getEventType()),
      triggerSource:   String(t.getTriggerSource())
    };
  });
  return {
    ok: true,
    timestamp:        new Date().toISOString(),
    timezone:         Session.getScriptTimeZone(),
    effectiveUser:    Session.getEffectiveUser().getEmail(),
    activeUser:       Session.getActiveUser().getEmail(),
    triggers:         triggers,
    lastPolledAt:     props.getProperty('lastPolledAt'),
    lastPollSummary:  props.getProperty('lastPollSummary')
  };
}

/**
 * Trace a single customer: return their customer-header row + every
 * tx row beneath it, with each tx row's col B cell note (containing
 * Source: <sheet>, week, row N + Link + Pricing + fingerprint).
 *
 * Lets the caller see where a customer's items actually came from
 * without hovering over cells in the editor.
 */
function _rtTraceCustomer_(params) {
  var email = String((params && params.email) || '').toLowerCase().trim();
  if (!email) return { ok: false, error: 'Missing &email=<addr>' };

  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { ok: true, found: false, rows: [] };

  var lastCol = 7;
  var allData = dash.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var allNotes = dash.getRange(2, 1, lastRow - 1, lastCol).getNotes();

  // Find the customer header row by exact email match in col B
  var customerIdx = -1;
  for (var i = 0; i < allData.length; i++) {
    var rowEmail = String(allData[i][1] || '').toLowerCase().trim();
    if (rowEmail === email) { customerIdx = i; break; }
  }
  if (customerIdx === -1) return { ok: true, found: false, email: email };

  var customerHeader = {
    sheetRow:     customerIdx + 2,
    name:         allData[customerIdx][0],
    email:        allData[customerIdx][1],
    phone:        allData[customerIdx][2],
    waiverOrigin: allData[customerIdx][3],
    students:     allData[customerIdx][4],
    profileCell:  allData[customerIdx][5],
    balanceCell:  allData[customerIdx][6],
    balanceNote:  allNotes[customerIdx][6] || ''
  };

  // Walk forward collecting tx rows until we hit another customer header
  // (col B contains '@' and is different from this email) OR end of data.
  var txRows = [];
  for (var j = customerIdx + 1; j < allData.length; j++) {
    var maybeEmail = String(allData[j][1] || '').toLowerCase().trim();
    if (maybeEmail.indexOf('@') !== -1 && maybeEmail !== email) break;
    // Skip sub-header row (col A = "DATE")
    if (String(allData[j][0] || '').toUpperCase() === 'DATE') continue;
    txRows.push({
      sheetRow:  j + 2,
      date:      allData[j][0],
      item:      allData[j][1],
      unitPrice: allData[j][2],
      days:      allData[j][3],
      weeks:     allData[j][4],
      total:     allData[j][5],
      status:    allData[j][6],
      itemNote:  allNotes[j][1] || ''
    });
  }

  return { ok: true, found: true, customer: customerHeader, txRows: txRows };
}

/**
 * Walk every tx row on the Dashboard and return ones whose col B
 * cell note's Source line mentions FREE Upper or FREE Lower.
 * Direct evidence of whether any free-camp items leaked past the
 * billable-sheet filter.
 */
function _rtTraceFreeCampSources_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0, leaked: [] };

  var data = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  var notes = dash.getRange(2, 2, lastRow - 1, 1).getNotes();
  var leaked = [];
  var currentEmail = '';

  for (var i = 0; i < data.length; i++) {
    var colB = String(data[i][1] || '');
    // Customer header row: col B is an email
    if (colB.indexOf('@') !== -1) {
      currentEmail = colB.toLowerCase().trim();
      continue;
    }
    // Sub-header row
    if (String(data[i][0] || '').toUpperCase() === 'DATE') continue;

    var note = String(notes[i][0] || '');
    // Match "Source: FREE Upper Campus" or "Source: FREE Lower Campus"
    // (case-insensitive)
    if (/Source:\s*FREE\s+(Upper|Lower)/i.test(note)) {
      var sourceMatch = note.match(/Source:\s*([^\n]+)/i);
      leaked.push({
        sheetRow:    i + 2,
        customerEmail: currentEmail,
        item:        colB,
        status:      data[i][6],
        total:       data[i][5],
        source:      sourceMatch ? sourceMatch[1].trim() : '(unparsed)'
      });
    }
  }

  return { ok: true, count: leaked.length, leaked: leaked };
}

/**
 * Walk every customer section on the Dashboard. Return ones whose
 * ONLY tx items are shirts (kind inferred from the Item label
 * starting with "<student>, T-Shirt"). Include each row's source
 * provenance from the col B cell note.
 *
 * These are the "phantom" registrations the user is concerned
 * about: parents whose form submission produced a shirt charge
 * with no actual camp-day enrollment.
 */
function _rtListShirtOnlyCustomers_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0, customers: [] };

  var data = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  var notes = dash.getRange(2, 2, lastRow - 1, 1).getNotes();

  // Group by customer. State machine: walking rows, accumulating tx
  // rows under the current customer.
  var customers = [];
  var currentCustomer = null;

  function pushCustomerIfShirtOnly(c) {
    if (!c || c.txRows.length === 0) return;
    var nonShirt = c.txRows.filter(function(r) {
      // Items look like "<student>, T-Shirt (Small) (Week)" for shirts.
      // Lunch items look like "<student>, Lunch: ...". Camp tuition
      // looks like "<student>, Camp Tuition (X days) (Week)". Etc.
      var label = String(r.item || '');
      return label.indexOf(', T-Shirt') === -1 && label.indexOf(', T‑Shirt') === -1;
    });
    if (nonShirt.length === 0) {
      customers.push(c);
    }
  }

  for (var i = 0; i < data.length; i++) {
    var colA = data[i][0];
    var colB = String(data[i][1] || '');
    var isCustomerHeader = colB.indexOf('@') !== -1;
    var isSubHeader = String(colA || '').toUpperCase() === 'DATE';

    if (isCustomerHeader) {
      pushCustomerIfShirtOnly(currentCustomer);
      currentCustomer = {
        sheetRow:    i + 2,
        email:       colB.toLowerCase().trim(),
        name:        String(data[i][0] || ''),
        students:    String(data[i][4] || ''),
        balance:     data[i][6],
        txRows:      []
      };
      continue;
    }
    if (isSubHeader) continue;
    if (!currentCustomer) continue;

    var note = String(notes[i][0] || '');
    var sourceMatch = note.match(/Source:\s*([^\n]+)/i);
    currentCustomer.txRows.push({
      sheetRow:  i + 2,
      item:      colB,
      unitPrice: data[i][2],
      days:      data[i][3],
      weeks:     data[i][4],
      total:     data[i][5],
      status:    data[i][6],
      source:    sourceMatch ? sourceMatch[1].trim() : ''
    });
  }
  pushCustomerIfShirtOnly(currentCustomer);

  // Tally by source-sheet label so the operator can see at a glance
  // whether they're paid or free
  var bySource = {};
  customers.forEach(function(c) {
    c.txRows.forEach(function(r) {
      var s = r.source.split(',')[0].trim() || '(no source)';
      bySource[s] = (bySource[s] || 0) + 1;
    });
  });

  return {
    ok: true,
    count: customers.length,
    bySourceSheet: bySource,
    customers: customers
  };
}

/**
 * Dump one row of a registration sheet. Useful for verifying what
 * the source row actually contains.
 * Params: &sheetId=<id>&tabName=<short-form like "6/22-6/26">&row=<N>
 */
function _rtDumpRegRow_(params) {
  var p = params || {};
  var sheetId = String(p.sheetId || '');
  var tabName = String(p.tabName || '');
  var row = Number(p.row || 0);
  if (!sheetId || !tabName || !row) {
    return { ok: false, error: 'Missing one of &sheetId=, &tabName=, &row=' };
  }
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    var tab = ss.getSheetByName(tabName);
    if (!tab) return { ok: false, error: 'Tab not found: ' + tabName, availableTabs: ss.getSheets().map(function(s){return s.getName();}) };
    var lastCol = tab.getLastColumn();
    var headers = tab.getRange(1, 1, 1, lastCol).getValues()[0];
    var values  = tab.getRange(row, 1, 1, lastCol).getValues()[0];
    var paired = {};
    for (var i = 0; i < headers.length; i++) {
      paired[String(headers[i] || ('col' + (i+1)))] = values[i] instanceof Date ? values[i].toISOString() : values[i];
    }
    return {
      ok: true,
      sheetId: sheetId,
      tabName: tabName,
      row: row,
      headers: headers,
      cells: paired
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Count unique parents, students, tx rows, and status pills on the
 * current Billing Dashboard.
 */
function _rtDashboardStats_() {
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { ok: true, uniqueCustomers: 0, uniqueStudents: 0, txRows: 0 };

  var data = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  var customers = {};
  var students = {};
  var txCount = 0;
  var statusCounts = {};
  var totalOwed = 0;

  for (var i = 0; i < data.length; i++) {
    var colA = data[i][0];
    var colB = String(data[i][1] || '');
    var isCustomerHeader = colB.indexOf('@') !== -1;
    var isSubHeader = String(colA || '').toUpperCase() === 'DATE';

    if (isCustomerHeader) {
      customers[colB.toLowerCase().trim()] = true;
      var studentStr = String(data[i][4] || '');
      studentStr.split(',').forEach(function(s) {
        var n = s.trim().toLowerCase();
        if (n) students[n] = true;
      });
    } else if (!isSubHeader) {
      txCount++;
      var status = String(data[i][6] || '').toLowerCase().trim();
      if (status) statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (status === 'owed') totalOwed += Number(data[i][5]) || 0;
    }
  }

  return {
    ok: true,
    uniqueCustomers: Object.keys(customers).length,
    uniqueStudents:  Object.keys(students).length,
    txRows:          txCount,
    statusCounts:    statusCounts,
    totalOwed:       Math.round(totalOwed * 100) / 100
  };
}

/**
 * Pull per-sheet stats from the source registration sheets after the
 * billable-sheet filter is applied. Useful for comparing against
 * dashboard counts and identifying drift.
 */
function _rtRegistrationStats_() {
  var sheets = bfsFilterBillable_(discoverRegistrationSheets_(), '[registrationStats]');
  var perSheet = [];
  var globalStudents = {};
  var globalParents = {};
  var globalDayZero = 0;

  sheets.forEach(function(reg) {
    try {
      var enrollments = (reg.type === 'after-school')
        ? readAfterSchoolEnrollments_(reg)
        : readRegistrationEnrollments_(reg);
      var sheetStudents = {};
      var sheetParents = {};
      var dayZeroCount = 0;
      enrollments.forEach(function(e) {
        var s = String(e.student || '').toLowerCase().trim();
        var p = String(e.email   || '').toLowerCase().trim();
        if (s) { sheetStudents[s] = true; globalStudents[s] = true; }
        if (p) { sheetParents[p]  = true; globalParents[p]  = true; }
        if ((Number(e.dayCount) || 0) === 0) dayZeroCount++;
      });
      perSheet.push({
        label: reg.label,
        type: reg.type,
        enrollments: enrollments.length,
        uniqueStudents: Object.keys(sheetStudents).length,
        uniqueParents:  Object.keys(sheetParents).length,
        dayZeroEnrollments: dayZeroCount
      });
      globalDayZero += dayZeroCount;
    } catch (e) {
      perSheet.push({ label: reg.label, error: String(e && e.message || e) });
    }
  });

  return {
    ok: true,
    billableSheetsCount: sheets.length,
    sheets: perSheet,
    globalUniqueStudents: Object.keys(globalStudents).length,
    globalUniqueParents:  Object.keys(globalParents).length,
    globalDayZeroEnrollments: globalDayZero
  };
}

/**
 * Append one row to the Manual Items tab. Convenience wrapper for
 * adding a manual line item from the CLI without opening the sheet.
 * Auto-bootstraps the tab if missing.
 *
 * Required: &email= &student= &label= &amount=
 * Optional: &applyTax=Yes (default No), &period=<free text>
 *
 * The next 5-min buildAllBilling run will pick the row up, mint a
 * UUID into col H, and write a priced row to the Dashboard.
 */
function _rtAddManualItem_(params) {
  var p = params || {};
  var email   = String(p.email   || '').trim();
  var student = String(p.student || '').trim();
  var label   = String(p.label   || '').trim();
  var amount  = Number(p.amount);
  var qty     = (p.qty === '' || p.qty === null || p.qty === undefined)
                  ? 1 : Number(p.qty);
  // Processing fee defaults to YES; explicit "No" disables. Sales tax
  // defaults to NO; explicit "Yes" enables. Same semantics as the sheet
  // column parsing in readManualItems_.
  var procRaw = String(p.applyProcessing || '').trim().toLowerCase();
  var applyProcessing = !(procRaw === 'no' || procRaw === 'n' || procRaw === 'false' || procRaw === '0');
  var applyTax = /^(yes|y|true|1)$/i.test(String(p.applyTax || '').trim());
  var period  = String(p.period  || '').trim();
  var statusRaw = String(p.status || '').trim().toLowerCase();
  var status = /^(owed|paid|canceled)$/.test(statusRaw) ? statusRaw : '';

  if (!email || email.indexOf('@') === -1) {
    return { ok: false, error: 'Missing or invalid &email=<addr>' };
  }
  if (!label) {
    return { ok: false, error: 'Missing &label=<item description>' };
  }
  if (!isFinite(amount) || amount === 0) {
    return { ok: false, error: 'Missing &amount=<non-zero number> (negative allowed for credits)' };
  }
  if (!isFinite(qty) || qty <= 0) {
    return { ok: false, error: 'Invalid &qty=<positive number>' };
  }
  if (!student) student = '(no student)';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(MANUAL_ITEMS_SHEET_NAME);
  if (!sh) {
    setupManualItemsTab();
    sh = ss.getSheetByName(MANUAL_ITEMS_SHEET_NAME);
  }

  var rowNum = sh.getLastRow() + 1;
  // ID (col K) left blank — readManualItems_ mints + writes it on first
  // sight so the fingerprint is anchored to a stable UUID across runs.
  sh.getRange(rowNum, 1, 1, 10).setValues([[
    email, student, label, amount, qty,
    applyProcessing ? 'Yes' : 'No',
    applyTax ? 'Yes' : 'No',
    period, new Date(), status
  ]]);

  // Opt-in dashboard refresh. The dialog passes &refresh=1 so the
  // operator sees the new row within ~10s instead of waiting up to
  // 5 min for the cron. CLI batch usage omits the flag.
  var refresh = /^(1|true|yes)$/i.test(String(p.refresh || ''));
  var refreshTriggerId = null;
  if (refresh) {
    try {
      var trigger = ScriptApp.newTrigger('buildAllBilling')
        .timeBased().after(10 * 1000).create();
      refreshTriggerId = trigger.getUniqueId();
    } catch (e) {
      Logger.log('[_rtAddManualItem_] refresh trigger failed: ' +
                 (e && e.message || e));
    }
  }

  return {
    ok: true,
    sheet: sh.getName(),
    row: rowNum,
    refreshTriggerId: refreshTriggerId,
    note: refreshTriggerId
      ? 'Row appended. Dashboard refreshes in ~10 seconds.'
      : 'Row appended. Next 5-min buildAllBilling will price it and add it to the Dashboard.',
    item: {
      email: email, student: student, label: label, amount: amount, qty: qty,
      applyProcessing: applyProcessing,
      applyTax: applyTax, period: period,
      initialStatus: status || 'owed'
    }
  };
}

/**
 * Return the first N canceled tx rows on the Dashboard along with
 * their col B note (source provenance + fingerprint) so the
 * operator can spot-check why something flipped from owed to
 * canceled.
 */
function _rtSampleCanceledRows_(params) {
  var n = Math.max(1, Math.min(50, Number((params && params.n) || 10)));
  var dash = getDashboardSheet();
  var lastRow = dash.getLastRow();
  if (lastRow < 2) return { ok: true, count: 0, rows: [] };

  var data = dash.getRange(2, 1, lastRow - 1, 7).getValues();
  var notes = dash.getRange(2, 2, lastRow - 1, 1).getNotes();
  var out = [];
  var currentEmail = '';
  for (var i = 0; i < data.length && out.length < n; i++) {
    var colB = String(data[i][1] || '');
    if (colB.indexOf('@') !== -1) { currentEmail = colB.toLowerCase().trim(); continue; }
    if (String(data[i][0] || '').toUpperCase() === 'DATE') continue;
    var status = String(data[i][6] || '').toLowerCase().trim();
    if (status !== 'canceled') continue;
    var note = String(notes[i][0] || '');
    var sourceMatch = note.match(/Source:\s*([^\n]+)/i);
    // Match fingerprint up to closing paren so multi-word fingerprints
    // aren't truncated at the first space (bug fix 2026-05-14).
    var fpMatch = note.match(/Internal ref:\s*([^)]+)\)/) || note.match(/Submission ID:\s*(\S+)/);
    out.push({
      sheetRow:      i + 2,
      customerEmail: currentEmail,
      item:          colB,
      total:         data[i][5],
      source:        sourceMatch ? sourceMatch[1].trim() : '',
      fingerprint:   fpMatch ? fpMatch[1].trim() : ''
    });
  }
  return { ok: true, count: out.length, rows: out };
}

function _rtJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
