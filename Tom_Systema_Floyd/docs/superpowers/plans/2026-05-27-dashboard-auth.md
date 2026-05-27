# Dashboard Auth & Staff Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth login, staff management, and page-level permissions to the Systema Floyd dashboard.

**Architecture:** Supabase Auth handles identity (magic link + password). A custom `sf_staff` table stores role and page permissions per user, linked 1:1 to `auth.users`. A shared `auth.js` module loaded by all dashboard pages manages sessions, profiles, and permission checks. A new `staff.html` page lets super admins manage users. The system ships with `REQUIRE_LOGIN = false` (public access preserved).

**Tech Stack:** Supabase Auth (built-in), Supabase JS v2 (CDN), Postgres RPCs, vanilla HTML/CSS/JS (matching existing dashboard style).

**Spec:** `docs/superpowers/specs/2026-05-27-dashboard-auth-design.md`

**Supabase project:** `nroeiabeirifurdaybyo`
**Dashboard dir:** `Tom_Systema_Floyd/dashboard/`
**Existing pages:** `index.html` (3764 lines), `lunches.html`, `free-camp.html`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `dashboard/auth.js` | Create | Shared auth module: Supabase client init, session lifecycle, profile fetch, login/logout helpers, permission checks, login card rendering, header user area rendering |
| `dashboard/staff.html` | Create | Staff management page: table of all staff, add/edit/deactivate UI |
| `dashboard/index.html` | Modify | Load `auth.js`, add `#auth-card` container + `#user-area` container in header, wire `marked_by`, add Staff nav link |
| `dashboard/lunches.html` | Modify | Load `auth.js`, add `#auth-card` container + `#user-area` container in header, add Staff nav link |
| `dashboard/free-camp.html` | Modify | Load `auth.js`, add `#auth-card` container + `#user-area` container in header, add Staff nav link |
| Supabase migration | Apply | `sf_staff` table, auto-create trigger, 5 RPCs, seed Emilio |

---

## Task 1: Supabase Migration — sf_staff table, trigger, RPCs, seed

**Files:**
- Supabase project `nroeiabeirifurdaybyo` (apply via MCP `apply_migration`)

This task creates the entire database layer. No frontend changes yet.

- [ ] **Step 1: Apply the migration**

Use the Supabase MCP `apply_migration` tool with name `add_sf_staff_auth` and this SQL:

```sql
-- ═══ sf_staff table ═══
CREATE TABLE IF NOT EXISTS public.sf_staff (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text UNIQUE NOT NULL,
  display_name text NOT NULL,
  role         text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'staff')),
  allowed_pages text[] NOT NULL DEFAULT '{}',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_sf_staff_email ON public.sf_staff(email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.sf_staff_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sf_staff_updated_at ON public.sf_staff;
CREATE TRIGGER trg_sf_staff_updated_at
  BEFORE UPDATE ON public.sf_staff
  FOR EACH ROW EXECUTE FUNCTION public.sf_staff_set_updated_at();

-- ═══ Auto-create sf_staff row when auth.users row is inserted ═══
CREATE OR REPLACE FUNCTION public.sf_handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.sf_staff (id, email, display_name, role, allowed_pages, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1),
    'staff',
    '{}',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sf_handle_new_user();

-- ═══ RPC: sf_get_my_profile ═══
CREATE OR REPLACE FUNCTION public.sf_get_my_profile()
RETURNS SETOF public.sf_staff
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM public.sf_staff WHERE id = auth.uid();
$$;

-- ═══ RPC: sf_get_staff (super_admin only) ═══
CREATE OR REPLACE FUNCTION public.sf_get_staff()
RETURNS SETOF public.sf_staff
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sf_staff
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.sf_staff ORDER BY created_at;
END;
$$;

-- ═══ RPC: sf_upsert_staff (super_admin only) ═══
CREATE OR REPLACE FUNCTION public.sf_upsert_staff(
  p_email        text,
  p_display_name text,
  p_role         text DEFAULT 'staff',
  p_allowed_pages text[] DEFAULT '{}'
)
RETURNS SETOF public.sf_staff
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  target_row public.sf_staff;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sf_staff
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  IF p_role NOT IN ('super_admin', 'staff') THEN
    RAISE EXCEPTION 'role must be super_admin or staff, got %', p_role;
  END IF;
  UPDATE public.sf_staff SET
    display_name  = p_display_name,
    role          = p_role,
    allowed_pages = p_allowed_pages,
    email         = p_email
  WHERE email = p_email
  RETURNING * INTO target_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No sf_staff row for email %. Invite the user first so the trigger creates their row.', p_email;
  END IF;
  RETURN NEXT target_row;
END;
$$;

-- ═══ RPC: sf_deactivate_staff (super_admin only) ═══
CREATE OR REPLACE FUNCTION public.sf_deactivate_staff(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sf_staff
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot deactivate yourself';
  END IF;
  UPDATE public.sf_staff SET is_active = false WHERE id = p_user_id;
END;
$$;

-- ═══ RPC: sf_reactivate_staff (super_admin only) ═══
CREATE OR REPLACE FUNCTION public.sf_reactivate_staff(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sf_staff
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;
  UPDATE public.sf_staff SET is_active = true WHERE id = p_user_id;
END;
$$;
```

- [ ] **Step 2: Verify the table and RPCs exist**

Run via Supabase MCP `execute_sql`:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'sf_staff' ORDER BY ordinal_position;
```

Expected: 8 columns (id, email, display_name, role, allowed_pages, is_active, created_at, updated_at).

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('sf_get_my_profile','sf_get_staff','sf_upsert_staff','sf_deactivate_staff','sf_reactivate_staff','sf_handle_new_user','sf_staff_set_updated_at');
```

Expected: 7 rows.

- [ ] **Step 3: Create Emilio's auth user and seed sf_staff row**

Use Supabase MCP to create the super admin auth user. The trigger will auto-create the sf_staff row. Then update it to super_admin:

```sql
-- The trigger already created the sf_staff row with role='staff'.
-- Update it to super_admin with full page access.
-- (The auth user for emilio@nilsdigital.com must be created first via
--  the Supabase dashboard or supabase.auth.admin.createUser in a script.)
```

Since we can't call `auth.admin.createUser()` from SQL, do this from the browser console or via the dashboard JS after Task 2 is deployed. For now, run a manual sign-up:

Use Supabase MCP `execute_sql` to check if the user exists after sign-up, then update:

```sql
UPDATE public.sf_staff
SET role = 'super_admin',
    display_name = 'Emilio',
    allowed_pages = ARRAY['registrations', 'lunches', 'free-camp', 'staff']
WHERE email = 'emilio@nilsdigital.com';
```

- [ ] **Step 4: Commit**

```bash
git add Tom_Systema_Floyd/docs/
git commit -m "feat(floyd): add sf_staff table, trigger, and 5 auth RPCs to Supabase

Migration applied to nroeiabeirifurdaybyo. Creates sf_staff table linked to
auth.users, auto-create trigger, and RPCs for profile/staff management."
```

---

## Task 2: Create shared auth.js module

**Files:**
- Create: `dashboard/auth.js`

This is the core auth module loaded by every dashboard page. It handles: Supabase client initialization, session check, profile fetch, login/logout, login card rendering, header user area rendering, and page permission gating.

- [ ] **Step 1: Create `dashboard/auth.js`**

```javascript
/*  Systema Floyd — shared auth module
    Loaded by every dashboard page before the page's own <script>. */

const SF_AUTH = (() => {
  const SUPABASE_URL  = 'https://nroeiabeirifurdaybyo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2VpYWJlaXJpZnVyZGF5YnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDc2MjgsImV4cCI6MjA2NzE4MzYyOH0.ic9QulLj2JmKepFg3WlA6ux2urUwQFoNDrfK5b5Fh-M';
  const REQUIRE_LOGIN = false;

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  let _session = null;
  let _profile = null;   // sf_staff row for logged-in user

  // ─── Profile fetch ──────────────────────────────────────────────
  async function fetchProfile() {
    const { data, error } = await sb.rpc('sf_get_my_profile');
    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  // ─── Login helpers ──────────────────────────────────────────────
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

  // ─── Login card HTML ────────────────────────────────────────────
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

    // Tab switching
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

    // Magic link submit
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

    // Password submit
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

    // Skip button
    const skipBtn = document.getElementById('auth-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        container.innerHTML = '';
      });
    }
  }

  // ─── Header user area ───────────────────────────────────────────
  function renderUserArea(container) {
    if (!_profile) {
      container.innerHTML = `<button type="button" class="auth-signin-btn" id="auth-signin-btn">Sign in</button>`;
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

  // ─── Staff nav link (admin only) ────────────────────────────────
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

  // ─── Page gating ────────────────────────────────────────────────
  function checkPageAccess(pageSlug) {
    if (!_session) return true;  // no session = public access (REQUIRE_LOGIN handled separately)
    if (!_profile) return false;
    if (!_profile.is_active) return false;
    if (_profile.role === 'super_admin') return true;
    return _profile.allowed_pages.includes(pageSlug);
  }

  function showAccessDenied() {
    const main = document.querySelector('main.dash');
    if (!main) return;
    main.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px">
        <div>
          <h2 style="font-size:22px;margin-bottom:12px">Access Restricted</h2>
          <p style="color:var(--sf-ink-50);margin-bottom:20px">You don't have access to this page. Contact your administrator.</p>
          <a href="./" style="color:var(--sf-blue-700);font-weight:600;text-decoration:underline">Go to Registrations</a>
        </div>
      </div>`;
  }

  function showDeactivated() {
    const main = document.querySelector('main.dash');
    if (!main) return;
    main.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px">
        <div>
          <h2 style="font-size:22px;margin-bottom:12px">Account Deactivated</h2>
          <p style="color:var(--sf-ink-50);margin-bottom:20px">Your account has been deactivated. Contact your administrator.</p>
          <button type="button" onclick="SF_AUTH.signOut()" style="color:var(--sf-blue-700);font-weight:600;text-decoration:underline;border:none;background:none;cursor:pointer;font-size:15px">Sign out</button>
        </div>
      </div>`;
  }

  // ─── Init: called by each page on load ──────────────────────────
  async function init(pageSlug) {
    // Check for session
    const { data: { session } } = await sb.auth.getSession();
    _session = session;

    if (_session) {
      _profile = await fetchProfile();
    }

    // Render user area in header
    const userArea = document.getElementById('user-area');
    if (userArea) renderUserArea(userArea);

    // Render staff nav link if admin
    renderStaffNavLink();

    // Handle no-session case
    if (!_session) {
      if (REQUIRE_LOGIN) {
        const cardEl = document.getElementById('auth-card-root');
        if (cardEl) renderLoginCard(cardEl);
        const main = document.querySelector('main.dash');
        if (main) main.style.display = 'none';
      }
      return { session: null, profile: null };
    }

    // Handle deactivated user
    if (_profile && !_profile.is_active) {
      showDeactivated();
      return { session: _session, profile: _profile };
    }

    // Check page access
    if (!checkPageAccess(pageSlug)) {
      showAccessDenied();
      return { session: _session, profile: _profile };
    }

    // Listen for auth state changes (token refresh, sign-out from another tab)
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') window.location.reload();
    });

    return { session: _session, profile: _profile };
  }

  // ─── Public API ─────────────────────────────────────────────────
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
```

- [ ] **Step 2: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/auth.js
git commit -m "feat(floyd): add shared auth.js module for dashboard login/session/permissions"
```

---

## Task 3: Add auth CSS to index.html

**Files:**
- Modify: `dashboard/index.html` (inside `<style>` block, before closing `</style>`)

- [ ] **Step 1: Add auth CSS before the closing `</style>` tag (line 521)**

Insert just before `</style>`:

```css
/* ====== Auth (login card, header user area) ====== */
.auth-backdrop{position:fixed;inset:0;z-index:9000;background:rgba(10,16,40,.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.auth-card{background:var(--sf-white);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:36px 32px 28px;width:360px;max-width:92vw}
.auth-brand{display:flex;align-items:center;gap:14px;margin-bottom:24px}
.auth-brand img{height:48px}
.auth-title{font-family:'Oswald',sans-serif;font-size:18px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--sf-ink)}
.auth-tabs{display:flex;gap:0;margin-bottom:20px;background:var(--sf-cream);border-radius:8px;padding:3px;border:1px solid var(--sf-border)}
.auth-tab{flex:1;padding:8px 12px;border-radius:6px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:var(--sf-ink-50);transition:all .15s;text-align:center}
.auth-tab.active{background:var(--sf-white);color:var(--sf-blue-700);box-shadow:0 1px 3px rgba(15,23,42,.08)}
.auth-label{display:block;font-size:12px;font-weight:600;color:var(--sf-ink-60);letter-spacing:.04em;text-transform:uppercase;margin-bottom:14px}
.auth-input{display:block;width:100%;margin-top:5px;padding:10px 12px;border:1px solid var(--sf-border);border-radius:8px;font-size:14px;background:var(--sf-white);transition:border-color .15s}
.auth-input:focus{outline:none;border-color:var(--sf-blue-700)}
.auth-submit{display:block;width:100%;padding:12px;border-radius:8px;background:var(--grad-blue);color:#fff;font-family:'Oswald',sans-serif;font-size:14px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;border:none;cursor:pointer;margin-top:4px;transition:opacity .15s}
.auth-submit:hover{opacity:.9}
.auth-feedback{font-size:12px;margin-top:12px;text-align:center;min-height:18px;color:var(--sf-ink-50)}
.auth-feedback.error{color:var(--sf-red)}
.auth-feedback.success{color:var(--sf-green)}
.auth-skip{display:block;width:100%;text-align:center;margin-top:12px;font-size:12px;color:var(--sf-ink-40);text-decoration:underline;cursor:pointer;background:none;border:none;font-family:'Inter',sans-serif}
.auth-skip:hover{color:var(--sf-ink-60)}
.auth-signin-btn{font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:7px 13px;border-radius:6px;background:var(--sf-blue-50);color:var(--sf-blue-700);transition:background .2s;border:none;cursor:pointer}
.auth-signin-btn:hover{background:var(--sf-blue-100)}
.auth-user-name{font-family:'Space Grotesk','Inter',monospace;font-size:12.5px;font-weight:600;color:var(--sf-ink)}
.auth-badge{font-family:'Inter',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 7px;border-radius:4px}
.auth-badge.admin{background:#fef3c7;color:#92400e}
.auth-badge.staff{background:var(--sf-blue-100);color:var(--sf-blue-700)}
.auth-signout-btn{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:var(--sf-ink-40);text-decoration:underline;cursor:pointer;background:none;border:none}
.auth-signout-btn:hover{color:var(--sf-ink-60)}
```

- [ ] **Step 2: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/index.html
git commit -m "feat(floyd): add auth CSS to registrations dashboard"
```

---

## Task 4: Wire auth into index.html (HTML + JS)

**Files:**
- Modify: `dashboard/index.html`

- [ ] **Step 1: Add Supabase JS CDN + auth.js before closing `</head>` (line 522)**

Insert before `</head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="./auth.js"></script>
```

- [ ] **Step 2: Add user-area container inside the header**

Find the `<div class="dash-meta">` block (line 531). Insert a new `<div>` right before it:

```html
<div id="user-area" class="dash-meta" style="gap:8px"></div>
```

- [ ] **Step 3: Add auth-card-root container after `<body>` tag**

Insert right after `<body class="js-ready">` (line 523), before the Pantry script:

```html
<div id="auth-card-root"></div>
```

- [ ] **Step 4: Call SF_AUTH.init at the start of the IIFE script**

Find the opening of the main IIFE (`(() => {` at line 832). Insert right after it:

```javascript
const __auth = await SF_AUTH.init('registrations');
```

And wrap the IIFE as async: change `(() => {` to `(async () => {`.

- [ ] **Step 5: Wire `marked_by` into attendance RPCs**

Find each place where `p_marked_by: null` is passed in the attendance RPC calls (there are 3 instances — in `saveAttendanceCell`, `setPersonPickRpc`, and `bulkSetPeoplePicksRpc`). Replace each with:

```javascript
p_marked_by: SF_AUTH.markedBy,
```

- [ ] **Step 6: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/index.html
git commit -m "feat(floyd): wire auth into registrations dashboard — login card, user area, marked_by"
```

---

## Task 5: Wire auth into lunches.html

**Files:**
- Modify: `dashboard/lunches.html`

Same pattern as Task 3+4 but for the lunches page. This page has no attendance writes, so no `marked_by` wiring needed.

- [ ] **Step 1: Add auth CSS before closing `</style>` tag**

Insert the same auth CSS block from Task 3 Step 1 before `</style>` in lunches.html.

- [ ] **Step 2: Add Supabase JS CDN + auth.js before closing `</head>`**

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="./auth.js"></script>
```

- [ ] **Step 3: Add user-area and auth-card-root containers**

Add `<div id="auth-card-root"></div>` right after `<body>`.
Add `<div id="user-area" class="dash-meta" style="gap:8px"></div>` right before the existing `<div class="dash-meta">` in the header.

- [ ] **Step 4: Call SF_AUTH.init in the page script**

Find the page's IIFE, make it async, and insert `await SF_AUTH.init('lunches');` at the top.

- [ ] **Step 5: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/lunches.html
git commit -m "feat(floyd): wire auth into lunches dashboard"
```

---

## Task 6: Wire auth into free-camp.html

**Files:**
- Modify: `dashboard/free-camp.html`

Same pattern as Task 5.

- [ ] **Step 1: Add auth CSS before closing `</style>` tag**

Insert the same auth CSS block before `</style>` in free-camp.html.

- [ ] **Step 2: Add Supabase JS CDN + auth.js before closing `</head>`**

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="./auth.js"></script>
```

- [ ] **Step 3: Add user-area and auth-card-root containers**

Add `<div id="auth-card-root"></div>` right after `<body>`.
Add `<div id="user-area" class="dash-meta" style="gap:8px"></div>` right before the existing `<div class="dash-meta">` in the header.

- [ ] **Step 4: Call SF_AUTH.init in the page script**

Find the page's IIFE, make it async, and insert `await SF_AUTH.init('free-camp');` at the top.

- [ ] **Step 5: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/free-camp.html
git commit -m "feat(floyd): wire auth into free-camp dashboard"
```

---

## Task 7: Create staff.html — Staff Management Page

**Files:**
- Create: `dashboard/staff.html`

This is a new full page. It needs: the same header/nav as other dashboard pages, a staff table, an "Add staff" modal, inline editing, and deactivate/reactivate toggles. All data goes through the `sf_get_staff` and `sf_upsert_staff` RPCs.

- [ ] **Step 1: Create `dashboard/staff.html`**

Build the full page with:

1. **Head:** Same fonts, same `:root` design tokens as index.html, auth CSS included, Supabase JS CDN + auth.js loaded
2. **Header:** Same `dash-header` as other pages, with `#user-area` and `#auth-card-root`
3. **Nav:** Same `dash-nav` with Staff link marked `active` and `aria-current="page"`
4. **Main content:**
   - Page heading: "Staff Management"
   - "Add staff" button (opens modal)
   - Staff table: Name, Email, Role, Pages, Active, Actions
   - Each row: display_name, email, role badge, page pills, green/red active dot, Edit + Deactivate/Reactivate buttons
5. **Add staff modal:**
   - Email input, Display name input, Role dropdown (staff / super_admin), page checkboxes (Registrations, Lunches, Free Camp), Submit button
   - On submit: call `sb.auth.admin.inviteUserByEmail()` (requires service_role key — this will need to go through an edge function or RPC; for MVP, use the sf_upsert_staff RPC after the user accepts their invite)
6. **Edit modal/inline:**
   - Same fields as add modal, prefilled from existing row
   - Save calls `sf_upsert_staff` RPC
7. **Script:**
   - `SF_AUTH.init('staff')` at top
   - `loadStaff()` fetches `sf_get_staff` RPC
   - `saveStaff(email, name, role, pages)` calls `sf_upsert_staff` RPC
   - `toggleActive(userId, currentState)` calls `sf_deactivate_staff` or `sf_reactivate_staff`
   - All RPCs use the Supabase JS client: `SF_AUTH.supabase.rpc('rpc_name', { params })`

The full HTML for this page is substantial. The implementer should build it following the exact CSS patterns, class names, and component structure from `index.html` (roster panel, modal patterns, badge/pill patterns). Key CSS to reuse: `.dash-header`, `.dash-nav`, `.nav-link`, `.day-modal-backdrop` (for the add/edit modal), table/card patterns from the roster panel.

- [ ] **Step 2: Commit**

```bash
git add Tom_Systema_Floyd/dashboard/staff.html
git commit -m "feat(floyd): add staff management page — table, add/edit/deactivate UI"
```

---

## Task 8: Seed Emilio as super admin + end-to-end test

**Files:**
- No new files. Interactive testing via browser.

- [ ] **Step 1: Sign up Emilio via the dashboard**

Open the dashboard in a browser. Click "Sign in." Use the Password tab or Magic Link tab with `emilio@nilsdigital.com`. Complete the sign-up flow (Supabase will create the auth.users row, which triggers the sf_staff row via the Postgres trigger).

- [ ] **Step 2: Promote to super_admin**

Run via Supabase MCP `execute_sql`:

```sql
UPDATE public.sf_staff
SET role = 'super_admin',
    display_name = 'Emilio',
    allowed_pages = ARRAY['registrations', 'lunches', 'free-camp', 'staff']
WHERE email = 'emilio@nilsdigital.com';
```

Verify:

```sql
SELECT id, email, display_name, role, allowed_pages, is_active
FROM public.sf_staff
WHERE email = 'emilio@nilsdigital.com';
```

Expected: role = 'super_admin', allowed_pages = {registrations,lunches,free-camp,staff}.

- [ ] **Step 3: Test the full flow**

1. Reload dashboard — should see "Emilio" + "Admin" badge in header + "Staff" nav link
2. Click Staff — should see staff.html with Emilio as the only row
3. Mark a student's attendance — check the `marked_by` value in Supabase:

```sql
SELECT person_name, marked_by FROM public.sf_daily_attendance_people
ORDER BY marked_at DESC LIMIT 3;
```

Expected: `marked_by = 'Emilio'` on the most recent row.

4. Sign out — should revert to public access with "Sign in" button
5. Visit staff.html while logged out — should show access denied

- [ ] **Step 4: Commit any fixes discovered during testing**

```bash
git add Tom_Systema_Floyd/dashboard/
git commit -m "fix(floyd): post-integration fixes from auth end-to-end testing"
```

---

## Task 9: Update PROJECT.md

**Files:**
- Modify: `Tom_Systema_Floyd/PROJECT.md`

- [ ] **Step 1: Add changelog entry**

Add a dated changelog entry at the top of the changelog section:

```markdown
### 2026-05-27 — Dashboard auth system: login, staff management, page permissions
Added Supabase Auth integration to the dashboard. Staff can log in via magic link or email/password. Emilio (emilio@nilsdigital.com) is super admin and can manage staff via a new Staff page (staff.html). Each staff member has page-level access control. `marked_by` field on attendance now records who made the mark. Ships with `REQUIRE_LOGIN = false` (public access preserved); flip to `true` in auth.js to block unauthenticated access. New Supabase table `sf_staff` linked to `auth.users`, with 5 new RPCs (sf_get_my_profile, sf_get_staff, sf_upsert_staff, sf_deactivate_staff, sf_reactivate_staff). New files: `dashboard/auth.js` (shared auth module), `dashboard/staff.html` (admin page). All 3 existing pages modified to load auth.js and show login/user UI.
```

- [ ] **Step 2: Update architecture section**

Add to the architecture section:

```markdown
### Auth & Staff Management
Supabase Auth (built-in) handles identity. `sf_staff` table (linked 1:1 to `auth.users`) stores role (`super_admin` / `staff`) and `allowed_pages` (text array of page slugs). `dashboard/auth.js` is the shared module loaded by all pages — manages sessions, profiles, login card, header user area, and page gating. `REQUIRE_LOGIN` flag in auth.js controls whether unauthenticated users can view the dashboard (currently `false`). Staff management at `dashboard/staff.html` (admin-only).
```

- [ ] **Step 3: Commit**

```bash
git add Tom_Systema_Floyd/PROJECT.md
git commit -m "docs(floyd): update PROJECT.md with auth system architecture and changelog"
```
