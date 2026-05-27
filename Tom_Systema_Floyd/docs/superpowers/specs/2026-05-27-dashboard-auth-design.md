# Dashboard Auth & Staff Management — Design Spec

**Date:** 2026-05-27
**Status:** Approved
**Scope:** Login system, staff management, page-level permissions for Systema Floyd dashboard

---

## 1. Goal

Add authentication and staff management to the Systema Floyd dashboard so that:
- Staff can log in with magic link or email/password
- Emilio (`emilio@nilsdigital.com`) is the super admin and can add/manage staff
- Each staff member has page-level access control (which dashboard pages they can see)
- Attendance tracking records who marked it (`marked_by`)
- The system ships with public access preserved (no login required) but a single flag flips it to require authentication later

## 2. Current State

- **Dashboard pages:** `index.html` (registrations), `lunches.html`, `free-camp.html`
- **Auth:** None. Dashboard is public, embedded behind GHL portal login
- **Supabase project:** `nroeiabeirifurdaybyo` (already used for attendance data)
- **Secrets:** `SUPABASE_ANON` key and `claim_secret` hardcoded in HTML
- **Write protection:** `claim_secret` shared token passed in RPC body — not per-user
- **`marked_by`:** Exists on attendance tables but always null

## 3. Approach

Use Supabase Auth (built-in) for authentication. Custom `sf_staff` table for role and permissions metadata. Supabase JS client loaded via CDN on all dashboard pages.

## 4. Database Schema

### 4.1 `sf_staff` table

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, FK to `auth.users.id` | 1:1 with Supabase Auth user |
| `email` | text | UNIQUE, NOT NULL | Denormalized from auth for easy lookups/display |
| `display_name` | text | NOT NULL | Shown in header, used as `marked_by` |
| `role` | text | NOT NULL, CHECK IN ('super_admin', 'staff') | Controls admin-level access |
| `allowed_pages` | text[] | NOT NULL, DEFAULT '{}' | Page slugs: `registrations`, `lunches`, `free-camp`, `staff` |
| `is_active` | boolean | NOT NULL, DEFAULT true | Soft-disable without deleting |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

### 4.2 Seed data

```sql
-- Emilio as super admin (inserted after auth.users row exists)
INSERT INTO sf_staff (id, email, display_name, role, allowed_pages, is_active)
VALUES (
  <auth.users.id for emilio@nilsdigital.com>,
  'emilio@nilsdigital.com',
  'Emilio',
  'super_admin',
  ARRAY['registrations', 'lunches', 'free-camp', 'staff'],
  true
);
```

### 4.3 Postgres trigger

On `auth.users` INSERT, auto-create an `sf_staff` row with defaults:
- `role = 'staff'`
- `allowed_pages = '{}'` (no access until admin grants it)
- `is_active = true`
- `display_name` = email prefix (before @)

This ensures every Supabase Auth user gets a corresponding `sf_staff` row. The admin then sets their permissions via the Staff page.

## 5. Auth Flow

### 5.1 Login methods

Both available simultaneously via a two-tab login card:

1. **Magic link:** User enters email, clicks "Send link." Supabase sends email with OTP link. User clicks link, redirected back to dashboard with active session.
2. **Email + password:** User enters email + password, clicks "Sign in." Standard Supabase `signInWithPassword`.

### 5.2 Session lifecycle

```
Page load
  |
  v
supabase.auth.getSession()
  |
  +-- Valid session --> fetch sf_staff row via sf_get_my_profile()
  |                       |
  |                       +-- is_active=true --> show dashboard, apply page permissions
  |                       +-- is_active=false --> show "Account deactivated" message
  |
  +-- No session --> REQUIRE_LOGIN?
                       |
                       +-- true  --> show login card, block dashboard
                       +-- false --> show dashboard (public access), show "Sign in" button
```

- Sessions auto-refresh via `supabase.auth.onAuthStateChange()`
- Logout clears session via `supabase.auth.signOut()`
- `REQUIRE_LOGIN` is a JS constant at the top of each page, initially `false`

### 5.3 Staff onboarding

Only super admins can add users. Flow:

1. Admin opens Staff page, clicks "Add staff"
2. Fills in: email, display name, role, page checkboxes
3. Dashboard calls `sf_upsert_staff()` RPC which:
   - Invites the user via Supabase `auth.admin.inviteUserByEmail()` (sends onboarding email automatically; no temporary password needed)
   - The Postgres trigger auto-creates the `sf_staff` row on auth user creation
   - Then updates the `sf_staff` row with the admin-specified role and allowed_pages
4. New staff receives invite email, clicks link, lands on dashboard logged in
5. They can optionally set a password for future logins

No self-registration. No public sign-up.

### 5.4 `marked_by` wiring

When a logged-in user marks attendance, the dashboard JS passes their `display_name` as `p_marked_by` to the existing attendance RPCs. No RPC signature changes needed — the parameter already exists and accepts text.

When no user is logged in (public access mode), `p_marked_by` remains null (current behavior).

## 6. RPCs

### 6.1 New RPCs

| RPC | Auth | Parameters | Returns | Notes |
|---|---|---|---|---|
| `sf_get_my_profile()` | Any authenticated user | none | Single `sf_staff` row | Reads caller's own profile using `auth.uid()` |
| `sf_get_staff()` | Super admin only | none | All `sf_staff` rows | Admin user list |
| `sf_upsert_staff(...)` | Super admin only | `p_email`, `p_display_name`, `p_role`, `p_allowed_pages` | Upserted row | Creates/updates staff. Role of target cannot exceed caller's role. |
| `sf_deactivate_staff(p_user_id)` | Super admin only | `p_user_id` (uuid) | void | Sets `is_active = false`. Cannot deactivate self. |
| `sf_reactivate_staff(p_user_id)` | Super admin only | `p_user_id` (uuid) | void | Sets `is_active = true`. |

Admin RPCs verify the caller is `super_admin` by joining `auth.uid()` to `sf_staff.id` and checking `role = 'super_admin'`.

### 6.2 Existing RPCs — no changes

The three attendance write RPCs (`sf_set_daily_attendance`, `sf_set_daily_attendance_person`, `sf_bulk_set_daily_attendance_people`) keep their `claim_secret` auth model unchanged. The dashboard JS simply starts populating `p_marked_by` when a session exists.

Future migration (out of scope for this build): replace `claim_secret` with JWT-based RLS when `REQUIRE_LOGIN` flips to `true`.

## 7. UI

### 7.1 Login card

- Centered overlay on the dashboard, semi-transparent backdrop
- Matches dashboard design tokens: Inter font, navy (#1b2f6e) / blue (#4aa3e0), white cards, 8px border-radius, subtle shadows
- Two-tab toggle: "Magic link" | "Password"
- Magic link tab: email input + "Send login link" button + success message ("Check your email")
- Password tab: email + password inputs + "Sign in" button
- Error feedback inline below the form
- When `REQUIRE_LOGIN = false`: a "Continue without signing in" link below the card
- Systema Floyd logo/branding at the top of the card

### 7.2 Header user area

Added to the right side of the existing header (where the "Updated at" / "Refresh" controls are):

- **Logged out:** "Sign in" text button
- **Logged in:** `display_name` label + small role badge ("Admin" in gold for super_admin, "Staff" in blue for staff) + "Sign out" text button

### 7.3 Dashboard nav changes

- The nav bar (`dash-nav`) currently shows: Registrations | Lunches | (Sheets links) | (Billing link)
- **Add:** "Staff" nav link, only rendered when the logged-in user has `role = 'super_admin'`
- Free Camp link already exists; no change needed

### 7.4 Staff management page (`staff.html`)

- Only accessible to `super_admin` users
- **Staff table:** Columns: Name, Email, Role, Pages, Active, Last login
  - Role shown as badge (gold "Admin" / blue "Staff")
  - Pages shown as pill chips (e.g., `Registrations` `Lunches`)
  - Active shown as green/red dot
  - Row click opens inline edit
- **Add staff button:** Opens modal with: email input, display name input, role dropdown, page checkboxes (Registrations, Lunches, Free Camp), submit button
- **Inline editing:** Click a staff row to toggle allowed pages (checkbox toggles) or change role (dropdown). Changes save immediately via `sf_upsert_staff`.
- **Deactivate/reactivate:** Toggle button per row. Deactivated users can't log in but their data is preserved.
- Matches the dashboard's existing visual style (same card/table patterns as the roster panel)

### 7.5 Page gating

Each page checks permissions on load:

```javascript
// Pseudocode — runs after session + profile load
const PAGE_SLUG = 'registrations'; // set per page
if (session && profile) {
  if (profile.role === 'super_admin') { /* full access */ }
  else if (!profile.allowed_pages.includes(PAGE_SLUG)) {
    showAccessDenied();
  }
}
// If no session and REQUIRE_LOGIN = false, show page anyway (current behavior)
```

`showAccessDenied()` replaces `main.dash` innerHTML with a centered message: "You don't have access to this page. Contact your administrator." with a link to go back.

## 8. Supabase JS Client

Loaded on every dashboard page via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

Initialized with the existing anon key (already in the code):

```javascript
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
```

All auth operations go through `sb.auth.*`. All RPC calls continue using the existing `fetch()` pattern but can optionally use `sb.rpc()` for new staff RPCs.

## 9. Files Changed / Created

| File | Action | What |
|---|---|---|
| `dashboard/index.html` | Modified | Add Supabase JS client, login card HTML/CSS/JS, header user area, auth state check, REQUIRE_LOGIN flag, pass `marked_by` |
| `dashboard/lunches.html` | Modified | Add Supabase JS client, auth state check, page gating, header user area |
| `dashboard/free-camp.html` | Modified | Add Supabase JS client, auth state check, page gating, header user area |
| `dashboard/staff.html` | Created | New staff management page |
| `dashboard/auth.js` | Created | Shared auth module: login/logout, session check, profile fetch, permission helpers. Loaded by all pages. |
| Supabase | Migration | `sf_staff` table, trigger, 5 new RPCs, seed Emilio row |

## 10. What Ships Open vs. Locked Later

| Feature | This build | Later (flip REQUIRE_LOGIN) |
|---|---|---|
| Login card | Available but dismissable | Required, no dismiss |
| Page viewing | Public | Authenticated only |
| Attendance writes | `claim_secret` (shared) | JWT session (per-user RLS) |
| `marked_by` | Populated when logged in, null when not | Always populated (login required) |
| Staff page | Admin-only (enforced) | Admin-only (enforced) |
| Page gating | Enforced for logged-in staff | Enforced for all users |

## 11. Out of Scope

- Campus-level permissions (future: restrict instructors to Upper/Lower only)
- RLS policies on data tables (future: when REQUIRE_LOGIN flips)
- Replacing `claim_secret` with JWT auth (future)
- Password reset flow (Supabase handles this automatically)
- Email template customization (uses Supabase defaults)
- Billing dashboard integration (separate system)
