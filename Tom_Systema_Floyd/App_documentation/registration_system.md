# Systema Floyd, Camp Registration System

How a parent's form submission becomes a row on the dashboard, what catches it
when something breaks, and where every piece lives.

> **Audience:** the operator (you) and any future engineer who needs to debug or
> extend the system. Read top to bottom on first pass; refer to specific sections
> later.

---

## 1. Bird's-eye view

```
            ┌──────────────────────────────────────────────────────────┐
            │  Parent on systemafloyd.com                              │
            │  → fills "Free Camp" or "Summer Camp" form               │
            └────────────────────────┬─────────────────────────────────┘
                                     │ form submission
                                     ▼
            ┌──────────────────────────────────────────────────────────┐
            │  GoHighLevel (Florida location 8IWtNFlmgJ8bif9DivHT)     │
            │  • Stores submission                                     │
            │  • Creates / updates Contact record                      │
            │  • Triggers per-week Routing Workflow                    │
            └────────────────────────┬─────────────────────────────────┘
                                     │ "Add row" action
                                     ▼
            ┌──────────────────────────────────────────────────────────┐
            │  Google Sheets, 4 roster spreadsheets                   │
            │  • Free Camp Upper / Lower                               │
            │  • Summer Camp Upper / Lower                             │
            │  • One tab per week (e.g. "7/27-7/31")                   │
            └─────────┬─────────────────────────────────────┬──────────┘
                      │ snapshot poll                       │ failsafe poll
                      │ (Apps Script Snapshot.js)           │ (Apps Script DiscrepancyCheck.js)
                      ▼                                     ▼
            ┌──────────────────┐                ┌─────────────────────────┐
            │  snapshot.json   │                │  Compare GHL → sheets   │
            │  (in repo,       │                │  • If row missing → ADD │
            │  served by       │                │  • If duplicate → flag  │
            │  GitHub Pages)   │                │  • If deleted → leave   │
            └────────┬─────────┘                └────────────┬────────────┘
                     │                                       │
                     ▼                                       ▼
            ┌──────────────────────┐         ┌─────────────────────────────┐
            │  Live dashboard      │         │  Email to                   │
            │  /dashboard/         │         │  emilio@nilsdigital.com     │
            │  index.html          │         │  (only when something fired)│
            └──────────────────────┘         └─────────────────────────────┘
```

The **GHL routing workflow is the primary writer**. Apps Script's
DiscrepancyCheck is a failsafe that watches for missed writes and patches them.

---

## 2. The happy path (parent submits form → row on dashboard)

1. Parent submits a form (Free Camp or Summer Camp) on `systemafloyd.com`.
2. GHL creates a form submission record + creates/updates a Contact.
3. For **each week** the parent ticked, the matching GHL routing workflow
   fires (e.g. "9. Free Camp (July 27th-31st) -> Google Sheet routing").
4. Each workflow's "Add Row to Sheet" action writes one row into the right
   weekly tab on the right campus sheet.
5. The `sheets-snapshot` Apps Script polls the sheets every ~10 minutes,
   builds `snapshot.json`, and pushes it to the GitHub Pages-served dashboard.
6. The dashboard reads `snapshot.json` and renders the roster.

When this works, the discrepancy bot is silent.

---

## 3. The failsafe path (when GHL fails, like Jul 27-31 did)

If a routing workflow doesn't fire (broken if/else, bad field mapping,
etc.), the row never lands in the sheet. The discrepancy bot catches it:

1. Trigger fires `runDiscrepancyCheck()` every 15 min.
2. Bot reads every form submission from GHL (Free Camp + Summer Camp).
3. Bot reads every roster row from all 4 sheets.
4. Bot reads the Supabase tombstone log (`public.sf_form_submissions`).
5. For each `(submission, week)` pair, the bot decides:
   - **Already in Supabase** → skip (already handled, possibly deleted)
   - **5 min grace not elapsed yet** → skip (let GHL workflow finish)
   - **Existing row matches by email + week with a fuzzy student-name match** (exact, single-token "first name in" the other, first+last token match, or Jaro-Winkler ≥ 0.92) → link, don't duplicate. This is what catches "Aria" vs "Aria Falzone" as the same kid.
   - **No row, no record** → APPEND a new row, write tombstone, stamp source note
6. If the bot added anything, emails `emilio@nilsdigital.com` with the
   list, **and names the specific GHL workflow that failed to write each row**.

---

## 4. Components

### 4.1 GHL Forms

Florida location: `8IWtNFlmgJ8bif9DivHT` (`Systema Floyd - Florida`).

| Form name | Form ID | Covered by bot? |
|---|---|---|
| Free Camp | `3Z4E9y7WlWgkZDxViBUW` | ✅ |
| Summer Camp | `61TiB5Zn1DJrGAsWiyTm` | ✅ |
| After School Registration | `TkioOL4IoByeHU3K2gTs` | ✅ (writes to Main Table; Router handles routing) |
| Summer Camp - DEV | `oEDRZoVTuCWHt5cnMLpH` | ⏩ skipped (dev) |
| Liability Waiver - Free | `y3Ztbvsy0JAZt8dx453Y` | n/a (not roster) |
| Liability Waiver | `2vMqRPJVSiNx9qowOcpD` | n/a |
| Lead Form | `yP3OPoUimfOZgrXJo2mI` | n/a |

> **After School architectural note:** Camp forms write directly to per-week
> spreadsheets via per-week routing workflows. After School is different, ONE
> workflow (`After School Registration Main Branch`,
> `a9154b76-5174-4129-8370-e7f3f425ab89`) writes to ONE central Main Table in
> the `After School Registration - APPLICATION` spreadsheet
> (`1XRhQe1VTujc3qlC3DdWdfoAsPabPXVLI8PdFvs7JKhY`). The separate **School
> Enrollment Router** (Apps Script bound to that spreadsheet) then routes each
> Main Table row to the correct per-school spreadsheet. The discrepancy bot
> only ensures Main Table has a row for every form submission; the Router
> handles everything downstream. See
> [school_enrollment_router.md](./school_enrollment_router.md) for the
> router's logic.
>
> **Form field map for After School (writes to Main Table cols A–H):**
> - A = `mCopCd8PHPPGBdo30zYK` ("Student Name (After School Registration)")
> - B = submission's parent email
> - C = `Ysom5PswWL2N0eouKwiS` ("T-Shirt Size (After School Registration)")
> - D = `wiv3eF5jZoPalmg7yTmQ` ("Child Grade (After School Registration)")
> - E = submission's `createdAt`
> - F = `UluqGJoN855415yTyiXd` ("Select Class (After School Registration)", the school+day+time string)
> - G = `9kWksqJLFmmGoxfFDsay` ("Neighborhood Kids Schools (After School Registration)", only set if Class is "Neighborhood Kids Schools")
> - H = empty (Router fills in `Processed`/`ERROR`/`SKIPPED`)
>
> Tombstone key in Supabase: `(submission_id, class)`, class plays the role
> "week" plays for camps. After School submissions are 1:1 with class so this
> works cleanly.

### 4.2 GHL Routing Workflows

Each form has one routing workflow per week. The workflow:
1. Triggers on form submission **with** "Weeks Attending contains [this week]"
2. Decides campus (Upper/Lower), by grade for Free Camp, by age for Summer
3. Calls "Add Row to Google Sheet" with the correct spreadsheet+tab
4. Updates a custom field as a breadcrumb (e.g. `contact.free_camp_registration`)

**Free Camp routing workflows (10, one per week):**

| Week | Workflow ID |
|---|---|
| June 1st-5th | `e9bc2bb7-94ae-481f-9d8f-51df5b9d45bf` |
| June 8th-12th | `1b6e3514-e2d0-4ceb-801d-eef3795d3fb4` |
| June 15th-19th | `ac889124-e4e8-4784-8f7c-bd03b8d526a4` |
| June 22nd-26th | `61389cbc-249e-445a-b4aa-a597d1019208` |
| June 29th-July 3rd | `03fc65ef-37cc-4f85-8a9e-41a6be2f08c9` |
| July 6th-10th | `9ee99436-34aa-4790-8409-fb0e4b941212` |
| July 13th-17th | `37d80612-bc27-407d-85ff-1ece7a890e70` |
| July 20th-24th | `7b29ffcb-e421-4e27-9b88-a1f548846a98` |
| **July 27th-31st** | `89452dd8-dcd6-4e01-95b8-e72ed507cbca` *(broke this morning)* |
| August 3rd-7th | `6c8f25e2-122a-474f-a810-892f8ad45b43` |

Workflow URL format:
`https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/workflow/{workflow-id}`

**Summer Camp routing workflows (12, one per week):**

| Week | Workflow ID |
|---|---|
| June 1st-5th | `1e19a5e1-e45a-40f0-b800-98dd36395c2e` |
| June 8th-12th | `e5d2f966-6ffc-45a5-872d-948e4cca04c7` |
| June 15th-19th | `4b570f25-00e6-45d0-b643-25dc5a52fc89` |
| June 22nd-26th | `801e40bd-4d8e-41a1-83d8-7f272d9ce5c8` |
| June 29th-July 3rd | `afa65040-2f26-4256-b478-0680deefc93f` |
| July 6th-10th | `bb327dd9-c837-4b3e-80f4-a11cf4642c69` |
| July 13th-17th | `3ec3777a-b3ee-47a2-8c50-f123c413a44d` |
| July 20th-24th | `75f3fc57-800a-4396-a0ba-f114539eeab8` |
| July 27th-31st | `642d3fb0-8104-4f43-9e9a-a16170729b59` |
| August 3rd-7th | `24b85262-e395-45d5-a4df-5e7a63ffd415` |
| August 10th-14th | `7fff407e-f4d7-49f7-a8bc-d3c8dfc7731c` |
| August 17th-21st | `b3c775af-f38e-46c6-80f8-20feac198c74` |

### 4.3 Google Sheets, the rosters

Owned by `systemafloydsheets@gmail.com`. Shared with `emilio@nilsdigital.com`
(read+write).

| Sheet name (in code) | Spreadsheet ID | Cols |
|---|---|---|
| Free Camp Upper | `1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ` | 11 |
| Free Camp Lower | `1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY` | 12 |
| Summer Camp Upper | `1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA` | 15 |
| Summer Camp Lower | `18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs` | 16 |

**Tab structure (all 4 sheets):**
- 12 weekly tabs named in short form: `6/1-6/5`, `6/8-6/12`, ..., `8/17-8/21`
- 1 `Billing` tab (separate, ignored by bot)
- Hidden `_submissionId` column appended to the right of every weekly tab ,
  bot stamps the GHL submission ID here for each tracked row

**⚠ Tab name gotcha:** the tabs use **short form** (`7/27-7/31`), but the
`WEEK_ORDER` constant in `Snapshot.js` and the form submissions use
**long form** (`July 27th-31st`). The mapping lives in
`DC_WEEK_TO_TAB` in `DiscrepancyCheck.js`. Don't call `getSheetByName(WEEK_ORDER[i])` ,
it returns null silently.

**Column orders:**

```
Free Upper  (11): School | Student Name | Grade | Age | Shirt Size | Address | Breakfast | Lunch | Parent | Phone | Email
Free Lower  (12): School | Student Name | Grade | Age | Potty Trained | Shirt Size | Address | Breakfast | Lunch | Parent | Phone | Email
Summer Up   (15): Paid? | Amt | Student Name | Age | Breakfast | Lunch | Before/After Care | Shirt? | Email | Additional Notes | Mon | Tue | Wed | Thu | Fri
Summer Low  (16): Paid? | Amt | Student Name | Age | Potty Trained | Breakfast | Lunch | Before/After Care | Shirt? | Email | Additional Notes | Mon | Tue | Wed | Thu | Fri
```

### 4.4 Apps Script project, `sheets-snapshot`

Script ID: `1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y`
Editor URL: <https://script.google.com/d/1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y/edit>

Files:
- `Snapshot.js`, polls the 4 sheets every ~10 min, builds `snapshot.json` for
  the dashboard. **Pre-existing**, untouched by the discrepancy work.
- `DiscrepancyCheck.js`, the failsafe described in this doc.
- `appsscript.json`, manifest with required OAuth scopes.

**OAuth scopes:**
- `spreadsheets`, read/write the rosters
- `script.external_request`, call GHL + Supabase APIs
- `script.scriptapp`, manage triggers
- `script.send_mail`, send the discrepancy email

**Script Properties:**
- `SUPABASE_URL` = `https://nroeiabeirifurdaybyo.supabase.co`
- `SUPABASE_ANON_KEY` = (legacy anon key)
- `SUPABASE_TOKEN_SECRET` = (shared secret used by both Supabase RPCs)

**Triggers:**
- One time-driven trigger fires `runDiscrepancyCheck` every 15 minutes
- Installed by **emilio@nilsdigital.com** (uses Workspace daily quota)

### 4.5 Supabase, `nroeiabeirifurdaybyo`

Three relevant pieces:

**`public.ghl_tokens`**, pre-existing table, externally maintained.
Holds GHL OAuth access tokens for all subaccounts. Auto-refreshed by an
external service before the 24-hour TTL expires. **Do not modify directly.**

Read access via `SECURITY DEFINER` RPC:
```
sf_get_systema_floyd_florida_token(claim_secret text)
  → (acces_token, account_name, locationId, updated_at)
  Verifies account_name = 'Systema Floyd - Florida' before returning.
```

The bot reads `updated_at` to compute token age, if > 12h old (`DC_TOKEN_STALE_WARN_HOURS`), the email digest gets a warning block. The external refresher should keep this < 24h. **Exception: Florida now uses a manually-created, non-rotating PIT (token starts with `pit-`), whose `updated_at` is frozen by design. `_dcGhlToken_()` sets `_dcTokenIsPit` for `pit-` tokens and `tokenStaleWarning` is forced false for them — otherwise the perpetually-aging PIT tripped the digest every 15 min.** The stale warning is only meaningful for the rotating OAuth tokens (GA/VA).

**`public.sf_form_submissions`**, created by this project.
Tombstone log: every `(submission_id, week)` the bot has ever processed.
For After School, `week` holds the class string (e.g. `"Linwood Holton Elementary: Friday 3–3:45PM"`) since each submission is per-class not per-week.

```sql
CREATE TABLE public.sf_form_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   text NOT NULL,
  form            text NOT NULL,         -- 'free_camp' | 'summer_camp' | 'after_school'
  week            text NOT NULL,         -- "July 27th-31st" or class string for after_school
  campus          text,                  -- 'upper' | 'lower'
  status          text NOT NULL,         -- processed | linked_manual | backfilled | error
  spreadsheet_id  text,
  tab_name        text,
  row_index       int,
  student_name    text,
  parent_email    text,
  contact_id      text,
  metadata        jsonb,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, week)
);
```

Read/write access via two `SECURITY DEFINER` RPCs:
- `sf_list_processed(claim_secret)` → all rows (used by the bot at start of every run)
- `sf_record_processed(claim_secret, submission_id, form, week, ...)` → upsert

**`public.sf_bot_health`**, created by this project.
Heartbeat log. The discrepancy bot writes `component='discrepancy_check'` after every successful run; a separate daily trigger reads it and emails an alert if the timestamp is > 24h old.

```sql
CREATE TABLE public.sf_bot_health (
  component   text PRIMARY KEY,           -- 'discrepancy_check' | 'heartbeat_guard' | (future bots)
  last_ok_at  timestamptz NOT NULL DEFAULT now(),
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

Read/write access via two `SECURITY DEFINER` RPCs:
- `sf_record_heartbeat(claim_secret, p_component, p_metadata)` → upsert (called at the end of every successful `runDiscrepancyCheck` and `discrepancyHeartbeatGuard`)
- `sf_get_heartbeat(claim_secret, p_component)` → returns `(component, last_ok_at, age_seconds, metadata)`

All four RPCs gated by the same shared secret (in Apps Script `SUPABASE_TOKEN_SECRET`).

---

## 5. Form field mappings

These are the GHL custom field IDs the bot reads from each form submission's
`others` object.

### Free Camp form (`3Z4E9y7WlWgkZDxViBUW`)

| Constant | Field ID | GHL field name |
|---|---|---|
| `DC_FC_FIELD_WEEKS` | `0H3m5fBvXwD3frq75XKa` | Camp Week Choices (Free Camp) |
| `DC_FC_FIELD_STUDENT` | `rwAlfmxIbkk5k7nmgahu` | Student Full Name (Free Camp) |
| `DC_FC_FIELD_GRADE` | `M6cPG28rA41X3DtPf7WO` | Child Grade (In School) (Free Camp) |
| `DC_FC_FIELD_SCHOOL` | `mtDthaZW5nm0SWGlp7XU` | Select School (Free Camp) |
| `DC_FC_FIELD_SHIRT` | `zhMuamfr2EwwObWlfwPg` | T-Shirt Size (Free Camp) |
| `DC_FC_FIELD_BREAKFAST` | `wZiqGsdaPlVBM3sydwxz` | Free Breakfast (Free Camp) |
| `DC_FC_FIELD_LUNCH` | `iBrxWLqsNDpMjZFRsUwQ` | Free Lunch (Free Camp) |
| (DOB, used for cross-camp dedup) | `cuEVHLcCCk8c7zaMRQOj` | Student's birthday (Free Camp) |

### Summer Camp form (`61TiB5Zn1DJrGAsWiyTm`)

| Constant | Field ID | GHL field name |
|---|---|---|
| `DC_SC_FIELD_WEEKS` | `boH43tBf1W4BXcz1aRh4` | Select Camp Dates (Summer Camp) |
| `DC_SC_FIELD_STUDENT` | `WitmrGYAPRw66ONJuRjQ` | Student Name (Summer Camp) |
| `DC_SC_FIELD_DOB` | `oHlCv49wt2OTGuwUoNsn` | Student Birthday (Summer Camp) |
| `DC_SC_FIELD_SHIRT` | `AY8wUz8iD6d5NEc4141l` | Student T-Shirt (Summer Camp) |
| `DC_SC_FIELD_POTTY` | `TPUHytz5Qd8OJNswX9Xy` | Is this student potty trained? (Summer Camp) |
| `DC_SC_FIELD_DURATION` | `1y8aMIgi84l2cfHnhFpc` | Select Camp Duration (Summer Camp) |
| `DC_SC_FIELD_DAYS` | `oRu849usIbnHPIgDccBc` | Which days of the week? |
| `DC_SC_FIELD_AFTERCARE` | `7yIj793LRegIfN19Ux8r` | After care options (Summer Camp) |
| `DC_SC_FIELD_BREAKFAST` | `KqJc1rwDbZByulZNCDcl` | Select Breakfast Option: Overnight Oats (Summer Camp) |
| `DC_SC_FIELD_LUNCH` | `MgE6T5xKZl2SZWGnPktO` | Select lunch option (Summer Camp) |

### After School Registration form (`TkioOL4IoByeHU3K2gTs`)

| Constant | Field ID | GHL field name |
|---|---|---|
| `DC_AS_FIELD_STUDENT` | `mCopCd8PHPPGBdo30zYK` | Student Name (After School Registration) |
| `DC_AS_FIELD_GRADE` | `wiv3eF5jZoPalmg7yTmQ` | Child Grade (After School Registration) |
| `DC_AS_FIELD_SHIRT` | `Ysom5PswWL2N0eouKwiS` | T-Shirt Size (After School Registration) |
| `DC_AS_FIELD_CLASS` | `UluqGJoN855415yTyiXd` | Select Class (After School Registration) |
| `DC_AS_FIELD_NKS` | `9kWksqJLFmmGoxfFDsay` | Neighborhood Kids Schools (After School Registration) |
| `DC_AS_FIELD_NOTES` | `40KOxhzNEKTjyhvi20fb` | Notes (After School Registration), captured but not currently written to Main Table |

> Note: After School submissions also include payment fields (card number,
> expiry, CVV, ZIP). The bot ignores those, they're handled by GHL's payment
> integration, not the failsafe.

### Verifying a field ID
1. Open the form in GHL → select the field → right panel shows the field key
2. Or pull a sample submission and inspect the `others` keys:
   ```
   GET /forms/submissions?locationId=8IWtNFlmgJ8bif9DivHT&formId=<id>&limit=1
   ```

---

## 6. The decision tree (per submission, every 15 min)

The "second key" varies by form: camps iterate per-week, After School iterates
per-class. Below uses `<key>` for that.

```
For each form submission in GHL:
  For each <key> the parent picked:
    (camps: each WEEK they ticked)
    (After School: the SINGLE class they selected)

    1. Is this submission less than 5 minutes old?
         → SKIP. Let the GHL workflow finish first.

    2. Is (submission_id, <key>) already in Supabase sf_form_submissions?
         → SKIP. Already processed; respect any deletion the team made.

    3. Is the submission_id already stamped on a row in the destination tab?
         → SKIP. Already in sheet.

    4. Is there an existing row for the same (student_name, parent_email, <key>)?
         The match is FUZZY on student_name within the same email+key:
           a. exact match (lowercased, trimmed), fastest path, OR
           b. one name is a single token whose first name matches the
              other's first name (e.g. "Aria" matches "Aria Falzone"), OR
           c. both multi-token, first AND last name match (handles
              middle-name / initial differences), OR
           d. Jaro-Winkler ≥ 0.92 (typo tolerance like "Sara" vs "Sarah")
         → If its currentSubId == this submission_id: no-op (verified)
         → Else: LINK, overwrite hidden submission_id on existing row,
                 write source note, record in Supabase, do NOT duplicate.

    5. None of the above → APPEND a new row.
         • Pick destination:
             - Free Camp: Upper or Lower campus sheet (Pre-K/K → Lower, 1st+ → Upper from Grade)
             - Summer Camp: Upper or Lower campus sheet (≥6 yrs by June 1 → Upper, else Lower)
             - After School: Main Table tab in After School Registration - APPLICATION
                            (the School Enrollment Router routes to the right per-school sheet downstream)
         • Write the row in the correct column order for that destination
         • Stamp hidden submission_id on the new row
         • Stamp a Sheets cell note on the Student Name cell with the source
         • Record (submission_id, <key>) in Supabase
         • Add to the email digest with the failed workflow's URL
```

**After the per-row pass:**
- Scan all 4 camp sheets for duplicates (in-tab + cross-campus). Read-only ,
  flag in the email if found. (After School duplicate scanning isn't run since
  Main Table is single-tab and the Router enforces uniqueness downstream.)

---

## 7. Tombstone semantics (the deletion-respect rule)

Every time the bot processes a `(submission_id, week)`:
- Either a row gets written/linked
- Either way, a Supabase row is recorded

**On future runs:**
- If the team manually deletes a roster row → its hidden submission_id goes
  with it. But Supabase still has the record. → Bot sees Supabase entry → skips.
  The deletion is permanent.
- If the team manually re-adds the kid (typed in by hand without an ID) → the
  bot's fuzzy `(name + email + week)` dedup catches it on next run, links the
  submission_id to it. No duplicate. The fuzzy match means even partial-name
  manual entries ("Aria" vs the parent's "Aria Falzone" submission) are
  recognized as the same kid.
- If the parent submits the form again (new submission_id, same kid+week) →
  bot finds the existing row by fuzzy email+name match → updates the hidden
  ID to the new submission_id. The row stays; the new submission gets linked.

To **un-tombstone** a submission (rare, e.g. you accidentally deleted the row
and want the bot to re-add it):
```sql
DELETE FROM public.sf_form_submissions
 WHERE submission_id = '<id>' AND week = '<week>';
```
Next run will treat it as fresh.

---

## 8. The cell note (the visible "where did this row come from?" badge)

Every bot-tracked row has a Sheets cell note on the **Student Name cell**.
Hover the name → see something like:

```
Backfilled by DiscrepancyCheck, historical row, matched retroactively to a
GHL submission so future runs treat it as tracked.
Stamped: 2026-05-13T20:57:25.464Z

Form: Free Camp
Week selected: July 27th-31st
Submission ID: 6a0376806cf02462f24408e3
Submitted: 2026-05-12T18:50:40.444Z
Parent: Paula brown Johnson
Parent email: alekaleebrown@yahoo.com
Contact ID: LobkcDtQr97NiS1aUCmK
Contact: https://app.nilsdigital.com/v2/location/8IWtNFlmgJ8bif9DivHT/contacts/detail/LobkcDtQr97NiS1aUCmK
```

**Three modes** the note can describe:
- `Auto-added by DiscrepancyCheck`, the bot wrote this row from scratch
  because it was missing
- `Linked by DiscrepancyCheck`, row was already there (typed in manually
  or re-submitted) and the bot stamped the submission_id on it
- `Backfilled by DiscrepancyCheck`, historical row that pre-dates the bot;
  the bot matched it retroactively during the one-time backfill

**A row WITHOUT a cell note** = manual entry the bot has never seen / matched.
Useful for spotting hand-typed rows that don't trace back to a form submission.

---

## 9. The email (your inbox alert)

There are **two distinct emails** the system can send:

### 9.1 Discrepancy digest (sent by `runDiscrepancyCheck`)

Sent only when a run finds something **actionable**: a row was auto-added,
an error occurred, or the GHL token is older than 12h. Linked-manual stamps,
orphans, and duplicate clusters are FYI-only — they no longer trigger an email
on their own (they still appear in the body when an email does fire for another
reason). Quiet runs send nothing.

**Recipient:** Script Property `DC_NOTIFY_EMAIL` (comma-separated list
supported), falling back to `DC_NOTIFY_EMAIL_DEFAULT` (`emilio@nilsdigital.com`)
if unset. To add another recipient without redeploying, edit the property:
`emilio@nilsdigital.com, ops@nilsdigital.com`.

**Subject:** `Roster discrepancy, N added, M dup, K err`

**Body shape:**
```
Camp roster discrepancy check, 2026-05-13T20:30:00Z
Run took 38000ms

FREE CAMP
  added (bot wrote new row)              : 1
  linked (manual row, ID stamped)        : 0
  skipped (tombstoned, staff deleted)   : 0
  errors                                 : 0
  skipped<5m                             : 0
  + [upper] July 27th-31st, Taylor Johnson (parent Paula brown Johnson, alekaleebrown@yahoo.com, sub abc123)
      ⚠ Workflow that should have written this row: 9. Free Camp (July 27th-31st) -> Google Sheet routing
         https://app.nilsdigital.com/location/8IWtNFlmgJ8bif9DivHT/workflow/89452dd8-dcd6-4e01-95b8-e72ed507cbca

SUMMER CAMP
  added                                   : 0
  linked                                  : 0
  ...

DUPLICATES (existing rows the bot did not create, please review)
  in-tab clusters                         : 0
  cross-campus                            : 0
```

**When you get an email saying the bot ADDED something:**
1. The "⚠ Workflow that should have written this row" line names a specific GHL
   workflow that failed to fire.
2. Click the URL to open it.
3. Investigate (check for broken if/else conditions, deleted custom fields,
   misconfigured "Add Row" actions, see "Common failures" below).

**Token-age warning at top of digest:**
If you see `⚠ GHL TOKEN AGE WARNING`, the GHL OAuth token in Supabase is
older than `DC_TOKEN_STALE_WARN_HOURS` (12h). The token is still valid but
the upstream refresher (n8n / scheduled function) is drifting. Investigate
that refresh job, if the token reaches 24h it expires hard and the bot
loses GHL access entirely. **This warning is suppressed for Florida's
non-rotating PIT (`pit-…`), whose `updated_at` is frozen on purpose — a
stale PIT timestamp is expected, not a failure.**

### 9.2 Heartbeat alert (sent by `discrepancyHeartbeatGuard`)

Sent only when the main discrepancy bot hasn't recorded a successful run
in `DC_HEARTBEAT_MAX_AGE_HOURS` (24h). Same recipient resolution as 9.1.

**Subject:** `⚠ Systema Floyd discrepancy bot heartbeat alert`

**Body:** plain text explaining the symptom + likely causes (trigger
disabled, quota exhausted, scope revoked, Apps Script outage) + a direct
link to the script editor.

**The two triggers fail independently**, if the main bot's trigger dies,
the heartbeat-guard trigger still fires every day at 8am and surfaces the
silence. If you NEVER want to receive a digest from the bot, this guard
is your only safety net for "is it still running?"

---

## 10. Operations

### Manually run a check

In the Apps Script editor: function dropdown → `runDiscrepancyCheck` → Run.
Returns the full report object; visible in the Executions log.

### Check what's in the tombstone table

```sql
-- Everything
SELECT * FROM public.sf_form_submissions ORDER BY recorded_at DESC LIMIT 50;

-- For a specific kid
SELECT * FROM public.sf_form_submissions
WHERE student_name ILIKE '%taylor%' OR parent_email ILIKE '%alekaleebrown%';

-- Counts by week + status
SELECT form, week, status, count(*) FROM public.sf_form_submissions
GROUP BY form, week, status ORDER BY form, week;
```

### Functions you can call manually from the editor

| Function | What it does |
|---|---|
| `runDiscrepancyCheck()` | The main loop the trigger calls |
| `discrepancySetupTrigger()` / `discrepancyRemoveTrigger()` | Trigger management |
| `discrepancyBackfillTracking()` | Match existing rows to submissions, stamp hidden ID column. One-shot. |
| `discrepancyBackfillNotes()` | Stamp source-cell notes on every tracked row. One-shot. |
| `discrepancyBackfillTombstones()` | Push every tracked row's submission_id into Supabase. One-shot. |
| `discrepancyDeleteInTabDuplicates()` | Auto-delete EXACT-name duplicates within the same tab (keep lowest row). For most cases use `discrepancyMergeNameVariantDuplicates()` instead, it handles name variants too. |
| `discrepancyMergeNameVariantDuplicates()` | Merge fuzzy-name duplicates (e.g. "Aria" + "Aria Falzone" → keeps "Aria Falzone", absorbs day ticks + submission ID from "Aria", deletes "Aria"). Picks the row with the fuller name as primary, copies non-empty values from secondaries into primary's empty cells, never overwrites. |
| `discrepancyDeleteCrossCampusDuplicates()` | Auto-delete cross-campus duplicates using age rule. |
| `discrepancyHeartbeatGuard()` | Silence-broken alert. Reads `sf_bot_health.discrepancy_check` from Supabase; if it's older than `DC_HEARTBEAT_MAX_AGE_HOURS` (24h), emails the recipient list. Runs as its own daily trigger (install via `discrepancyHeartbeatSetupTrigger`) so it can fire even if the main bot's trigger has died. |
| `discrepancyHeartbeatSetupTrigger()` / `discrepancyHeartbeatRemoveTrigger()` | Install / remove the daily heartbeat-guard trigger. |
| `discrepancyFixSummerCampNotes()` | One-shot migration. A previous version of `_dcSetSourceNote` stamped Summer Camp source-cell notes on col B (Amt) instead of col C (Student Name). This walks the two Summer Camp spreadsheets, moves any DiscrepancyCheck-authored note from col B to col C (clears col B if col C already has a note). Idempotent, safe to re-run. Already executed; should be `{moved: 0, cleared: 0}` going forward. |

### Common failures

| Symptom in email | Likely cause | Fix |
|---|---|---|
| `errors` includes `Supabase ... HTTP 401` | Shared secret rotated | Update `SUPABASE_TOKEN_SECRET` Script Property |
| `errors` includes `GHL submissions HTTP 401/403` | Token expired in Supabase | External refresh service may be down, investigate |
| `errors` includes `Cannot openById` | Sheet permission revoked from `emilio@nilsdigital.com` | Re-share the sheet |
| Auto-add picks wrong campus | Bad DOB on the contact (e.g. future date) | Fix DOB in GHL → manually move row → tombstone protects against re-add |
| Auto-add lands data in wrong columns | Sheet column added/renamed/reordered | Update column constants in `_dcAppendFreeCamp` / `_dcAppendSummerCamp` |
| Whole week silently fails | Tab renamed in spreadsheet | Update `DC_WEEK_TO_TAB` mapping |
| Trigger doesn't fire | Quota exhausted, owner switched | Check Triggers panel in editor |
| Bot duplicated a row that staff manually entered with a different name spelling | Names too dissimilar for the fuzzy matcher (e.g. "Bobby" vs "Robert") | Run `discrepancyMergeNameVariantDuplicates()` to merge, OR delete the bot row by hand, the tombstone keeps it from being re-added |
| Bot conflated two siblings with the same first name | Same email + same first name on both records | Edge case, manually delete the bot's add and update the manual row's name to be unique enough that the fuzzy matcher distinguishes them (e.g. include last name) |

### Pulling a sample submission for debugging

```bash
# Replace <token> with a fresh GHL access token
curl 'https://services.leadconnectorhq.com/forms/submissions?locationId=8IWtNFlmgJ8bif9DivHT&formId=3Z4E9y7WlWgkZDxViBUW&limit=1' \
  -H 'Authorization: Bearer <token>' \
  -H 'Version: 2021-07-28' \
  -H 'Accept: application/json'
```

---

## 11. Recovery

| Disaster | Recovery |
|---|---|
| Wrong row deleted | Sheets → File → Version history → restore prior snapshot |
| Bot wrote a wrong row | Delete the row by hand. Tombstone protects against re-add. |
| Tombstone table corrupted | Re-run `discrepancyBackfillTombstones()` to rebuild from sheet rows |
| Hidden `_submissionId` column wiped | Re-run `discrepancyBackfillTracking()` to re-match by fuzzy name+email+week |
| Cell notes wiped | Re-run `discrepancyBackfillNotes()` |
| Whole script project deleted | Code lives in `Tom_Systema_Floyd/sheets-snapshot/apps-script/` in this repo. Re-push via clasp or REST API. |
| Supabase project deleted | Re-create the table + RPCs (migration files in Supabase migration history). Re-run all backfill functions. |

---

## 12. Extending the system, adding a new camp / event / program

The bot currently covers Free Camp, Summer Camp, and After School. Two
patterns exist; pick whichever matches the new program.

### Pattern A, per-week camp with multiple roster sheets (like Free / Summer)

Use this when the new program has discrete weekly sessions and writes to
distinct per-campus / per-tab spreadsheets.

1. **Get the destination spreadsheet IDs** for each campus.
2. **Add constants** in `DiscrepancyCheck.js`:
   ```js
   var DC_FORM_<NAME>      = '<form id>';
   var DC_<NAME>_UPPER_SS  = '<upper sheet id>';
   var DC_<NAME>_LOWER_SS  = '<lower sheet id or null>';
   ```
3. **Map the form's field IDs** by pulling a sample submission (see §10).
   Add `DC_<NAME>_FIELD_*` constants alongside the Free/Summer ones.
4. **Add `_dcCheck<Name>()` and `_dcAppend<Name>()`** by copying the
   `_dcCheckSummerCamp` / `_dcAppendSummerCamp` shape and adapting the
   column mapping.
5. **Add the per-week routing workflow IDs** to
   `DC_GHL_WORKFLOW_BY_FORM_WEEK['<form_key>']` so the email can name the
   failing workflow.
6. **Call from `runDiscrepancyCheck()`** alongside the existing three.
7. **Update Supabase**: extend the `form` CHECK constraint to allow the new
   slug. Migration template:
   ```sql
   ALTER TABLE public.sf_form_submissions DROP CONSTRAINT sf_form_submissions_form_check;
   ALTER TABLE public.sf_form_submissions ADD CONSTRAINT sf_form_submissions_form_check
     CHECK (form IN ('free_camp','summer_camp','after_school','<new>'));
   ```
8. **Run** `discrepancyBackfillTombstones()` once for the new sheets so
   existing rows are protected.

### Pattern B, single intake table feeding a router (like After School)

Use this when there's ONE intake spreadsheet/tab and a downstream routing
script handles the rest.

1. **Get the intake spreadsheet ID + tab name.**
2. **Add constants** in `DiscrepancyCheck.js`:
   ```js
   var DC_FORM_<NAME>  = '<form id>';
   var DC_<NAME>_SS    = '<intake spreadsheet id>';
   var DC_<NAME>_TAB   = '<tab name>';
   ```
3. **Map the form's field IDs.** Note: only fields the intake table actually
   uses; payment fields and the like can be ignored.
4. **Add `_dcCheck<Name>()` and `_dcAppend<Name>()`** by copying the
   `_dcCheckAfterSchool` / `_dcAppendAfterSchool` shape. The "second key" for
   tombstones is whatever uniquely identifies the program slot (class name,
   event date, etc.).
5. **Add the single routing workflow ID** to
   `DC_GHL_WORKFLOW_BY_FORM_WEEK['<form_key>']` under the `'*'` key (since
   one workflow handles all variants).
6. **Update Supabase** `form` CHECK constraint (see step 7 above).
7. **Run** `runDiscrepancyCheck()` manually to verify; the first run will
   link any pre-existing intake rows and add any missing ones.

### What to update OUTSIDE of code

- **App_documentation/registration_system.md**, add the new form to the
  table in §4.1, add field mappings to §5, mention it in §6's decision tree
  if the rules differ.
- **App_documentation/README.md**, update the first-row description to
  mention the new program.
- **Memory note** `reference_systema_floyd_discrepancy_checker.md`, append
  the new form so future Claude sessions are aware.

---

## 13. Reference: Constants in `DiscrepancyCheck.js`

All the magic numbers live at the top of the file in named groups:

- `DC_LOCATION_ID`, Florida GHL location
- `DC_GRACE_WINDOW_MS`, 5 min, the do-not-touch-fresh-submissions window
- `DC_TRACKING_HEADER`, `_submissionId` (hidden column header name)
- `DC_TRIGGER_FUNCTION`, `runDiscrepancyCheck` (trigger entry point name)
- `DC_NOTIFY_EMAIL_DEFAULT`, fallback email recipient when Script Property `DC_NOTIFY_EMAIL` is unset
- `DC_TOKEN_STALE_WARN_HOURS`, warn in the email digest when Supabase's `ghl_tokens.updated_at` is older than this (12h)
- `DC_HEARTBEAT_MAX_AGE_HOURS`, `discrepancyHeartbeatGuard` alerts when last successful run is older than this (24h)
- `DC_FORM_FREE_CAMP` / `DC_FORM_SUMMER_CAMP` / `DC_FORM_AFTER_SCHOOL`, form IDs
- `DC_FREE_UPPER_SS` / `DC_FREE_LOWER_SS` / `DC_SUMMER_UPPER_SS` / `DC_SUMMER_LOWER_SS` / `DC_AFTER_SCHOOL_SS`, spreadsheet IDs
- `DC_FC_FIELD_*` / `DC_SC_FIELD_*` / `DC_AS_FIELD_*`, form field IDs (see §5)
- `DC_WEEK_TO_TAB`, `"July 27th-31st" → "7/27-7/31"` mapping
- `DC_GHL_WORKFLOW_BY_FORM_WEEK`, workflow names + IDs (see §4.2)

### Heartbeat / silence-broken alerting

The bot writes `sf_bot_health.discrepancy_check` (in Supabase) after every
successful run. A separate daily trigger calls `discrepancyHeartbeatGuard`,
which reads that timestamp; if it's older than `DC_HEARTBEAT_MAX_AGE_HOURS`
(24h), it emails the recipient list. **The two triggers fail independently** ,
if the main bot's trigger dies, the guard's trigger still fires the alert.

Does NOT defend against:
- Whole script project deleted (both triggers gone)
- Apps Script outage (no triggers running)
For those, an external monitor (UptimeRobot, n8n cron) would be needed.

### Token-age warning

On every run, the bot records the age of the GHL OAuth access token (read
from Supabase `ghl_tokens.updated_at`). If older than
`DC_TOKEN_STALE_WARN_HOURS` (12h), the email digest gets a `⚠ GHL TOKEN AGE
WARNING` block. The external refresh service is supposed to keep the token
< 24h old; this surfaces drift before the token expires hard.

### Email recipient

Set Script Property `DC_NOTIFY_EMAIL` to a comma-separated list to add
recipients without redeploying. Falls back to `DC_NOTIFY_EMAIL_DEFAULT`
constant if unset.

When something needs changing, look here first.

---

## 14. Related memory notes (for future Claude/AI sessions)

- `reference_systema_floyd_discrepancy_checker.md`, high-level summary of the
  bot for AI context
- `reference_systema_floyd_supabase_ghl_token.md`, how to fetch a fresh GHL
  token from Supabase (the RPC pattern)
- `project_systema_floyd_sheet_tab_names.md`, the short-form vs long-form tab
  name gotcha
