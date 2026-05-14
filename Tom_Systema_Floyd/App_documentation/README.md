# Systema Floyd — App Documentation

This folder is the canonical reference for every Systema Floyd automation,
script, and data pipeline. It exists so that any operator (human or AI) can pick
up cold and understand exactly how a piece of the system works without having
to reverse-engineer code or trace through GHL workflows.

> **For AI assistants:** Read every file in this folder before making changes
> to any Systema Floyd app. Each doc is self-contained but they reference each
> other where the apps interact (e.g. the registration system writes to sheets
> that the waiver matcher reads, and that the billing dashboard prices).
> Knowing all of them lets you answer cross-cutting questions and avoid
> breaking adjacent systems.

## What's in here

| File | App | What it does |
|---|---|---|
| [registration_system.md](./registration_system.md) | **Registration System + Discrepancy Check** | Full pipeline for Free Camp, Summer Camp, AND After School: parent submits a form on `systemafloyd.com` → GHL routing workflow writes a row in the right Google Sheet → dashboard renders it. Includes the Apps Script failsafe that auto-fixes missed writes for all three forms, with Supabase tombstones, fuzzy-name dedup (catches "Aria" vs "Aria Falzone" as the same kid), cell notes, and email alerts that name the failed workflow. After School writes go to the central Main Table (then the School Enrollment Router takes over). |
| [dashboard.md](./dashboard.md) | **Camp Dashboard** (browser + Apps Script) | The staff-facing dashboard at `dashboard/index.html` and the Apps Script `Snapshot.js` pipeline that feeds it. Reads the 4 roster sheets every 5 min, builds `snapshot.json` + history archive + Supabase mirror, and renders KPIs, charts, capacity targets, lunch prep, ops alerts (allergies + data quality), 14-day growth sparkline, and a click-to-expand student roster. |
| [billing_dashboard.md](./billing_dashboard.md) | **Billing Dashboard** (Apps Script) | Sheet-driven billing pipeline: every 5 min, reads the camp + after-school registration sheets, prices each enrollment via the team-editable `Pricing` tab, inflates unit prices with inline tax + processing fee, and diffs against the live Dashboard. Handles cancellations (owed → canceled) and refunds (paid → refund-needed) automatically. Also captures the $1 GHL CC verification fee for audit. |
| [school_enrollment_router.md](./school_enrollment_router.md) | **School Enrollment Router** (Apps Script) | Routes every new student enrollment from a single Main Table into the correct per-school spreadsheet, auto-creating that spreadsheet from a Monthly or Quarterly template the first time it's needed. Defensive against deleted/moved files; uses three-tier name matching (exact → case-insensitive → Levenshtein fuzzy). |
| [camp_day_validator.md](./camp_day_validator.md) | **Camp Day Validator** (browser JS) | Client-side JS pasted into a Custom Code element at the bottom of the GHL summer camp signup form. Keeps the "Select Camp Duration" dropdown in sync with the per-week day checkboxes; blocks form submission until every chosen week has the right number of days ticked. |
| [waiver_matcher.md](./waiver_matcher.md) | **Waiver Matcher** (Apps Script) | Bound to the Waiver APP spreadsheet. On every change, scans every camp roster sheet in Drive, fuzzy-matches student names from waiver rows against camp rows by email + Jaro-Winkler name similarity. Highlights matched cells green and adds health/allergy info as a cell note. |

## Reading order (for a new contributor)

1. **registration_system.md** first — it's the core of the system and the
   document with the most surface area. Everything else relates to or runs
   alongside it.
2. **camp_day_validator.md** next — it's the front-end gatekeeper that
   produces the form submissions the registration system processes.
3. **dashboard.md** — the operational view of the rosters the registration
   system populates.
4. **billing_dashboard.md** — the financial view of the same rosters,
   pricing each enrollment + handling refunds.
5. **waiver_matcher.md** — runs against the rosters that the registration
   system writes.
6. **school_enrollment_router.md** — separate flow for non-camp school
   enrollments. Same author / pattern, but operates on a different intake.

## How the apps relate

```
                       ┌──────────────────────────┐
                       │  Parent on the website   │
                       └──────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────────┐
              │                   │                       │
              ▼                   ▼                       ▼
       Camp form           Waiver form              School enrollment
   (validated by         (parents sign)             form (school intake)
    Camp Day Validator)        │                          │
              │                │                          │
              ▼                ▼                          ▼
      ┌──────────────┐ ┌────────────────┐      ┌────────────────────┐
      │ GHL routing  │ │ Waiver APP     │      │ Main Table         │
      │ workflow     │ │ spreadsheet    │      │ (intake spreadsheet)│
      └──────┬───────┘ └────────┬───────┘      └─────────┬──────────┘
             │                  │                        │
             ▼                  ▼                        ▼
    ┌─────────────────┐  ┌───────────────────┐   ┌────────────────────┐
    │ 4 camp roster   │  │ Waiver Matcher    │   │ School Enrollment  │
    │ sheets          │◄─┤ scans rosters,    │   │ Router routes by   │
    │ (Free Up/Lo,    │  │ highlights        │   │ school name to     │
    │  Summer Up/Lo)  │  │ matched students  │   │ per-school sheets  │
    └────┬───────┬────┘  └───────────────────┘   └────────────────────┘
         │       │
         │       └────────────────────────────┐
         ▼                                    ▼
    ┌─────────────────┐         ┌─────────────────────────┐
    │ Snapshot.js +   │         │ BillingFromSheets.js    │
    │ Camp Dashboard  │         │ Billing Dashboard       │
    │ (operational    │         │ (prices each enrollment,│
    │  view, every    │         │  inflates with tax+fee, │
    │  5 min)         │         │  diff-based reconcile)  │
    └─────────────────┘         └─────────────────────────┘
                ▲                          ▲
                │                          │
         ┌──────┴──────────────────────────┴─────┐
         │ DiscrepancyCheck.js failsafe          │
         │ (every 15 min, Supabase tombstones)   │
         │ Keeps the rosters accurate so both    │
         │ dashboards downstream stay trustworthy│
         └────────────────────────────────────────┘
```

## Conventions used across all docs

- **Form IDs, sheet IDs, workflow IDs** are listed verbatim so they're
  greppable. Don't paraphrase them.
- **GHL custom field IDs** appear with both the opaque ID and the
  human-readable field name (e.g. `0H3m5fBvXwD3frq75XKa = "Camp Week Choices
  (Free Camp)"`).
- **Configuration constants** are surfaced near the top of each doc so a
  reader can change behavior without spelunking through code.
- **Edge cases** get their own table at the bottom of each doc so future
  contributors can grep for "what happens when X."

## When you change something

If you change behavior in any of these apps, **update the corresponding
doc in the same change**. The docs in this folder ARE the spec. If they drift
from reality, the next person (human or AI) will make incorrect assumptions
and break something.

## Where the actual code lives (quick reference)

| App | Code location |
|---|---|
| Registration System (Discrepancy Check) | `Tom_Systema_Floyd/sheets-snapshot/apps-script/DiscrepancyCheck.js` |
| Registration System (Snapshot polling) | `Tom_Systema_Floyd/sheets-snapshot/apps-script/Snapshot.js` |
| Dashboard pages | `Tom_Systema_Floyd/dashboard/index.html`, `lunches.html` |
| Dashboard data | `Tom_Systema_Floyd/dashboard/snapshot.json` + `dashboard/history/*.json` (auto-pushed by Snapshot.js) |
| Supabase mirror (read by other tools) | Tables `sf_camp_enrollments`, `sf_camp_snapshots` in Zona Libre project `nroeiabeirifurdaybyo` |
| Billing Dashboard (sheet-driven pipeline) | `Tom_Systema_Floyd/Billing dashboard/apps-script/BillingFromSheets.js` |
| Billing Dashboard (Pricing tab + catalog) | `Tom_Systema_Floyd/Billing dashboard/apps-script/PricingGuide.js` |
| Billing Dashboard ($1 GHL fee polling) | `Tom_Systema_Floyd/Billing dashboard/apps-script/Polling.js` |
| Billing Dashboard sheet (the operator UI) | Apps Script bound to `Systema Floyd — Billing Dashboard` Google Sheet (script ID `19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH`) |
| School Enrollment Router | Apps Script bound to the central enrollment intake spreadsheet (not in this repo) |
| Camp Day Validator | `Tom_Systema_Floyd/Form/script.html` (also pasted into a GHL Custom Code element) |
| Waiver Matcher | Apps Script bound to the Waiver APP spreadsheet (not in this repo) |
