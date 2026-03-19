(function () {

  var CONFIG_URL = 'https://raw.githubusercontent.com/demilio24/Websites/main/Nils/GHL/config.json';

  var _debug = false;

  function log() {
    if (_debug) console.log('[GHL-GUARD]', ...arguments);
  }

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  }

  function getCurrentUser() {
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

  function getLocationId(defaultId) {
    var locKeys = ['locationId', 'activeLocation', 'hl_location', 'currentLocation', 'location_id'];
    for (var i = 0; i < locKeys.length; i++) {
      var v = localStorage.getItem(locKeys[i]);
      if (v) { log('Found location via key "' + locKeys[i] + '":', v); return v; }
    }
    var userKeys = ['user', 'userData', 'hl_user', 'currentUser'];
    for (var j = 0; j < userKeys.length; j++) {
      try {
        var raw = localStorage.getItem(userKeys[j]);
        if (raw) {
          var parsed = JSON.parse(raw);
          var loc = parsed && (parsed.locationId || parsed.location_id || parsed.activeLocation);
          if (loc) { log('Found location inside user object:', loc); return loc; }
        }
      } catch (e) {}
    }
    log('Falling back to defaultLocationId from config:', defaultId);
    return defaultId;
  }

  function isAgencyPath(path) {
    return /^\/(v2\/)?agency(\/|$)/.test(path);
  }

  function lockdownAgencyUI() {
    var selectors = [
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
    ];

    function sweep() {
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          el.style.display = 'none';
          el.style.pointerEvents = 'none';
          el.setAttribute('aria-hidden', 'true');
          log('Hiding element:', sel);
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
    var whitelist = config.whitelist || [];
    var blacklist = config.blacklist || [];
    var defaultLocationId = config.defaultLocationId || '';

    if (user && blacklist.indexOf(user) !== -1) {
      log('User is blacklisted:', user);
      enforceRedirect(defaultLocationId);
      lockdownAgencyUI();
      return;
    }

    if (!user || whitelist.indexOf(user) === -1) {
      log('User not on whitelist:', user);
      enforceRedirect(defaultLocationId);
      lockdownAgencyUI();
      return;
    }

    log('User is whitelisted — full access granted:', user);
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
        console.warn('[GHL-GUARD] Could not load config, failing safe:', err);
        enforceRedirect('');
        lockdownAgencyUI();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
