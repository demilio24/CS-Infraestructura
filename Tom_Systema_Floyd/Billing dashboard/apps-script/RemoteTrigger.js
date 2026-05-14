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

  // Pricing tab maintenance
  setupPricingSheet:               'First-time bootstrap of Pricing tab from GHL form fields.',
  migratePricingSheetAddAliases:   'Add Aliases column to Pricing tab.',
  prettifyPricingSheet:            'Reformat Pricing tab into banded sections.',

  // Trigger management
  installBillingFromSheetsTrigger: '(Re)install 5-min buildAllBilling trigger.',
  installPollingTrigger:           '(Re)install 5-min pollFloridaSubmissions trigger.',
  installDailyHealthCheckTrigger:  '(Re)install daily dailyHealthCheck trigger.',

  // Diagnostics (read-only)
  debugQuotaState:                 'Dump effective user, triggers, last-poll info. Read-only.',
  tailLogs:                        'Return last N rows of the Logs sheet. Pass &n=<rows> (default 20). Use sync=1.',
  remoteTriggerStatus:             'Return current trigger inventory + last reconcile / nuclear summary. Read-only.',
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
    case 'setupPricingSheet':                return setupPricingSheet();
    case 'migratePricingSheetAddAliases':    return migratePricingSheetAddAliases();
    case 'prettifyPricingSheet':             return prettifyPricingSheet();
    case 'installBillingFromSheetsTrigger':  return installBillingFromSheetsTrigger();
    case 'installPollingTrigger':            return installPollingTrigger();
    case 'installDailyHealthCheckTrigger':   return installDailyHealthCheckTrigger();
    case 'debugQuotaState':                  return debugQuotaState();
    case 'tailLogs':                         return _rtTailLogs_(params);
    case 'remoteTriggerStatus':              return _rtStatus_();
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

function _rtJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
