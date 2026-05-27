# 2026-05-27 — Auth System + Attendance Time Tracker Handoff

## What shipped this session

Two features built end-to-end and pushed to GitHub Pages:

### 1. Per-kid time in/out attendance tracking (Tom's request)

Tom emailed asking for time in and time out per kid per day as proof of attendance. Previously the system only tracked headcount (totals mode) and present/absent (by-person mode).

**What was added:**
- `time_in` and `time_out` text columns on `sf_daily_attendance_people` (Supabase)
- Updated all 3 attendance RPCs (`sf_set_daily_attendance_person`, `sf_bulk_set_daily_attendance_people`, `sf_get_daily_attendance_people`) to read/write the new fields
- Old 8-param overload of `sf_set_daily_attendance_person` was dropped (was causing PGRST203 ambiguity error)
- Dashboard UI: by-person attendance rows show "In" and "Out" time pickers when a student is marked present
- Marking present auto-fills time_in with the current clock time
- Marking absent or clearing removes both times
- Editing a time input fires an immediate RPC save
- Bulk "All present" sets time_in on students that don't already have one
- Attendance modal widened to 480px; person list max-height bumped to 400px
- `COALESCE` on upsert prevents accidental overwrites when only one time field changes

**How to use:** Open attendance modal > switch to "By person" > click checkmark on a student > In/Out time inputs appear on that row.

**Database-tested:** 7 RPC tests passed (insert, read, COALESCE preservation, bulk, delete, cleanup). Browser-to-Supabase round-trip verified.

### 2. Dashboard auth system (login, staff management, page permissions)

**What was added:**

| Component | Description |
|---|---|
| `sf_staff` table | Supabase table linked 1:1 to `auth.users`. Columns: id, email, display_name, role (super_admin/staff), allowed_pages (text[]), is_active |
| Auto-create trigger | New auth user INSERT → auto-creates sf_staff row with role=staff, no pages |
| 5 new RPCs | `sf_get_my_profile`, `sf_get_staff`, `sf_upsert_staff`, `sf_deactivate_staff`, `sf_reactivate_staff` |
| `dashboard/auth.js` | Shared module loaded by all pages. Manages Supabase client, sessions, profile fetch, login card, header user area, Staff nav link, page gating |
| `dashboard/staff.html` | Admin-only page: staff table, add/edit modal, deactivate/reactivate toggles |
| Login card | Centered overlay with Magic Link and Password tabs. Dismissable when `REQUIRE_LOGIN = false` |
| Header user area | Top-right: "Sign in" button (logged out) or name + role badge + "Sign out" (logged in) |
| `marked_by` wiring | All 3 attendance RPCs now pass `SF_AUTH.markedBy` (display_name of logged-in user, null when not logged in) |
| Page gating | Each page checks user's `allowed_pages`. Super admins bypass all checks. Staff page enforced as admin-only |

**Login credentials:** `emilio@nilsdigital.com` / `SistemaFloyd2026!` (change after first login)

**`REQUIRE_LOGIN` flag:** Currently `false` in `auth.js` line 3. Dashboard stays publicly accessible. Flip to `true` to require login for all access.

## Files changed

| File | What |
|---|---|
| `dashboard/index.html` | Auth CSS, Supabase CDN, auth.js load, auth-card-root + user-area containers, async IIFE, SF_AUTH.init, marked_by wiring, time tracker CSS/JS |
| `dashboard/lunches.html` | Auth CSS, Supabase CDN, auth.js load, containers, async IIFE, SF_AUTH.init |
| `dashboard/free-camp.html` | Auth CSS, Supabase CDN, auth.js load, containers, async IIFE, SF_AUTH.init |
| `dashboard/auth.js` | New — shared auth module |
| `dashboard/staff.html` | New — staff management page |
| `PROJECT.md` | Architecture section + changelog + auth TODOs |
| Supabase | sf_staff table, trigger, 7 functions (5 auth RPCs + updated_at trigger + handle_new_user trigger), time_in/time_out columns on sf_daily_attendance_people |

## Supabase state

**Project:** `nroeiabeirifurdaybyo`

**Tables added:**
- `sf_staff` (8 columns, FK to auth.users)

**Columns added:**
- `sf_daily_attendance_people.time_in` (text, nullable)
- `sf_daily_attendance_people.time_out` (text, nullable)

**Functions (new):**
- `sf_get_my_profile()` — returns caller's sf_staff row
- `sf_get_staff()` — all staff (super_admin only)
- `sf_upsert_staff(p_email, p_display_name, p_role, p_allowed_pages)` — update staff (super_admin only)
- `sf_deactivate_staff(p_user_id)` — soft-disable (super_admin only, can't deactivate self)
- `sf_reactivate_staff(p_user_id)` — re-enable (super_admin only)
- `sf_handle_new_user()` — trigger function, auto-creates sf_staff on auth.users INSERT
- `sf_staff_set_updated_at()` — trigger function, auto-updates updated_at

**Functions (modified):**
- `sf_set_daily_attendance_person` — added p_time_in, p_time_out params; old overload dropped
- `sf_bulk_set_daily_attendance_people` — reads time_in/time_out from p_persons JSON

**Auth user seeded:**
- `emilio@nilsdigital.com` (uuid `ad375acf-0893-42a5-b4f5-497f8af724c9`) → sf_staff role=super_admin, all pages

## Known issues / follow-ups

1. **Tom's email reply still pending** — a draft reply is in Gmail about the time tracker. The draft is honest (says the feature didn't exist yet). Now it does. You can update the draft or send a new reply confirming it's live.

2. **Staff invite flow is manual** — new users must sign up via the login page first. Admin then sets their role/permissions on the Staff page. A proper invite flow (admin enters email → Supabase sends invite) requires a Supabase Edge Function with the `service_role` key.

3. **`REQUIRE_LOGIN` is `false`** — dashboard is still public. Flip when ready.

4. **`claim_secret` still in use** — attendance writes use a shared secret, not per-user JWT. Replace with RLS when REQUIRE_LOGIN goes true.

5. **Campus-level permissions not built** — page-level only. Campus gating (Upper/Lower) needed when instructors get their own logins.

6. **Password change** — Emilio's password was set via direct SQL insert. Change it after first login via the Supabase dashboard or by requesting a password reset email.

## How to test

1. Hard refresh the dashboard (`Ctrl+Shift+R`)
2. "Sign in" button should be at the top right
3. Click it → login card with Magic Link / Password tabs
4. Log in with `emilio@nilsdigital.com` / `SistemaFloyd2026!`
5. After login: "Emilio" + gold "Admin" badge + "Staff" nav link
6. Click a week chip → "By person" → click checkmark → time In/Out inputs appear
7. Click "Staff" in nav → staff management table with one row (Emilio)
8. Sign out → reverts to public access

## Resuming work

- Auth spec: `docs/superpowers/specs/2026-05-27-dashboard-auth-design.md`
- Auth implementation plan: `docs/superpowers/plans/2026-05-27-dashboard-auth.md`
- Auth TODOs: see "Auth & staff management TODOs" section in PROJECT.md
- Dashboard handoff (prior): `context/2026-05-07-dashboard-handoff.md`
