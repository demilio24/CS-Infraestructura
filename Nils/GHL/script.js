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

  console.log('[GHL-GUARD] script loaded');

  function log() {
    if (_debug) console.log('[GHL-GUARD]', ...arguments);
  }

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  }

  function getCurrentUser() {
    // Check confirmed GHL white-label localStorage key first
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
    // Always prefer the location ID we explicitly set for this client in config
    if (configuredId) { log('Using locationId from config:', configuredId); return configuredId; }
    // Fallback: try to read it from localStorage
    var locKeys = ['locationId', 'activeLocation', 'hl_location', 'currentLocation', 'location_id'];
    for (var i = 0; i < locKeys.length; i++) {
      var v = localStorage.getItem(locKeys[i]);
      if (v) { log('Found location via localStorage key "' + locKeys[i] + '":', v); return v; }
    }
    log('Could not determine locationId');
    return '';
  }

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
    for (var i = 0; i < AGENCY_PATHS.length; i++) {
      if (path === AGENCY_PATHS[i] || path.indexOf(AGENCY_PATHS[i] + '/') === 0) {
        return true;
      }
    }
    return false;
  }

  // Hide agency navigation only — support button intentionally left visible
  function lockdownAgencyUI() {
    var selectors = [
      // Confirmed GHL selector for "Back to Agency" switcher
      '#switcher-agency-switch',
      '#switcher-agency-switch .cursor-pointer',
      // Broader fallbacks
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
          log('Hiding agency element:', sel);
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

  function enforceRedirect(defaultLocationId) {
    var locId = getLocationId(defaultLocationId);
    var safeUrl = '/location/' + locId + '/dashboard';

    var _push = history.pushState.bind(history);
    var _replace = history.replaceState.bind(history);

    function guardUrl(fn) {
      return function (state, title, url) {
        if (url && isAgencyPath(String(url))) {
          log('Blocked navigation to:', url, '→', safeUrl);
          return fn(state, title, safeUrl);
        }
        return fn(state, title, url);
      };
    }

    history.pushState = guardUrl(_push);
    history.replaceState = guardUrl(_replace);

    window.addEventListener('popstate', function () {
      if (isAgencyPath(window.location.pathname)) {
        log('popstate agency path — redirecting');
        window.location.replace(safeUrl);
      }
    });

    if (isAgencyPath(window.location.pathname)) {
      log('Initial agency load — hard redirecting to', safeUrl);
      window.location.replace(safeUrl);
    }
  }

  function applyLockdown(config, user) {
    var supportAccessList = config.supportAccessList || [];

    // Find this user's entry in the list
    var entry = null;
    for (var i = 0; i < supportAccessList.length; i++) {
      if (supportAccessList[i].email === user) {
        entry = supportAccessList[i];
        break;
      }
    }

    if (entry) {
      // Client on support access list — redirect to their sub-account,
      // hide agency nav, but leave the Help & Support button alone
      log('Client on supportAccessList — blocking agency view, redirecting to:', entry.locationId);
      enforceRedirect(entry.locationId);
      lockdownAgencyUI();
      return;
    }

    // Not on the list — full agency access, do nothing
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
        // If config fails to load, do nothing — fail open for agency admins
        console.warn('[GHL-GUARD] Could not load config:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
