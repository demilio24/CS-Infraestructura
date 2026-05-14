# Systema Floyd, School Enrollment Router

> Google Apps Script bound to the central enrollment intake spreadsheet.
> Routes every new student enrollment from a single Main Table into the
> correct per-school spreadsheet, auto-creating that spreadsheet from a
> template the first time the school is needed.

## Overview

The script runs on edit, processes any unprocessed rows, and writes a status
back into the Main Table so each row visibly shows whether it was routed,
skipped, or errored.

## How it works (end to end)

1. A new enrollment row is added to the **Main Table** tab (by a form, an
   automation, or manual entry).
2. The on-edit trigger fires and calls `scanUnprocessedRows()`.
3. The script walks every row from row 2 down. Any row with a value in the
   **Status** column (H) is skipped. Any row missing a student name is skipped.
4. For each unprocessed row, it determines the **lookup name**, normally the
   value in **Class** (column F), except when Class is `Neighborhood Kids
   Schools`, in which case the **NKS** value (column G) is used instead.
5. It looks up that name in the **Source** tab using a three-tier match:
   exact, case-insensitive, then Levenshtein fuzzy.
6. The matched Source row provides the school name, billing method (Monthly or
   Quarterly), and the stored file ID of that school's spreadsheet (if one
   exists).
7. **File resolution** runs in this order:
   1. If a stored file ID exists and the file is still alive, use it.
   2. If the stored ID is missing or invalid, search the destination folder
      for a file with the school's exact name. If found, recover that ID and
      write it back to Source.
   3. If no file exists anywhere, create a new spreadsheet from the
      appropriate template (Monthly or Quarterly), move it to the destination
      folder, share it with the standard editors, and save its ID back to
      Source.
8. The student's **name, email, t-shirt size, and grade** are appended to the
   next empty row in the school's spreadsheet.
9. The Status column is set to `Processed [timestamp]`, or to an `ERROR:` /
   `SKIPPED:` message if something went wrong.
10. Every step is written to the **Logs** tab with severity, row number,
    school name, message, and details.

## Configuration constants

These are at the top of the script and are the only things you would normally
edit.

| Constant | Value | Purpose |
|---|---|---|
| `MAIN_TAB` | `'Main Table'` | The intake tab where new enrollments arrive |
| `SOURCE_TAB` | `'Source'` | The lookup tab listing every school, its billing method, and its file ID |
| `LOGS_TAB` | `'Logs'` | The diagnostic log tab |
| `TEMPLATE_MONTHLY_TAB` | `'Template-Monthly'` | The template used when a school's billing method is Monthly |
| `TEMPLATE_QUARTERLY_TAB` | `'Template-Quarterly'` | The template used when a school's billing method is Quarterly |
| `EDITORS` | `['systemafloyd@gmail.com', 'systemahenry@gmail.com']` | Accounts automatically added as editors to every newly created school file |
| `DESTINATION_FOLDER_ID` | `'1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V'` | The Drive folder where every per-school spreadsheet lives |

## Main Table column layout

The Main Table column positions are hardcoded as constants. The layout cannot
be changed without updating the script.

| Column | Index | Constant | Contents |
|---|---|---|---|
| A | 1 | `COL_STUDENT` | Student name |
| B | 2 | `COL_EMAIL` | Parent or student email |
| C | 3 | `COL_TSHIRT` | T-shirt size |
| D | 4 | `COL_GRADE` | Grade |
| E | 5 | `COL_DATE` | Enrollment date (read but not currently routed) |
| F | 6 | `COL_CLASS` | Class name (primary lookup) |
| G | 7 | `COL_NKS` | Neighborhood Kids Schools name (used only when Class is "Neighborhood Kids Schools") |
| H | 8 | `COL_STATUS` | Processing status. **The presence of any value here causes the row to be skipped on the next scan.** |

## Source tab layout

The Source tab is the routing map between class names and school spreadsheets.

| Column | Contents |
|---|---|
| A | School name (matched against the lookup name) |
| B | Billing method (`Monthly` or `Quarterly`) |
| C | File ID of the school's spreadsheet. Auto-populated by the script the first time the school is routed. **Can be left blank for new schools.** |

The script writes back to column C in two situations: when a new file is
created, and when a missing or invalid stored ID is recovered by folder search.

## Lookup logic

The lookup name is built per row. If the **Class** column is `Neighborhood
Kids Schools` (case-insensitive) and the **NKS** column is non-empty, the NKS
value is used as the lookup name. Otherwise the Class value is used directly.

That lookup name is then matched against Source column A in three tiers, in
order:

1. **Exact match.** Trimmed string comparison, case-sensitive. First hit wins.
2. **Case-insensitive match.** Trimmed and lowercased comparison.
3. **Fuzzy match.** Levenshtein distance against every Source row. The closest
   candidate is accepted only if its distance is at most
   `max(3, floor(targetLength * 0.3))`. So short names allow up to 3 character
   differences, longer names allow up to 30%.

If none of the three tiers produces a match, the row is marked
`ERROR: no school match` and the best fuzzy candidate (with its distance) is
logged for diagnostics.

## File resolution logic

This is the core defensive piece of the script. **It guarantees that the same
school never gets two spreadsheets created for it**, even if the Source file
ID gets cleared, the file gets moved, or someone manually deletes a file.

Order of operations in `findOrCreateSchoolFile`:

1. Search the destination folder by **exact file name**. If a file matching
   the school's name exists, reuse it. Its ID is written back to Source
   column C so the next routing skips this search entirely.
2. If folder search returns nothing, **create a new file**. The appropriate
   template tab is copied in, the default Sheet1 is deleted, the file is
   moved to the destination folder, the standard editors are added, and the
   new ID is saved back to Source.

`processRow` calls `findOrCreateSchoolFile` whenever the stored Source ID is
empty OR when `fileExists()` returns false (the stored ID points to a deleted,
trashed, or inaccessible file). In all other cases the stored ID is used
directly.

## File creation details

When a new school file is created in `createSchoolFile`:

1. The billing method (Source column B) is read. If it equals `quarterly`
   (case-insensitive), the Quarterly template is used. Anything else,
   including blank, falls through to the Monthly template.
2. A new spreadsheet is created with the school's exact name as its filename.
3. The file is moved from the user's My Drive root into the destination folder.
4. The chosen template tab is copied into the new spreadsheet and renamed
   `Enrollment`.
5. The default Sheet1 is deleted, leaving only the Enrollment tab.
6. Each address in `EDITORS` is added as an editor. **Failures here are
   logged as warnings but do not abort file creation.**
7. The new file's ID is written back to Source column C.

If any step before step 7 throws, the row is marked `ERROR:` and the partial
file (if any) is left in place. Re-running the row will trigger the
folder-search recovery path, which will find and reuse the partially-created
file rather than creating a duplicate.

## Append student logic

`appendStudent` opens the school's spreadsheet, takes the first sheet, finds
the last row with content, and writes the student's name, email, t-shirt, and
grade into the next row in columns A through D. **No header row is created or
validated.** The template is assumed to provide its own headers.

## Logging

Every meaningful action writes a row to the **Logs** tab.

| Column | Contents |
|---|---|
| A | Timestamp |
| B | Severity (`INFO`, `DEBUG`, `WARN`, `ERROR`) |
| C | Main Table row number (or blank for system events) |
| D | School name (or blank if not yet known) |
| E | Message |
| F | Details (stack trace, JSON dump, or supporting context) |

If the Logs tab itself is missing, the log call falls through to
`console.error` and the script continues.

| Severity | When it is used |
|---|---|
| `INFO` | Successful routing, file creation, file recovery, scan completion |
| `DEBUG` | Per-row reads, template selection, append confirmations, match tier hits |
| `WARN` | Stored file ID invalid (recovered), fuzzy match used, editor add failed, file move failed |
| `ERROR` | No school match found, template tab missing, file creation failed, append failed |

## Functions reference

| Function | How to run | Purpose |
|---|---|---|
| `onMainTableEdit(e)` | Automatically by trigger | Trigger entry point. Logs that the trigger fired and calls `scanUnprocessedRows()`. Catches and logs any uncaught error. |
| `scanUnprocessedRows()` | Called internally | Walks the Main Table from row 2 down, skipping rows with a Status value or a missing student, and calls `processRow` on each remaining row. |
| `processAllRows()` | **Run manually anytime** | Forces a full scan with bracketing log entries. Same effect as the trigger firing, useful for clearing a backlog. |
| `processRow(sheet, row)` | Called internally | Reads one row, builds the lookup name, runs the Source lookup, resolves the file, appends the student, and updates the Status cell. |
| `fileExists(fileId)` | Called internally | Returns `true` only if the file ID resolves to a non-trashed Drive file. Any error is treated as "does not exist". |
| `findOrCreateSchoolFile(match, row)` | Called internally | Searches the destination folder for a file matching the school name. Reuses if found (and writes the ID back to Source). Creates a new file if not. |
| `findSchoolInSource(lookupName, row)` | Called internally | Three-tier matcher (exact, case-insensitive, fuzzy) against Source column A. |
| `buildMatch(data, i)` | Called internally | Builds the match descriptor returned by `findSchoolInSource` (rowIndex, schoolName, billingMethod, fileId). |
| `createSchoolFile(match, row)` | Called internally | Creates a new spreadsheet from the appropriate template, moves it to the destination folder, adds editors, writes the ID back to Source. |
| `appendStudent(fileId, student, row, schoolName)` | Called internally | Appends one student row to the school's first sheet. |
| `log(level, row, school, message, details)` | Called internally | Writes a row to the Logs tab and mirrors the entry to `console.log`. |
| `levenshtein(a, b)` | Called internally | Standard Levenshtein edit-distance implementation used by the fuzzy matcher. |

## Trigger setup

The script does not include an installer for the trigger. It must be created
once manually:

1. Open **Extensions → Apps Script**.
2. In the left sidebar, click the clock icon (**Triggers**).
3. Click **Add Trigger**.
4. Function: `onMainTableEdit`. Event source: `From spreadsheet`. Event type:
   `On change` (recommended over `On edit` so the trigger also fires when
   automations insert rows, not just when humans type).

To force a re-scan without waiting for a trigger, run `processAllRows` from the
editor's function dropdown.

## Edge cases handled

| Scenario | Behavior |
|---|---|
| Status cell already has a value | Row is skipped on every subsequent scan. Re-process by clearing the Status cell. |
| Student name is blank | Row is skipped silently. No log entry, no Status written. |
| Class is blank | Row is marked `SKIPPED: missing data` and logged as `WARN`. |
| Class is `Neighborhood Kids Schools` and NKS is filled | NKS value is used as the lookup name. |
| Class is `Neighborhood Kids Schools` and NKS is blank | The literal string "Neighborhood Kids Schools" is used as the lookup, which will likely fail Source lookup. |
| School name in Main Table has different capitalization than Source | Case-insensitive match catches it. |
| School name in Main Table has minor typos | Fuzzy match catches it within the distance threshold; logged as `WARN` showing what it matched. |
| School not in Source at all | Row is marked `ERROR: no school match`. The closest fuzzy candidate is logged so you can decide whether to add it. |
| Source has the school but no file ID | Folder search runs first; creates a new file only if no name match exists. |
| Source file ID points to a deleted or trashed file | Folder search runs as recovery; reuses any name match or creates a new file. |
| Source file ID points to a valid file | File is used directly with no folder search. |
| Two routings for the same school happen back to back | Second one finds the freshly created file via the now-populated Source ID. |
| Template tab is missing | Row is marked `ERROR:` with the missing template name. |
| Editor cannot be added (account doesn't exist, permissions denied) | Logged as `WARN`, file creation continues. |
| File move to destination folder fails | Logged as `WARN`, file creation continues. The file remains in My Drive root. |
| Logs tab is missing | Log call falls through to `console.error`. Script continues. |
| Append fails (file corrupt, permissions revoked) | Row is marked `ERROR:` with the exception message. |

## How to add a new school

1. Add a new row to the **Source** tab.
2. Column A: the school name, exactly as it will appear in the Main Table's
   Class column (or NKS column for Neighborhood Kids schools).
3. Column B: `Monthly` or `Quarterly`.
4. Column C: leave blank.

The next time a Main Table row routes to that school, a new spreadsheet will be
created from the right template, moved to the destination folder, shared with
the editors, and its ID will be saved automatically into column C.

## How to re-process a row

Clear the **Status** cell (column H) for that row. The next trigger fire (or
the next `processAllRows` run) will re-process it.

> **Warning:** If the school file already exists, the student will be appended
> again, so re-processing the same row twice will create duplicate entries in
> the school file. Manually remove the duplicate from the school file if needed.

## How to force a full scan

Open **Extensions → Apps Script**, select `processAllRows` from the function
dropdown, and click **Run**. Every row missing a Status value will be processed
in order.

## Maintenance notes

- **To change the destination folder:** Update `DESTINATION_FOLDER_ID`. Existing
  files stay where they are; only future creations are affected.
- **To change who gets editor access on new files:** Update the `EDITORS`
  array. Files already created keep their existing sharing.
- **To change the fuzzy match threshold:** Edit the expression
  `Math.max(3, Math.floor(target.length * 0.3))` in `findSchoolInSource`.
  Lower values make matching stricter, higher values make it more lenient.
- **To rename a template:** Update `TEMPLATE_MONTHLY_TAB` or
  `TEMPLATE_QUARTERLY_TAB` and rename the actual tab in the spreadsheet to
  match.
- **To add a third billing template:** Add a new constant for the template tab
  name, then add a branch in `createSchoolFile` reading `match.billingMethod`
  and selecting the right template tab.
- **If routing starts creating duplicate files:** Check the Logs tab for `WARN`
  entries about invalid stored file IDs. The folder-search recovery should
  prevent duplicates, but if it is failing, the cause is usually that the
  file in the folder has a name that does not exactly match the Source column
  A value.
- **If a school's file ID was accidentally cleared from Source:** Do nothing.
  The next routing will find the file via folder search and write the ID back
  automatically.
- **If logs are getting noisy:** The `DEBUG` level fires on every row read and
  every match-tier check. To reduce volume, wrap each `DEBUG` log call in a
  feature flag or remove the calls. `INFO`, `WARN`, and `ERROR` are the
  operationally important levels.
