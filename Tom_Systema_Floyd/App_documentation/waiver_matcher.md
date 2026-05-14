# Systema Floyd — Waiver Matcher

> Google Apps Script bound directly to the **Waiver APP** spreadsheet.
> Automatically cross-references every parent waiver submission against every
> school registration spreadsheet in the Drive, visually flags matched
> students in green, and surfaces any allergy or health information as a cell
> note — zero manual effort required.

## How it works (end to end)

1. A parent submits a waiver through the existing form. Your automation adds a
   new row to the Waiver APP sheet.
2. The `onChange` trigger fires instantly.
3. The script reads every row of the Waiver APP sheet and builds a list of
   waiver entries (email + student names + health/allergy data).
4. It scans every Google Sheet in the Drive that the account owns, skipping a
   defined exclusion list.
5. For each sheet, it auto-detects which column is the email and which columns
   are student names — **no hardcoded positions**.
6. It compares every student name in every camp sheet against every waiver
   entry with a matching email. Matching uses **Jaro-Winkler fuzzy matching
   at 90% minimum similarity**.
7. On a confirmed match:
   - The student name cell is highlighted **light green** (`#B7E1CD`).
   - If the waiver has a real health/allergy entry for that student, it is
     added as a cell note (e.g. `⚠️ Health/Allergies: Allergic to cashews`).
8. Every new match is recorded in the **Match Logs** tab inside the Waiver APP
   spreadsheet.

## Configuration constants

These are at the top of `Code.gs` and are the only things you would ever need
to edit.

| Constant | Value | Purpose |
|---|---|---|
| `WAIVER_SS_ID` | `1_kFKI6BIR...` | The spreadsheet ID of the Waiver APP. **Do not change** unless you move the sheet. |
| `LOG_SHEET_NAME` | `'Match Logs'` | Name of the logging tab inside the Waiver APP. |
| `MATCH_THRESHOLD` | `0.90` | Minimum name similarity score (0 to 1) required for a match. `0.90` = 90%. |
| `HIGHLIGHT_COLOR` | `'#B7E1CD'` | The light green hex color applied to matched student name cells. |

## Excluded files

Any Google Sheet whose name contains one of these strings (case-insensitive)
is completely ignored during scanning:

- `dashboard`
- `waiver & registration`
- `waiver and registration`
- `after school registration application`
- `waiver app`

To skip additional files in the future, add their name (or a distinctive
substring) to the `EXCLUDED_KEYWORDS` array in `Code.gs`.

## Column auto-detection

The script never uses hardcoded column letters. Instead it scans the first row
of every sheet and looks for headers that contain any of the following
keywords (case-insensitive substring match):

| Detected field | Keywords |
|---|---|
| Email columns | `email` |
| Student name columns | `student name`, `student 1 name`, `student 2 name`, `student 3 name`, `student 4 name`, `student 5 name`, `child name`, `participant name`, `name of student`, `camper name`, `athlete name` |
| Health/allergy columns (Waiver APP only) | `health`, `allerg`, `medical`, `condition` |

If a sheet has no detectable email column or no detectable student name column,
it is silently skipped. It cannot be matched and won't cause errors.

## Name matching logic

**Email alone is never sufficient to create a match.** Both email **and** name
must match. This is intentional, because one parent can register three kids,
and you only want to highlight the ones actually named on the waiver.

The matching uses **Jaro-Winkler similarity**, a string distance algorithm
well-suited for names, with three tiers:

1. **Exact match.** Both strings are identical after lowercasing and trimming.
   Score: 1.0 (100%). Always wins.
2. **First-name boost.** If the first names match exactly and are at least 3
   characters long, the score is raised to a minimum of 0.92 (92%). This
   handles cases like "Emily" matching "Emily Johnson" when the camp sheet
   only has a first name.
3. **Full Jaro-Winkler.** The full string similarity is calculated and used as
   the base score. Handles typos, transpositions, and minor spelling
   differences.

The highest score across all waiver entries for that email is used. If it
meets or exceeds `MATCH_THRESHOLD` (0.90), the cell is highlighted.

## Health & allergy notes

When a student is matched and highlighted green, the script also checks
whether the waiver has a meaningful health/allergy entry for that student.

Entries that are ignored (not added as notes), the full list of "empty"
patterns rejected by regex:

```
none, no, n/a, na, n.a, n.a., no allergies, no known allergies, -
```

These are matched case-insensitively and with surrounding whitespace stripped.

If the entry is anything else (e.g. "Allergic to cashews", "EpiPen required",
"sugar / dairy / gluten allergy"), it is added as a cell note in the format:

```
⚠️ Health/Allergies: [text from waiver]
```

> **Important behavior:** The note is only set if the cell has no existing
> note. This protects any notes you may have added manually. If you want to
> update a note, clear it manually and the next scan will repopulate it from
> the waiver data.

The note is applied both to new green cells (on first match) and to
already-green cells that are missing a note (catches students matched before
this feature existed). Re-highlighting and re-logging are skipped for
already-green cells.

## The Match Logs tab

Every new match (cells that were not already green) is appended to the
**Match Logs** sheet inside the Waiver APP. The sheet is created automatically
the first time a match is found.

| Column | Contents |
|---|---|
| Timestamp | Date and time the match was made |
| File Name | Name of the school spreadsheet where the match was found |
| Sheet Tab | Name of the specific tab within that file |
| Row | Row number in that tab (e.g. `ROW 4`) |
| Camp Student Name | Exact text from the cell in the camp sheet |
| Email | Parent email that linked the two records |
| Matched Waiver Name | The name from the waiver that was matched |
| Confidence | Match score as a percentage (e.g. `100%` or `92%`) |

Already-green cells that get a note backfilled are **not re-logged**. They
already have an entry from their original match.

## Functions reference

| Function | How to run | Purpose |
|---|---|---|
| `onWaiverChange(e)` | Automatically by trigger | The trigger entry point. Fires on any spreadsheet change and calls `runMatcher()`. |
| `runMatcher()` | Called internally | The main orchestrator. Loads waiver data, gets all target files, calls `processSheet()` for each, then writes logs. |
| `getWaiverEntries()` | Called internally | Reads the Waiver APP `Sheet1`, finds email/student/health columns dynamically, returns structured data. |
| `getAllTargetSheets()` | Called internally | Returns all Google Sheets in the Drive owned by this account, excluding the skip list. |
| `processSheet(sheet, waiverData, logRows, fileName)` | Called internally | Processes one sheet tab: detects columns, loops rows, runs matching, sets backgrounds and notes. |
| `findBestNameMatch(campName, waiverNames)` | Called internally | Fuzzy-matches a single camp cell value against a list of waiver names, returns best match and score. |
| `jaroWinkler(s1, s2)` | Called internally | Pure Jaro-Winkler similarity calculation. Returns `0.0` to `1.0`. |
| `writeLog(logRows)` | Called internally | Appends match rows to the Match Logs tab, creating it with styled headers if it doesn't exist. |
| `installTrigger()` | **Run once manually** | Installs the `onChange` trigger on the Waiver APP spreadsheet. Removes duplicates first. Only needs to be run again if the trigger was deleted. |
| `runMatcherManually()` | **Run manually anytime** | Forces a full re-scan of all files and all rows, same as if a new waiver had arrived. |

## Trigger details

The trigger type is `onChange` (not `onEdit`). This means it fires on any
structural change to the spreadsheet, **including when your existing
automation inserts a new row**. It does NOT require a human to be editing the
sheet. The trigger is installed on the Waiver APP spreadsheet itself.

To check if the trigger is active: go to **Extensions → Apps Script →
Triggers** (clock icon in the left sidebar). You should see one trigger:
`onWaiverChange`, type `onChange`, source `From spreadsheet`.

If the trigger is ever accidentally deleted, run `installTrigger()` once from
the editor to restore it.

## What happens with multiple students

The waiver sheet can have `Student 1 Name`, `Student 2 Name`, `Student 3
Name`, etc. The script handles all of them. **Health/allergy columns are
paired to student name columns by proximity** (the nearest health column to
the right of each student name column is assumed to belong to that student).

If a parent submits a waiver naming two of their three registered kids, only
those two will be highlighted. The third remains unhighlighted until a waiver
entry includes their name.

If the same parent submits multiple waivers over time (e.g. they registered
for camps, then signed up for new classes later), all of their waiver rows are
combined into one pool of student names and health data. So even if a
student's name only appears on one waiver submission, they can be matched
against registrations from any submission by that email.

## Edge cases handled

| Scenario | Behavior |
|---|---|
| Parent registers 3 kids, waiver only names 2 | Only the 2 named on the waiver are highlighted |
| Parent submits waiver before registering for camp | When the camp registration is added, the next scan (triggered by any change) will match it |
| Parent registers for camp, then completes waiver later | Full rescan on every trigger ensures nothing is missed |
| Mistyped student name (e.g. "Kortney" vs "Courtney") | Jaro-Winkler fuzzy match handles minor typos |
| First name only on waiver, full name in camp sheet | First-name exact match boost raises score to 92% minimum |
| Cell already highlighted green | Background is not re-applied; note is backfilled if missing |
| Cell already has a manually written note | Note is preserved; not overwritten |
| A new school spreadsheet is added to Drive | Automatically included in next scan, no code changes needed |
| Sheet has no email or student name column | Silently skipped without error |
| Health/allergy field says `"None"` or `"N/A"` | Ignored; no note is added |
| Real allergy (e.g. `"Allergic to cashews"`) | Added as cell note: `⚠️ Health/Allergies: Allergic to cashews` |
| File name contains `"waiver app"` | Excluded from scanning |

## How to force a full re-scan

Open **Extensions → Apps Script**, select `runMatcherManually` from the
function dropdown, and click **Run**. This processes every row in every file
exactly as if a new waiver had just arrived. Useful after bulk data imports,
after restoring deleted highlights, or any time you want to audit the current
state.

## Maintenance notes

- **To change the match sensitivity:** Edit `MATCH_THRESHOLD` in `Code.gs`.
  Lower = more lenient (e.g. `0.85`), higher = stricter (e.g. `0.95`). The
  current value of `0.90` is recommended for names.
- **To add more files to the skip list:** Add a distinctive substring of the
  file name (lowercase) to `EXCLUDED_KEYWORDS`.
- **To add more student name header variations:** Add the lowercase header
  text to `STUDENT_NAME_KEYWORDS`.
- **To change the highlight color:** Change `HIGHLIGHT_COLOR` to any valid hex
  code. Note: changing this will **not retroactively update**
  already-highlighted cells. The script skips cells matching the old color, so
  you'd need to clear highlights manually before re-running.
- **To clear all highlights and start fresh:** There is no built-in reset
  function. You would manually remove the green backgrounds from camp sheets,
  then run `runMatcherManually()`.
- **If you see duplicate trigger runs:** Run `installTrigger()`. It clears all
  existing `onWaiverChange` triggers before creating a fresh one, preventing
  duplicates.
