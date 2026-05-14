# Systema Floyd — App Documentation

This folder is the canonical reference for every Systema Floyd automation,
script, and data pipeline. It exists so that any operator (human or AI) can pick
up cold and understand exactly how a piece of the system works without having
to reverse-engineer code or trace through GHL workflows.

> **For AI assistants:** Read every file in this folder before making changes
> to any Systema Floyd app. Each doc is self-contained but they reference each
> other where the apps interact (e.g. the registration system writes to sheets
> that the waiver matcher reads). Knowing all four lets you answer cross-cutting
> questions and avoid breaking adjacent systems.

## What's in here

| File | App | What it does |
|---|---|---|
| [registration_system.md](./registration_system.md) | **Camp Registration System + Discrepancy Check** | Full pipeline: parent submits a Free Camp / Summer Camp form on `systemafloyd.com` → GHL routing workflow writes a row in the right Google Sheet → dashboard renders it. Includes the Apps Script failsafe that auto-fixes missed writes, with Supabase tombstones, cell notes, and email alerts that name the failed workflow. |
| [school_enrollment_router.md](./school_enrollment_router.md) | **School Enrollment Router** (Apps Script) | Routes every new student enrollment from a single Main Table into the correct per-school spreadsheet, auto-creating that spreadsheet from a Monthly or Quarterly template the first time it's needed. Defensive against deleted/moved files; uses three-tier name matching (exact → case-insensitive → Levenshtein fuzzy). |
| [camp_day_validator.md](./camp_day_validator.md) | **Camp Day Validator** (browser JS) | Client-side JS pasted into a Custom Code element at the bottom of the GHL summer camp signup form. Keeps the "Select Camp Duration" dropdown in sync with the per-week day checkboxes; blocks form submission until every chosen week has the right number of days ticked. |
| [waiver_matcher.md](./waiver_matcher.md) | **Waiver Matcher** (Apps Script) | Bound to the Waiver APP spreadsheet. On every change, scans every camp roster sheet in Drive, fuzzy-matches student names from waiver rows against camp rows by email + Jaro-Winkler name similarity. Highlights matched cells green and adds health/allergy info as a cell note. |

## Reading order (for a new contributor)

1. **registration_system.md** first — it's the core of the system and the
   document with the most surface area. Everything else relates to or runs
   alongside it.
2. **camp_day_validator.md** next — it's the front-end gatekeeper that
   produces the form submissions the registration system processes.
3. **waiver_matcher.md** — runs against the rosters that the registration
   system writes.
4. **school_enrollment_router.md** — separate flow for non-camp school
   enrollments. Same author / pattern, but operates on a different intake.

## How the four apps relate

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
    └────────┬────────┘  └───────────────────┘   └────────────────────┘
             │
             ▼
    ┌─────────────────┐         ┌──────────────────────────┐
    │ Snapshot.js +   │         │ DiscrepancyCheck.js      │
    │ dashboard       │         │ failsafe (every 15 min)  │
    │                 │         │ + Supabase tombstones    │
    └─────────────────┘         └──────────────────────────┘
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

If you change behavior in any of these four apps, **update the corresponding
doc in the same change**. The docs in this folder ARE the spec. If they drift
from reality, the next person (human or AI) will make incorrect assumptions
and break something.

## Where the actual code lives (quick reference)

| App | Code location |
|---|---|
| Registration System (Discrepancy Check) | `Tom_Systema_Floyd/sheets-snapshot/apps-script/DiscrepancyCheck.js` |
| Registration System (Snapshot polling) | `Tom_Systema_Floyd/sheets-snapshot/apps-script/Snapshot.js` |
| School Enrollment Router | Apps Script bound to the central enrollment intake spreadsheet (not in this repo) |
| Camp Day Validator | `Tom_Systema_Floyd/Form/script.html` (also pasted into a GHL Custom Code element) |
| Waiver Matcher | Apps Script bound to the Waiver APP spreadsheet (not in this repo) |
