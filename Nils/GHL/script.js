(function () {

  // ============================================================
  //  CONFIG SOURCE
  //  Edit config.json and push — no need to touch this script.
  //
  //  supportAccessList — clients who have been given agency admin
  //  solely to access HL's Help & Support widget. They get
  //  redirected to their sub-account and cannot see the agency
  //  dashboard. The support button stays visible for them.
  //
  //  Everyone NOT on this list with agency access sees the full
  //  agency dashboard as normal (your team, super admins, etc.)
  // ============================================================
  var CONFIG_URL = 'https://cdn.jsdelivr.net/gh/demilio24/Websites@main/Nils/GHL/config.json';

  // ============================================================
  //  INTERNALS
  // ============================================================

  var _debug = false;
  var _lockdownActive = false;
  var _safeUrl = '';

  console.log('[GHL-GUARD] script loaded');

  function log() {
    if (_debug) console.log('[GHL-GUARD]', ...arguments);
  }

  // ---- Agency path detection ----

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
  ];

  function isAgencyPath(path) {
    // Normalize — strip leading /v2 so both GHL domains match the same list
    var p = path.replace(/^\/v2/, '') || '/';
    for (var i = 0; i < AGENCY_PATHS.length; i++) {
      if (p === AGENCY_PATHS[i] || p.indexOf(AGENCY_PATHS[i] + '/') === 0) {
        return true;
      }
    }
    return false;
  }

  // ---- Override pushState/replaceState IMMEDIATELY ----
  // Flags are set later once config loads — this way we catch
  // GHL's client-side navigation from / → /agency_dashboard
  // even before the async config fetch resolves.

  var _origPush = history.pushState.bind(history);
  var _origReplace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    if (_lockdownActive && url && isAgencyPath(String(url))) {
      log('Blocked pushState to:', url, '→', _safeUrl);
      return _origPush(state, title, _safeUrl);
    }
    return _origPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    if (_lockdownActive && url && isAgencyPath(String(url))) {
      log('Blocked replaceState to:', url, '→', _safeUrl);
      return _origReplace(state, title, _safeUrl);
    }
    return _origReplace(state, title, url);
  };

  window.addEventListener('popstate', function () {
    if (_lockdownActive && isAgencyPath(window.location.pathname)) {
      log('popstate agency path — redirecting');
      window.location.replace(_safeUrl);
    }
  });

  // ---- Polling loop — catches anything that slipped through ----
  // Runs every 100ms for 10 seconds after lockdown activates,
  // then every 500ms indefinitely (handles slow React renders).

  var _pollCount = 0;

  function startPolling() {
    var fast = setInterval(function () {
      if (_lockdownActive && isAgencyPath(window.location.pathname)) {
        log('Poll caught agency path — redirecting');
        window.location.replace(_safeUrl);
      }
      _pollCount++;
      if (_pollCount >= 100) { // 10 seconds of fast polling
        clearInterval(fast);
        setInterval(function () {
          if (_lockdownActive && isAgencyPath(window.location.pathname)) {
            log('Slow-poll caught agency path — redirecting');
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
        document.querySelectorAll(sel).forEach(function (el) {
          el.style.display = 'none';
          el.style.pointerEvents = 'none';
          el.setAttribute('aria-hidden', 'true');
        });
      });
      document.querySelectorAll('a').forEach(function (el) {
        var href = el.getAttribute('href') || '';
        if (href.indexOf('/agency') !== -1) {
          el.style.display = 'none';
          el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
        }
      });
    }

    sweep();
    var observer = new MutationObserver(sweep);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---- Lockdown activation ----

  function activateLockdown(locationId) {
    var locId = getLocationId(locationId);
    _safeUrl = '/location/' + locId + '/dashboard';
    _lockdownActive = true;
    log('Lockdown active — safe URL:', _safeUrl);

    // Redirect immediately if already on an agency path
    if (isAgencyPath(window.location.pathname)) {
      log('Currently on agency path — hard redirecting');
      window.location.replace(_safeUrl);
      return;
    }

    lockdownAgencyUI();
    startPolling();
  }

  // ---- Main ----

  function applyLockdown(config, user) {
    var supportAccessList = config.supportAccessList || [];
    var entry = null;
    for (var i = 0; i < supportAccessList.length; i++) {
      if (supportAccessList[i].email === user) {
        entry = supportAccessList[i];
        break;
      }
    }

    if (entry) {
      log('Client on supportAccessList — activating lockdown, locationId:', entry.locationId);
      activateLockdown(entry.locationId);
      return;
    }

    log('User not on supportAccessList — full agency access:', user);
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
