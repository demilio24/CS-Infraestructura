/*  Systema Floyd — shared auth module
    Loaded by every dashboard page before the page's own <script>. */

const SF_AUTH = (() => {
  const SUPABASE_URL  = 'https://nroeiabeirifurdaybyo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2VpYWJlaXJpZnVyZGF5YnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDc2MjgsImV4cCI6MjA2NzE4MzYyOH0.ic9QulLj2JmKepFg3WlA6ux2urUwQFoNDrfK5b5Fh-M';
  const REQUIRE_LOGIN = false;

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  let _session = null;
  let _profile = null;

  async function fetchProfile() {
    const { data, error } = await sb.rpc('sf_get_my_profile');
    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  async function signInWithMagicLink(email) {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });
    return { error };
  }

  async function signInWithPassword(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    await sb.auth.signOut();
    _session = null;
    _profile = null;
    window.location.reload();
  }

  function renderLoginCard(container) {
    container.innerHTML = `
      <div class="auth-backdrop" id="auth-backdrop">
        <div class="auth-card">
          <div class="auth-brand">
            <img src="https://assets.cdn.filesafe.space/8IWtNFlmgJ8bif9DivHT/media/5d66f583-c02a-4140-91aa-5f3362ec9b01.png" alt="Systema Floyd" style="height:48px" />
            <span class="auth-title">Staff Login</span>
          </div>
          <div class="auth-tabs" role="tablist">
            <button type="button" class="auth-tab active" data-auth-tab="magic" role="tab" aria-selected="true">Magic Link</button>
            <button type="button" class="auth-tab" data-auth-tab="password" role="tab" aria-selected="false">Password</button>
          </div>
          <form class="auth-form" id="auth-form-magic">
            <label class="auth-label">Email
              <input type="email" class="auth-input" id="auth-email-magic" required autocomplete="email" placeholder="you@example.com" />
            </label>
            <button type="submit" class="auth-submit">Send login link</button>
          </form>
          <form class="auth-form" id="auth-form-password" hidden>
            <label class="auth-label">Email
              <input type="email" class="auth-input" id="auth-email-pw" required autocomplete="email" placeholder="you@example.com" />
            </label>
            <label class="auth-label">Password
              <input type="password" class="auth-input" id="auth-pw" required autocomplete="current-password" placeholder="Your password" />
            </label>
            <button type="submit" class="auth-submit">Sign in</button>
          </form>
          <div class="auth-feedback" id="auth-feedback"></div>
          ${REQUIRE_LOGIN ? '' : '<button type="button" class="auth-skip" id="auth-skip">Continue without signing in</button>'}
        </div>
      </div>`;

    container.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.auth-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected','true');
        const mode = tab.dataset.authTab;
        document.getElementById('auth-form-magic').hidden  = mode !== 'magic';
        document.getElementById('auth-form-password').hidden = mode !== 'password';
        document.getElementById('auth-feedback').textContent = '';
      });
    });

    document.getElementById('auth-form-magic').addEventListener('submit', async e => {
      e.preventDefault();
      const fb = document.getElementById('auth-feedback');
      const email = document.getElementById('auth-email-magic').value.trim();
      fb.className = 'auth-feedback';
      fb.textContent = 'Sending...';
      const { error } = await signInWithMagicLink(email);
      if (error) { fb.className = 'auth-feedback error'; fb.textContent = error.message; }
      else { fb.className = 'auth-feedback success'; fb.textContent = 'Check your email for the login link.'; }
    });

    document.getElementById('auth-form-password').addEventListener('submit', async e => {
      e.preventDefault();
      const fb = document.getElementById('auth-feedback');
      const email = document.getElementById('auth-email-pw').value.trim();
      const pw    = document.getElementById('auth-pw').value;
      fb.className = 'auth-feedback';
      fb.textContent = 'Signing in...';
      const { error } = await signInWithPassword(email, pw);
      if (error) { fb.className = 'auth-feedback error'; fb.textContent = error.message; }
      else { window.location.reload(); }
    });

    const skipBtn = document.getElementById('auth-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        container.innerHTML = '';
      });
    }
  }

  function renderUserArea(container) {
    if (!_profile) {
      container.innerHTML = '<button type="button" class="auth-signin-btn" id="auth-signin-btn">Sign in</button>';
      document.getElementById('auth-signin-btn').addEventListener('click', () => {
        const cardEl = document.getElementById('auth-card-root');
        if (cardEl && !cardEl.querySelector('.auth-backdrop')) renderLoginCard(cardEl);
      });
      return;
    }
    const badge = _profile.role === 'super_admin'
      ? '<span class="auth-badge admin">Admin</span>'
      : '<span class="auth-badge staff">Staff</span>';
    container.innerHTML = `
      <span class="auth-user-name">${_profile.display_name}</span>
      ${badge}
      <button type="button" class="auth-signout-btn" id="auth-signout-btn">Sign out</button>`;
    document.getElementById('auth-signout-btn').addEventListener('click', signOut);
  }

  function renderStaffNavLink() {
    if (!_profile || _profile.role !== 'super_admin') return;
    const pagesGroup = document.querySelector('.dash-nav .nav-group');
    if (!pagesGroup) return;
    if (pagesGroup.querySelector('[href="./staff.html"]')) return;
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = './staff.html';
    link.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Staff';
    if (window.location.pathname.endsWith('staff.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    pagesGroup.appendChild(link);
  }

  function checkPageAccess(pageSlug) {
    if (!_session) return true;
    if (!_profile) return false;
    if (!_profile.is_active) return false;
    if (_profile.role === 'super_admin') return true;
    return _profile.allowed_pages.includes(pageSlug);
  }

  function showAccessDenied() {
    const main = document.querySelector('main.dash');
    if (!main) return;
    main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px"><div><h2 style="font-size:22px;margin-bottom:12px">Access Restricted</h2><p style="color:var(--sf-ink-50);margin-bottom:20px">You don\'t have access to this page. Contact your administrator.</p><a href="./" style="color:var(--sf-blue-700);font-weight:600;text-decoration:underline">Go to Registrations</a></div></div>';
  }

  function showDeactivated() {
    const main = document.querySelector('main.dash');
    if (!main) return;
    main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px"><div><h2 style="font-size:22px;margin-bottom:12px">Account Deactivated</h2><p style="color:var(--sf-ink-50);margin-bottom:20px">Your account has been deactivated. Contact your administrator.</p><button type="button" onclick="SF_AUTH.signOut()" style="color:var(--sf-blue-700);font-weight:600;text-decoration:underline;border:none;background:none;cursor:pointer;font-size:15px">Sign out</button></div></div>';
  }

  async function init(pageSlug) {
    const { data: { session } } = await sb.auth.getSession();
    _session = session;

    if (_session) {
      _profile = await fetchProfile();
    }

    const userArea = document.getElementById('user-area');
    if (userArea) renderUserArea(userArea);

    renderStaffNavLink();

    if (!_session) {
      if (REQUIRE_LOGIN) {
        const cardEl = document.getElementById('auth-card-root');
        if (cardEl) renderLoginCard(cardEl);
        const main = document.querySelector('main.dash');
        if (main) main.style.display = 'none';
      }
      return { session: null, profile: null };
    }

    if (_profile && !_profile.is_active) {
      showDeactivated();
      return { session: _session, profile: _profile };
    }

    if (!checkPageAccess(pageSlug)) {
      showAccessDenied();
      return { session: _session, profile: _profile };
    }

    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') window.location.reload();
    });

    return { session: _session, profile: _profile };
  }

  return {
    init,
    get session() { return _session; },
    get profile() { return _profile; },
    get supabase() { return sb; },
    get markedBy() { return _profile ? _profile.display_name : null; },
    signOut,
    renderLoginCard,
    REQUIRE_LOGIN,
  };
})();
