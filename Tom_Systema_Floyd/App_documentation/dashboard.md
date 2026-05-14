# Systema Floyd, Camp Dashboard

> Browser dashboard at `Tom_Systema_Floyd/dashboard/index.html` (and
> `lunches.html`) that surfaces the live state of all four camp registration
> sheets, Free Upper, Free Lower, Paid Upper, Paid Lower, plus historical
> trend, daily attendance, lunch prep counts, and data-quality alerts.
>
> Embedded inside a GoHighLevel iframe via the standard GHL embed wrapper
> (see project `CLAUDE.md` for the snippet). Public URL:
> `https://demilio24.github.io/Websites/Tom_Systema_Floyd/dashboard/index.html`

The dashboard is **read-only** for staff, every number is derived from the
four Google Sheets via the Apps Script snapshot pipeline. The cap inputs in
the Capacity Targets panel are the one editable surface, and they persist in
`localStorage` per filter (summer / free / afterschool); they do not write
back to Sheets or Supabase.

> **Code lives at:**
> - Dashboard pages: `Tom_Systema_Floyd/dashboard/index.html`, `lunches.html`
> - Snapshot builder: `Tom_Systema_Floyd/sheets-snapshot/apps-script/Snapshot.js`
> - Live data:       `Tom_Systema_Floyd/dashboard/snapshot.json` (auto-pushed every 5 min)
> - History:         `Tom_Systema_Floyd/dashboard/history/*.json` (one per UTC day) + `history/index.json`
> - Supabase mirror: tables `sf_camp_enrollments`, `sf_camp_snapshots`, `sf_daily_attendance` in project `nroeiabeirifurdaybyo`

## Data flow at a glance

```
┌───────────────────────────────┐
│ 4 Google Sheets               │
│  Upper / Lower (Paid)         │
│  Upper / Lower (Free)         │
└──────────────┬────────────────┘
               │ Apps Script trigger (every 5 min)
               ▼
┌───────────────────────────────┐
│ Snapshot.js                   │
│  - reads tabs by NAME (Jun 8- │
│    12, June 8th-12th, 6/8…)   │
│    not by tab position        │
│  - aggregates totals, lunches,│
│    roster, daily attendance,  │
│    per-slice weekOrder        │
└──────┬────────────────┬───────┘
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────────────────┐
│ GitHub       │  │ Supabase (project            │
│  snapshot.   │  │  nroeiabeirifurdaybyo)       │
│  json + day  │  │  sf_camp_enrollments (upsert │
│  history     │  │   keyed by type/campus/week/ │
│  + index.    │  │   name_key)                  │
│  json        │  │  sf_camp_snapshots (archive  │
└──────┬───────┘  │   keyed by generated_at)     │
       │          └────────────┬─────────────────┘
       ▼                       ▼
┌─────────────────────────────────────────────────┐
│ Browser dashboard                               │
│  fetches snapshot.json on load (no-cache)       │
│  fetches sparkline via public RPC               │
│   sf_recent_camp_totals(days_back)              │
│  fetches attendance via public RPC              │
│   sf_get_daily_attendance(week?)                │
│  WRITES attendance via claim_secret RPC         │
│   sf_set_daily_attendance(...)                  │
│  fetches a prior day from history/YYYY-MM-DD.   │
│   json when user picks a compare-to date        │
└─────────────────────────────────────────────────┘
```

See [registration_system.md](./registration_system.md) for the upstream
form-to-sheet path. This doc covers everything **downstream** of the four
roster sheets.

## Pages

### `index.html`, Registrations

The main dashboard. Single page, single tab UI (no client-side routing ,
everything is on one screen, toggled by filter pills and quick-filter pills).

Top-to-bottom anatomy:

| Region | What it shows |
|---|---|
| **Top nav** | Three pill groups: `Pages` (Registrations + Lunches), `Sheets` (links to the 4 source Google Sheets, labeled `PAID Upper / PAID Lower / FREE Upper / FREE Lower`), `Billing` (mint-green button linking to the Billing Dashboard sheet) |
| **Filter row** | Tabs: `Paid Camp` / `Free Camp` + a "compare to" date picker that reloads against a prior day's history snapshot. The After-School tab still exists in the DOM but is `hidden` until after-school sheets are created |
| **KPI row** (camp) | 5 cards: Unique Students (with **14-day sparkline** inline), Occupancy %, Upper Campus, Lower Campus, Top Week |
| **KPI row** (after-school) | 4 cards: Total Enrolled, By Program, Waitlist, Top Day (hidden when filter ≠ after-school) |
| **Charts** | Donut (campus split) + horizontal stacked bars (by week, color by campus). The bars chart card header has a **Registrations / Attendance mode toggle** that swaps the data source between registered counts and actual attendance counts. The two cap-line values now live in the legend below the chart (`Upper Campus, cap 13`), not on the chart itself, so they can never collide with bar values. |
| **Capacity Targets** | Editable per-tab per-campus caps. Reset button below. Values persist in `localStorage`. |
| **Ops strip** | Two click-to-expand chips: `⚠ Allergies (N)` + `🛠 Data issues (N)`. **Counts are deduped by student name** so the pill number always matches the number of rows you'll see in the detail panel (a kid with an allergy across 5 weeks counts as 1, not 5). Counts ignore quick-filter so users see the full backlog. Data issues are **grouped by student**: one card per kid with the union of missing fields across every affected week + a per-source-sheet link strip. |
| **Student Rosters** | Search box, quick-filter pills (`All / Upper / Lower / 🥪 Lunch / ⚠ Allergies / Incomplete`), then a grid of week cards. Each week card has a Mon-Fri daily-attendance strip, **each chip is a clickable attendance button** (see the Attendance Tracker section below), then the student list. Click any student row to expand an inline detail card. |

### `lunches.html`, Lunch Prep

Kitchen-facing view of every parsed lunch order. Top-of-page summary strip,
then one card per week with a Mon-Fri × order-type matrix. Reuses the same
nav and filter pills as the main dashboard.

Lunch parsing (Pizza weekly / Pizza daily / Pizza specific days / Celis Melt
Belt / Celis Wrap Trap / Breakfast / None / Other) lives in `parseLunch_` in
Snapshot.js. Unrecognized strings land in the **Other** bucket with the raw
text shown so the parser can be tightened later.

## `snapshot.json` shape

The single source of truth the dashboard reads. Generated by `buildSnapshot()`
in Snapshot.js. Top-level fields:

| Field | Purpose |
|---|---|
| `generatedAt` | ISO timestamp of the Apps Script run that produced this snapshot |
| `locationId`  | Hardcoded `8IWtNFlmgJ8bif9DivHT` (Systema Floyd Florida GHL location) |
| `cutoff`      | `2026-06-01`, used by KPIs to phrase "Age 6+ on June 1" |
| `weekOrder`   | Global chronological week list, fallback when a slice doesn't carry its own |
| `programOrder`, `dayOrder` | After-school orderings |
| `totals`      | `{ summer, free, afterSchool, contacts, leadOnly, newLast7Days, newLast30Days }`, `contacts`/`leadOnly`/`new*` are stubs currently zeroed |
| `summer`      | `{ total, byCampus, byWeek, byWeekCampus, weekOrder }`, `weekOrder` lists only weeks where the paid sheets actually have tabs |
| `free`        | Same as `summer` plus `bySchool` (descending count) and its own per-slice `weekOrder` (so the free view won't show paid-only weeks like Aug 24-28) |
| `combined`    | Dedup of summer+free for cross-camp metrics |
| `lunches`     | `{ summer: { [weekLabel]: { rows, totals } }, free: same }`, pre-aggregated for `lunches.html` |
| `roster`      | `{ [weekLabel]: { upper: [...], lower: [...], free: [...] } }`, each entry has `name, campus, lunch, lunchRaw, breakfastRaw, allergy, notes, email, school?, incomplete, missingFields[], sourceSheetId, sourceTabName, sourceRow, days[5], type` |
| `afterSchool` | Empty scaffolded shape; populated when after-school sheets exist |

Fields prefixed with `_` (e.g. `_allSummer`, `_allFree`) are **internal raw
enrollments** kept on the in-memory snap object so the Supabase writer can
read them. `stripInternalFields_` strips them before the JSON is committed to
GitHub or returned by the `doGet` web app.

## Apps Script: Snapshot.js

The pipeline driver. Triggered every 5 minutes by `pushSnapshotToGitHub`
(installed via `installSnapshotPushTrigger`). Each run:

1. Reads each of the four sheets via `readCampSheet_` / `readFreeSheet_`.
2. Resolves each tab to a `WEEK_ORDER` label via `resolveWeek_(tabName, fallbackIndex)`, name-based matching with positional fallback. Patterns it understands: "June 8th-12th", "Jun 8-12", "June 8 - 12", "6/8-6/12".
3. Aggregates totals, by-week, by-campus, lunches, daily attendance.
4. Builds `roster` with one entry per (week × bucket × student), per-week deduplicated.
5. Writes:
   - **Supabase first** via `pushEnrollmentsToSupabase_` (non-fatal, failure is logged but won't block the GitHub push)
   - `snapshot.json` (live)
   - `history/YYYY-MM-DD.json` (one per UTC day, overwritten same-day)
   - `history/index.json` (re-listed every run from the directory contents)
6. Locks via `LockService` so a slow run can't overlap the next 5-min tick.

### Important constants in Snapshot.js

```javascript
const SHEETS = {
  upper:      '1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA',
  lower:      '18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs',
  freeUpper:  '1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ',
  freeLower:  '1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY',
};
const WEEK_ORDER = [ 'June 1st-5th', ..., 'August 24th-28th' ];
const LOCATION_ID = '8IWtNFlmgJ8bif9DivHT';
const WEEK_START_DATES = { 'June 1st-5th': '2026-06-01', ... };  // used by Supabase mirror
```

`WEEK_ORDER` is what the dashboard renders. Adding a new week = add it here,
clasp-push, done. The reader is name-aware so the tab can sit anywhere in
the spreadsheet's tab order.

### Required Script Properties

| Property | Used by |
|---|---|
| `GITHUB_PAT` | `pushSnapshotToGitHub`, fine-grained PAT scoped to `demilio24/Websites` with Contents:read+write |
| `SUPABASE_URL` | `pushEnrollmentsToSupabase_` and `DiscrepancyCheck.js` |
| `SUPABASE_ANON_KEY` | Same, legacy anon JWT |
| `SUPABASE_TOKEN_SECRET` | Same, shared claim_secret matching the SECURITY DEFINER RPCs |
| `SECRET_KEY` *(optional)* | Gates the `doGet` web-app endpoint when set |

## Supabase mirror

Each 5-min run pushes raw row-level enrollments AND a full snapshot archive
to Supabase, so other tools (billing dashboard, n8n workflows, ad-hoc
queries) can query enrollments without re-parsing snapshot.json.

### Tables (in project `nroeiabeirifurdaybyo`)

**`public.sf_camp_enrollments`**, current state, upsert keyed by `(type, campus, week_label, name_key)`.

| Column | Meaning |
|---|---|
| `type` | `summer` or `free` |
| `campus` | `Upper Campus` / `Lower Campus` / `Unknown` |
| `week_label` | `'June 8th-12th'` etc., matches `WEEK_ORDER` |
| `week_start_date` | Concrete date derived from `WEEK_START_DATES` for chronological sorting |
| `name_key` | Lowercased, whitespace-collapsed student name, the dedup key |
| `student_name`, `email`, `school`, `parent_name`, `grade`, `age` | Identifying fields |
| `lunch_raw`, `lunch_category`, `lunch_label`, `breakfast_raw` | Lunch + breakfast info |
| `days_mon` … `days_fri` | Attendance booleans |
| `allergy_notes`, `notes` | Free-text |
| `source_sheet_id`, `source_row` | Provenance |
| `snapshot_at` | Updated to `now()` each upsert |

**`public.sf_camp_snapshots`**, append-only point-in-time archive.

| Column | Meaning |
|---|---|
| `generated_at` | When the snapshot was built |
| `summer_total`, `free_total` | Cached totals (so dashboards can graph without parsing payload) |
| `payload` | Full `snapshot.json` as JSONB |

**`public.sf_daily_attendance`**, staff-edited actual headcount per week × day.

| Column | Meaning |
|---|---|
| `week_label` | e.g. `'June 1st-5th'`, matches `WEEK_ORDER` |
| `day_of_week` | `'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'` (CHECK constraint) |
| `count_upper`, `count_lower`, `count_free` | Headcounts entered by staff via the chip popup. All default 0, all CHECKed ≥ 0 |
| `marked_by` | Optional free-text identifier of who recorded it (not yet wired to a login system) |
| `marked_at` | `now()` on each upsert |

Unique on `(week_label, day_of_week)`, so re-saving the same day just
overwrites the prior value. Indexed on `week_label`.

### RPCs

All `SECURITY DEFINER` and gated by `claim_secret` (matching `SUPABASE_TOKEN_SECRET`) **except** the public read-only ones used by client-side fetches.

| Function | Purpose | Auth |
|---|---|---|
| `sf_upsert_camp_enrollments(claim_secret, rows jsonb)` | Bulk upsert into `sf_camp_enrollments`. Returns `(inserted, updated, total)`. Called from Apps Script in batches of 500. | `claim_secret` |
| `sf_insert_camp_snapshot(claim_secret, payload, summer_total, free_total, generated_at_override)` | Single insert into `sf_camp_snapshots`. `generated_at_override` lets the historical backfill set the real timestamp; live runs leave it null and use `now()`. | `claim_secret` |
| `sf_set_daily_attendance(claim_secret, p_week_label, p_day_of_week, p_count_upper, p_count_lower, p_count_free, p_marked_by)` | Upserts one row into `sf_daily_attendance`. Returns the saved row. Called from the chip popup on Save. | `claim_secret` |
| `sf_get_daily_attendance(p_week_label text default null)` | Returns rows from `sf_daily_attendance`. Filterable by week or returns everything. Called once on first dashboard render and re-called whenever a save happens. | **public** (anon) |
| `sf_recent_camp_totals(days_back int default 60)` | Returns `(snapshot_date, summer_total, free_total)` aggregated to one row per UTC date (latest snapshot of that day). Used by the dashboard sparkline. | **public** (anon) |

⚠ **Security note**: The dashboard JS embeds the `claim_secret` directly
for the attendance save RPC, so anyone who views the page source can write
attendance. This is acceptable today because the dashboard is embedded
behind the GHL portal (which gates access), but if it ever goes fully
public, swap `sf_set_daily_attendance` for a session-token model.

### One-time backfill

`Tom_Systema_Floyd/sheets-snapshot/apps-script/Snapshot.js` plus the
`scratch/backfill_sf_history.py` script (in `.claude/scratch/`, gitignored)
loaded every prior `history/*.json` into `sf_camp_snapshots` so the
sparkline has trend data going back to May 1, 2026.

## Dashboard JS architecture (`index.html`)

Single IIFE at the bottom of the HTML. State lives on `state.*`. Key
collaborators:

| Function | Responsibility |
|---|---|
| `loadSnapshot()` | Fetches `snapshot.json` with cache-busted query and `cache: 'no-store'`. Renders, then schedules the next refresh at +60s. |
| `getView()` | Slices the snapshot by `state.filter` (`summer` / `free` / `afterschool`) and returns the shape KPI/donut/bars consume. Falls back to top-level `weekOrder` if the slice doesn't carry its own. |
| `renderKpis(view)` | Animates KPI numbers; calculates occupancy from `getCap()` × `numWeeks` (numWeeks uses the slice's `weekOrder.length` so free vs summer occupancy is correct). |
| `renderBars(view)` | Stacked horizontal bars per week. |
| `renderDonut(view)` | Upper vs Lower campus donut. |
| `renderCapControls()` | The editable Capacity Targets panel. Reads/writes `localStorage` key `sf-caps-v1-<filter>`. |
| `renderRosterPanel()` | Search + quick-filter + week-card grid + daily attendance strip + click-to-expand entry detail. |
| `renderOpsStrip()` | Counts allergies + data-quality issues, populates the two chips. |
| `renderSparkline()` | Reads `state.recentTotals` (lazy-loaded from `sf_recent_camp_totals` RPC) and draws a 120×34 SVG path inside the Unique Students KPI card. |
| `loadRecentTotals()` | Fetches from Supabase via the anon key. Result is cached for the session. |
| `loadAttendance(force?)` | Lazy-loads `state.attendanceByWeek` via `sf_get_daily_attendance`. Called on first roster render and whenever `state.chartMode` flips to `'attendance'`. `force=true` bypasses the cache. |
| `saveAttendanceCell(week, day, upper, lower, free)` | POSTs to `sf_set_daily_attendance`, updates `state.attendanceByWeek` in place, returns the saved row. Triggered by the Save button in the chip popup. |
| `openAttendanceModal(week, day)` | Opens the focused per-day attendance popup. Prefills inputs from existing row or expected counts. |
| `wireChartModeToggle()` / `wireDayChipClicks()` / `wireAttendanceModal()` | One-shot event wiring helpers that guard against double-binding via a `data-wired="1"` attribute. |

### Persisted state (`localStorage`)

| Key | Purpose |
|---|---|
| `sf-caps-v1-summer`, `sf-caps-v1-free`, `sf-caps-v1-afterschool` | Per-tab campus + per-day caps used for occupancy math |
| `sf-filter` | Last-active filter so the page reopens on the same tab |

### Auto-refresh

After every successful `loadSnapshot()`, `setTimeout(loadSnapshot, 60_000)`
keeps the dashboard fresh. There is no websocket; the 5-min Apps Script
write + 60-second client poll means staff see up to ~6 minutes of staleness
in the worst case.

## Roster entry click-to-expand

Click any student row in the roster (anywhere, name, 🥪 badge, or ⚠ badge)
and an inline detail card slides down inside that week column, showing:

- Camp type + week + campus
- Mon-Fri attendance chips (filled = attending)
- Full lunch order text (free-text from the Lunch column)
- Breakfast order
- School (free camp only)
- Parent email (`mailto:` link) or "Missing" badge
- Allergy notes (full text, in an amber callout)
- Additional notes

Only one entry is open at a time per panel; clicking another row collapses
the previous one. Entry data is JSON-encoded into a `data-entry` attribute
on each `<li>` so the click handler doesn't need to re-walk
`state.snapshot.roster`.

## Ops strip detail panels

Two chips above the roster, each toggles a detail panel inline.

### Allergies

Groups by student name so a kid with allergies in 4 weeks shows once, with
the affected weeks summarized in the meta column. Click any row to reveal
the full allergy text in an amber-bordered slide-down. Single-row-open per
panel.

Counts respect the **main filter (paid/free)** but ignore the
roster quick-filter and search bar, so users always see the full backlog
even when the roster grid is filtered down.

### Data issues (grouped by student)

The panel is one card per kid summarizing every issue across every week.
Each card shows:

- Student name + `N weeks affected` summary
- **Missing-field chips**, the union of fields blank in that kid's rows:
  - `Student name` (when the cell is blank)
  - `Campus` (when the Free Camp row has no explicit campus)
  - `Email`, `Lunch`, `Age`, `Days attending` (paid sheets)
  - `School`, `Parent/Guardian name`, `Grade` (free sheets)
- **Per-source-sheet links**, one line per source sheet:
  `PAID Upper · Jun 1–5, Jun 8–12 · rows 14, 18 [Open ↗]`
  The Open link jumps straight to that sheet in a new tab.

Snapshot.js classifies each row's `missingFields` array in `readCampSheet_`
and `readFreeSheet_` and propagates them through `buildRoster_` along with
`sourceSheetId`, `sourceTabName`, and `sourceRow`. The frontend's
`collectDataIssues()` then groups by lowercased student name and unions the
fields + source locations.

The `Incomplete` quick-filter on the roster matches the same `incomplete`
predicate, so users can drill from the count into the actual rows in-grid.

## Attendance Tracker

Staff record actual daily attendance directly on the dashboard. The data
lives in the Supabase table `sf_daily_attendance` (one row per
`(week_label, day_of_week)`), exposed through two RPCs gated by the shared
`claim_secret`.

### Where to mark attendance

Inside each week card on the Student Rosters panel, every Mon-Fri chip in
the daily-attendance strip is a clickable button. Clicking it opens a
focused popup for that specific (week × day) cell:

- **Header**: `Mon attendance · Jun 1–5`
- **Expected row**: `Expected: 30 (U13 · L17 · F0)`, derived from the
  current registered roster honoring each kid's days[5] flags
- **Three editable inputs** (Upper / Lower / Free), prefilled with either
  the previously saved actual counts or the expected counts if none recorded
- **Live total** display below the inputs
- **Save / Clear** buttons; success state collapses the modal after 0.7s
- **Last-saved hint**: `Last saved today 14:32` if the row was already in
  Supabase

Chips that already have an attendance row recorded get a green tint + a `✓`
check in the corner so staff can scan a week at a glance and see which days
are still pending. The tooltip on the chip shows the saved count + when it
was marked.

### Chart-mode toggle (Registrations vs Attendance)

The bars chart card header has a small `[Registrations] [Attendance]`
pill toggle. State is held in `state.chartMode`. Switching to Attendance:

1. Lazy-loads `state.attendanceByWeek` from Supabase via `sf_get_daily_attendance` (cached for the session, invalidated whenever the user saves)
2. Replaces each week's per-campus counts with the **summed Mon-Fri actual** split by Upper / Lower / Free
3. Renders the **expected (registered) counts as dashed ghost outlines** behind each filled bar, so staff see actual vs expected side-by-side without flipping back to the Registrations view
4. Updates the chart heading to "Attendance by Week" and appends a legend hint explaining the dashed outlines
5. Clicking any bar still opens the existing day modal, which in attendance mode shows the per-day actuals (read-only view; staff use the chip-based popup to edit)

### Cap labels on the chart

Cap thresholds are still shown as dashed lines across the chart (one per
campus, in that campus's color), but the **numeric cap values** now live
exclusively in the legend below the chart as `Upper Campus, cap 13` /
`Lower Campus, cap 13`. This was changed because the in-chart "Upper cap 13"
text used to overlap bar values when a bar's count was close to the cap.
The legend values update live whenever the caps are edited in Capacity
Targets.

## Sparkline (14-day growth)

Tucked inside the **Unique Students** KPI card. 120×34 SVG with an area fill,
a 1.6px stroke line, and a 2.4px dot on the latest point. The label beside
it reads `+58 14d` (positive = green, negative = amber, flat = blue), showing
the net change between the first and last point.

Data source: `sf_recent_camp_totals` RPC on Supabase, called with `days_back: 60`. The dashboard takes the last 14 entries and picks `summer_total` or
`free_total` depending on the active main filter. Hidden on the after-school
tab and on first paint until the fetch resolves; cached for the session so
filter toggles don't refetch.

## Mobile behavior

Desktop layout is the default. Two media queries fire on mobile:

- `@media (max-width: 700px)`, KPI cards shrink, capacity inputs become
  tappable (>= 36px height), filter pills wrap.
- `@media (max-width: 520px)`, KPI grid drops to 2 columns with Top Week
  spanning both, donut shrinks, roster goes single-column, lunch tables
  scroll horizontally inside their card instead of crushing the Mon-Fri
  columns.

The horizontally-scrollable elements (`.dash-nav`, `.filter`, `.week-block`)
are intentional, every other container is locked to `width:100%; min-width:0`
so the page itself never produces horizontal page-scroll on iOS.

## Adding a new feature without bloating the UI

Conventions used so far:

- **No new tabs/pages.** All features land inline under an existing region.
- **Click-to-expand for detail surfaces.** Use the `.ops-detail` pattern (chip
  toggles a sibling panel) for anything that doesn't need to be on screen
  constantly.
- **Quick-filter pills** live in the roster header for anything that filters
  the existing student list.
- **Slim chips** (`.ops-chip`) carry a count badge. Color-code the badge
  by severity (amber for allergies, gold for data quality).
- **Tiny inline charts** (sparkline) inside an existing KPI card beat new
  cards.

If you're adding something that *cannot* fit any of these patterns, prefer
adding it to `lunches.html` (which already exists as a sibling page) over
spawning a third page. Each new page is one more thing to mobile-test, embed
into GHL, and document.

## Edge cases

| What happens when… | Behavior |
|---|---|
| A new week tab is added to one paid sheet only | Snapshot.js resolves the tab by name; `summer.weekOrder` lists the week; `free.weekOrder` doesn't, so the Free view never shows it |
| A tab name doesn't match any `WEEK_ORDER` entry | `resolveWeek_` falls back to positional (`fallbackIndex`); if out of range, the tab is skipped entirely |
| Two rows for the same kid in the same week tab | Per-week dedup by `nameKey_` (lowercased + whitespace-collapsed name). One enrollment counted. |
| A kid is enrolled in both Free and Paid for the same week | Counted once toward `combined.total`, twice toward `byWeek` (once in summer aggregate, once in free aggregate) |
| Lunch column has free-text the parser doesn't recognise | Falls into the `other` category with the raw text as both label and subtypeKey, visible in lunches.html in the Other bucket so you can spot the pattern and extend `parseLunch_` |
| Apps Script trigger fails for one tick | The lock skips overlap; the next tick rebuilds from current sheet state. Supabase will show a small gap in `sf_camp_snapshots.generated_at` but the live snapshot.json is always a full rebuild, no incremental state to corrupt |
| Supabase write fails | Logged; GitHub push still runs. Dashboard keeps working from snapshot.json. |
| User picks a compare-to date that doesn't have a history file | Dashboard shows "No data for that date" in the compare status text; KPI deltas don't render |
| `localStorage` for caps is corrupted/missing | Falls back to `CAP_DEFAULTS_BY_FILTER` from the IIFE constants |
| Two browser tabs both edit a cap | Last write wins per tab; no cross-tab sync, staff are warned in the panel subtitle |
| Two staff mark attendance for the same (week × day) at the same time | Last write wins. `sf_set_daily_attendance` is an upsert keyed on `(week_label, day_of_week)`. The losing tab won't know it's been overwritten until next render. Acceptable for the current low-volume use case. |
| Attendance saved before any registration row exists for that week | The save still succeeds (no foreign key). The chip will show ✓ and the saved counts even though the "expected" reads 0. |
| Chart-mode toggle clicked before attendance data loads | The toggle flips immediately and `loadAttendance()` is kicked off; `renderBars` re-runs once the fetch resolves. |
| Filter set to "After-School" | The tab is hidden via `hidden` attribute today, but the underlying view-resolution + KPI/donut/bars switch logic still works. Un-hide the button to bring it back. |

## When you change something

If you change snapshot shape, dashboard rendering, or any Supabase RPC,
**update this doc in the same change**. The "shape" tables above are the
spec. The pipeline is tightly coupled enough that one drift breaks the
downstream consumer silently (a typo in a roster field name will just
render empty cells, not throw).
