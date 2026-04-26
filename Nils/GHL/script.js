(function () {

  // ============================================================
  //  CONFIG SOURCE
  //  Edit config.json and push — no need to touch this script.
  //
  //  supportAccessList — clients given agency admin solely to
  //  access HL's Help & Support widget. Redirected to their
  //  sub-account, cannot see the agency dashboard. Support
  //  button stays visible for them.
  //
  //  aiAccessList — agency users given agency admin solely to
  //  access the Ask AI feature. Same lockdown as supportAccessList
  //  (no agency dashboard, redirected to sub-account) AND the
  //  Help & Support widget is hidden entirely.
  //
  //  If a user appears on both lists, aiAccessList wins (more
  //  restrictive). Everyone NOT on either list with agency
  //  access sees the full agency dashboard as normal.
  //
  //  Schema: each entry is { email, locationId } or
  //  { email, locationIds: [...] }. To grant a user access to
  //  multiple sub-accounts, use locationIds OR add multiple
  //  entries with the same email — both are unioned. The first
  //  ID is used as the redirect target when they hit a blocked
  //  path.
  //
  //  Lockdown logic: PRIMARY check is a whitelist — the URL
  //  must be inside one of the user's allowed locations
  //  (/v2/location/{id}/...). Anything else is blocked.
  //  AGENCY_PATHS is kept as a SECONDARY explicit blacklist
  //  for documentation of known agency routes.
  // ============================================================
  var CONFIG_URL = 'https://cdn.jsdelivr.net/gh/demilio24/Websites@main/Nils/GHL/config.json';

  // ============================================================
  //  DOMAIN REDIRECT — app.gohighlevel.com → app.nilsdigital.com
  //  Applies to ALL users before anything else runs.
  // ============================================================
  if (window.location.hostname === 'app.gohighlevel.com') {
    window.location.replace(
      'https://app.nilsdigital.com' + window.location.pathname + window.location.search + window.location.hash
    );
    return; // Stop executing the rest of the script
  }

  // ============================================================
  //  INTERNALS
  // ============================================================

  var _debug = false;
  var _lockdownActive = false;
  var _safeUrl = '';
  var _allowedIds = [];

  console.log('[GHL-GUARD] script loaded');

  function log() {
    if (_debug) console.log('[GHL-GUARD]', ...arguments);
  }

  // ---- Path-block detection ----
  //
  // PRIMARY: whitelist by location ID. The user is only allowed
  // inside /v2/location/{id}/... where id is one of their allowed
  // locations. Everything else gets bounced to _safeUrl.
  //
  // SECONDARY: AGENCY_PATHS — explicit list of known agency-only
  // routes. Kept as documentation of the routes we care about
  // even though the primary whitelist already covers them.

  var AGENCY_PATHS = [
    '/agency_dashboard',
    '/prospecting',
    '/accounts',
    '/snapshots',
    '/reselling',
    '/marketplace',
    '/affiliate_portal',
    '/template-library-admin',
    '/partners',
    '/university',
    '/saas_education',
    '/mobile-app-customiser',
    '/integration',
    '/offers',
  ];

  function isInAllowedLocation(path) {
    // Normalize — strip leading /v2 so both GHL domains match
    var p = path.replace(/^\/v2/, '') || '/';
    for (var i = 0; i < _allowedIds.length; i++) {
      var prefix = '/location/' + _allowedIds[i];
      if (p === prefix || p.indexOf(prefix + '/') === 0) return true;
    }
    return false;
  }

  function isBlocked(path) {
    if (_allowedIds.length === 0) return false; // safety: no IDs means no lockdown
    return !isInAllowedLocation(path);
  }

  // ---- Override pushState/replaceState IMMEDIATELY ----
  // Flags are set later once config loads — this way we catch
  // GHL's client-side navigation from / → /agency_dashboard
  // even before the async config fetch resolves.

  var _origPush = history.pushState.bind(history);
  var _origReplace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    if (_lockdownActive && url && isBlocked(String(url))) {
      log('Blocked pushState to:', url, '→', _safeUrl);
      return _origPush(state, title, _safeUrl);
    }
    return _origPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    if (_lockdownActive && url && isBlocked(String(url))) {
      log('Blocked replaceState to:', url, '→', _safeUrl);
      return _origReplace(state, title, _safeUrl);
    }
    return _origReplace(state, title, url);
  };

  window.addEventListener('popstate', function () {
    if (_lockdownActive && isBlocked(window.location.pathname)) {
      log('popstate blocked path — redirecting');
      window.location.replace(_safeUrl);
    }
  });

  // ---- Polling loop — catches anything that slipped through ----
  // Runs every 100ms for 10 seconds after lockdown activates,
  // then every 500ms indefinitely (handles slow React renders).

  var _pollCount = 0;

  function startPolling() {
    var fast = setInterval(function () {
      if (_lockdownActive && isBlocked(window.location.pathname)) {
        log('Poll caught blocked path — redirecting');
        window.location.replace(_safeUrl);
      }
      _pollCount++;
      if (_pollCount >= 100) { // 10 seconds of fast polling
        clearInterval(fast);
        setInterval(function () {
          if (_lockdownActive && isBlocked(window.location.pathname)) {
            log('Slow-poll caught blocked path — redirecting');
            window.location.replace(_safeUrl);
          }
        }, 500);
      }
    }, 100);
  }

  // ---- User identification ----

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  }

  function getCurrentUser() {
    // Confirmed GHL white-label localStorage keys
    var directKeys = ['themegen_user_email', 'allow_subaccount'];
    for (var d = 0; d < directKeys.length; d++) {
      var direct = localStorage.getItem(directKeys[d]);
      if (direct && direct.indexOf('@') !== -1) {
        log('Found user via direct key "' + directKeys[d] + '":', direct);
        return direct.trim();
      }
    }
    var objKeys = ['user', 'userData', 'hl_user', 'auth_user', 'currentUser', 'ghl_user', 'logged_user'];
    for (var i = 0; i < objKeys.length; i++) {
      try {
        var raw = localStorage.getItem(objKeys[i]);
        if (raw) {
          var parsed = JSON.parse(raw);
          var id = parsed && (parsed.email || parsed.userId || parsed.id || parsed.user_id);
          if (id) { log('Found user via key "' + objKeys[i] + '":', id); return id; }
        }
      } catch (e) {}
    }
    var tokenKeys = ['access_token', 'token', 'id_token', 'jwt', 'hl_token', 'authToken'];
    for (var j = 0; j < tokenKeys.length; j++) {
      var t = localStorage.getItem(tokenKeys[j]);
      if (t && t.indexOf('.') !== -1) {
        var payload = parseJwt(t);
        var id2 = payload && (payload.email || payload.sub || payload.userId);
        if (id2) { log('Found user via JWT key "' + tokenKeys[j] + '":', id2); return id2; }
      }
    }
    for (var k = 0; k < localStorage.length; k++) {
      var key = localStorage.key(k);
      try {
        var val = JSON.parse(localStorage.getItem(key));
        if (val && typeof val === 'object' && (val.email || val.userId)) {
          var found = val.email || val.userId;
          log('Found user via brute-force key "' + key + '":', found);
          return found;
        }
      } catch (e) {}
    }
    log('Could not identify current user');
    return null;
  }

  function getLocationId(configuredId) {
    if (configuredId) { log('Using locationId from config:', configuredId); return configuredId; }
    var locKeys = ['locationId', 'activeLocation', 'hl_location', 'currentLocation', 'location_id'];
    for (var i = 0; i < locKeys.length; i++) {
      var v = localStorage.getItem(locKeys[i]);
      if (v) { log('Found location via localStorage key "' + locKeys[i] + '":', v); return v; }
    }
    log('Could not determine locationId');
    return '';
  }

  // ---- UI lockdown ----

  function lockdownAgencyUI() {
    var selectors = [
      // Hide individual help items — leaves avatar + Zoom/Chat/Ticket buttons visible
      // The buttons are in div.!p-5, NOT in .help-section, so they're unaffected
      '#help-drawer .help-section',
      '#switcher-agency-switch',
      '#switcher-agency-switch .cursor-pointer',
      '[data-testid="switch-to-agency"]',
      '[data-testid="agency-switch"]',
      'button[class*="agencySwitch"]',
      'button[class*="agency-switch"]',
      'a[href*="/agency/"]',
      'a[href*="/v2/agency/"]',
      '[class*="switchAgency"]',
      '[class*="switch-agency"]',
      '[id*="agency-view"]',
      '[id*="agencyView"]',
      '[id*="switcher-agency"]',
    ];

    function sweep() {
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(hideEl);
      });
      document.querySelectorAll('a').forEach(function (el) {
        var href = el.getAttribute('href') || '';
        if (href.indexOf('/agency') !== -1) {
          hideEl(el);
          el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
        }
      });
    }

    sweep();
    var observer = new MutationObserver(sweep);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---- Hard-hide helper ----
  // Inline styles lose to GHL's !important rules unless we use
  // !important ourselves. setProperty(..., 'important') is the
  // only reliable way to set !important from JS.

  function hideEl(el) {
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.setAttribute('aria-hidden', 'true');
  }

  // ---- Hide HL Help & Support widget entirely ----
  // Used for aiAccessList users who shouldn't see the support
  // button at all. Targets the drawer, the question-mark trigger,
  // and any chat/launcher widgets HL may swap in.

  function hideSupportUI() {
    var supportSelectors = [
      // HL native help drawer + trigger
      '#hl_header--help-icon',
      '#hl_header--copilot-icon svg',
      '#canny_logs-toggle',
      '#help-drawer',
      '[id*="help-drawer"]',
      '[id*="help-button"]',
      '[id*="help-trigger"]',
      '[class*="help-trigger"]',
      '[class*="HelpTrigger"]',
      '[class*="HelpButton"]',
      '[class*="help-button"]',
      '[data-testid*="help-button"]',
      '[data-testid*="help-trigger"]',
      '[data-testid*="support-button"]',
      '[aria-label="Help"]',
      '[aria-label="Support"]',
      '[aria-label="Help & Support"]',
      // The green vertical "Support" tab GHL embeds (and similar)
      '[id*="support"]',
      '[class*="support-tab"]',
      '[class*="SupportTab"]',
      '[class*="support-button"]',
      '[class*="supportButton"]',
      '[class*="support-widget"]',
      '[class*="SupportWidget"]',
      // Common third-party chat/support launchers
      '#launcher',
      '#crisp-chatbox',
      '.crisp-client',
      '#beacon-container',
      '.BeaconContainer',
      '#chat-widget-container',
      '#drift-frame-controller',
      'iframe[id*="intercom"]',
      'iframe[name*="intercom"]',
      '[class*="intercom-launcher"]',
      'iframe[id*="drift"]',
      'iframe[id*="livechat"]',
      'iframe[id*="front-chat"]',
      'iframe[title="Help"]',
      'iframe[title="Support"]',
      'iframe[title*="chat" i]',
    ];

    function sweep() {
      supportSelectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(hideEl);
      });
    }

    sweep();
    var observer = new MutationObserver(sweep);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---- Lockdown activation ----

  function activateLockdown(allowedIds, hideSupport, safePath) {
    // Filter empty/falsy and de-dupe
    var ids = [];
    (allowedIds || []).forEach(function (id) {
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });

    // Fallback to localStorage if config didn't provide any
    if (ids.length === 0) {
      var fallback = getLocationId('');
      if (fallback) ids.push(fallback);
    }

    if (ids.length === 0) {
      log('No location IDs available — cannot activate lockdown');
      return;
    }

    _allowedIds = ids;
    _safeUrl = safePath || ('/location/' + ids[0] + '/dashboard');
    _lockdownActive = true;
    log('Lockdown active — allowed IDs:', ids, '— safe URL:', _safeUrl, '— hideSupport:', !!hideSupport);

    // Redirect immediately if currently on a blocked path
    if (isBlocked(window.location.pathname)) {
      log('Currently on blocked path — hard redirecting');
      window.location.replace(_safeUrl);
      return;
    }

    lockdownAgencyUI();
    if (hideSupport) hideSupportUI();
    startPolling();
  }

  // ---- Main ----

  // Collect all IDs across every entry on `list` matching `user`.
  // Supports both schema variants:
  //   { email, locationId: "x" }
  //   { email, locationIds: ["x", "y"] }
  // Multiple entries with the same email are unioned together.
  function collectIdsForUser(list, user) {
    var ids = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.email || e.email.toLowerCase() !== user.toLowerCase()) continue;
      if (Array.isArray(e.locationIds)) {
        e.locationIds.forEach(function (id) { if (id && ids.indexOf(id) === -1) ids.push(id); });
      } else if (e.locationId && ids.indexOf(e.locationId) === -1) {
        ids.push(e.locationId);
      }
    }
    return ids;
  }

  function applyLockdown(config, user) {
    var aiAccessList = config.aiAccessList || [];
    var supportAccessList = config.supportAccessList || [];

    // aiAccessList takes precedence — more restrictive (hides support too)
    var aiIds = collectIdsForUser(aiAccessList, user);
    if (aiIds.length > 0) {
      var aiPath = '/v2/location/' + aiIds[0] + '/ask-ai';
      log('User on aiAccessList — activating lockdown + hiding support, IDs:', aiIds, 'redirect to:', aiPath);
      activateLockdown(aiIds, true, aiPath);
      return;
    }

    var supportIds = collectIdsForUser(supportAccessList, user);
    if (supportIds.length > 0) {
      log('Client on supportAccessList — activating lockdown, IDs:', supportIds);
      activateLockdown(supportIds, false);
      return;
    }

    log('User not on any access list — full agency access:', user);
  }

  function init() {
    fetch(CONFIG_URL + '?t=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (config) {
        _debug = !!config.debug;
        log('Config loaded:', config);

        var user = getCurrentUser();

        if (!user) {
          setTimeout(function () {
            applyLockdown(config, getCurrentUser());
          }, 1200);
          return;
        }

        applyLockdown(config, user);
      })
      .catch(function (err) {
        console.warn('[GHL-GUARD] Could not load config:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
