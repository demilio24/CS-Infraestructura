# Active investigation — Systema Floyd billing dashboard

> **SUPERSEDED 2026-05-23.** Fix A (name-based tab resolution in
> `readRegistrationEnrollments_`) was applied and committed in
> `5c354637`. Pre-deploy live audit confirmed 0 paid / 0
> refund-needed / 0 canceled rows in the Dashboard at the time of
> commit (247 tx rows total, $48,326.90 balance), so the
> wrong-week → correct-week reshuffle has zero status-preservation
> risk noted in `## Blast radius` below. Open questions 1 & 3 are
> resolved by the audit + the fix itself. Question 2 (Fix B,
> legacy fingerprint canonicalizer) remains optional. Deploy step
> (`clasp push -f` + one-shot `nuclearResetBilling`) NOT yet done
> — see the commit message of `5c354637` for the deploy recipe.
> Kept around for historical context; do not act on the "Open
> questions for the user" section without reading the above first.

**Snapshot of where we are at the end of session 2026-05-22.** Read this first, then `Tom_Systema_Floyd/PROJECT.md` (the changelog from the bottom up is the most recent), then dig into the files referenced below. Everything in this doc is verified unless explicitly flagged as a hypothesis.

## The bug Tom reported

Tom said certain registered students are "missing from the billing dashboard" — Cyrus bar-or (parent `alexandra.berkley@gmail.com`, born 11/9/2015, registered in PAID Upper for the week of 6/15-6/19) was the named example. All 5 days are checked in the source sheet for that row.

## What's actually happening

Cyrus is **not literally missing** from the billing dashboard. Two intertwined bugs make him look that way:

### Bug A — positional tab indexing in `readRegistrationEnrollments_` (the big one)

[Tom_Systema_Floyd/Billing dashboard/apps-script/BillingFromSheets.js:2399](Billing%20dashboard/apps-script/BillingFromSheets.js#L2399):

```js
for (var t = 0; t < tabs.length && t < BFS_WEEK_ORDER.length; t++) {
  var week = BFS_WEEK_ORDER[t];      // pure positional
  var sheet = tabs[t];
  ...
}
```

The billing reader iterates tabs by index and assumes `tabs[N]` is `BFS_WEEK_ORDER[N]`. Tom's source spreadsheets have at least one **extra tab** (or shifted order) that breaks this assumption — verified by:

- snapshot.json (which uses **name-based** `resolveWeek_` in [sheets-snapshot/apps-script/Snapshot.js:312](sheets-snapshot/apps-script/Snapshot.js#L312)) says Cyrus's row is in the tab named `6/15-6/19`, gid=`44844437`, row 5.
- The billing dashboard has Cyrus's lunch + (canceled) tuition rows with `sourceGid=44844437, row=5` but the **week label is `June 22nd-26th`** (one tab later than truth).
- Akasha Smith follows the same pattern: snapshot says she's in `August 3rd-7th` (gid=470608811); billing labels her rows `August 10th-14th` (also gid=470608811).
- Grant Olowin (Lower sheet): snapshot says `June 8th-12th`; billing source link points at gid=0 which is actually `June 1st-5th`.

So **every kid registered after the shift point gets billed under the wrong week**. That's why Tom couldn't find Cyrus where he expected — Cyrus is filed under `June 22nd-26th` instead of `June 15th-19th`.

This is exactly the bug pattern memory `project_systema_floyd_sheet_tab_names.md` warned about. Snapshot.js was fixed by introducing `resolveWeek_` / `weekKey_` that resolves week labels from tab names ("6/15-6/19" → "June 15th-19th") instead of position. The billing reader **never got that fix.**

### Bug B — whitespace inside tuition fingerprints (secondary; possibly already self-resolving)

Some old tuition rows have fingerprints like `cyrus-bar-or|june-22nd-26th|tuition|5 days` (note the **space** in `5 days`). Current code at [BillingFromSheets.js:2830](Billing%20dashboard/apps-script/BillingFromSheets.js#L2830) builds fingerprints as `fpBase + '|tuition|' + bfsSlug_(tuitionKey)` which slugifies to `5-days` (hyphen) via `bfsSlug_` ([line 2966](Billing%20dashboard/apps-script/BillingFromSheets.js#L2966)). So **the current code is right**, but old rows with the spaced form persist and never match a fresh fingerprint → diff-apply marks them `canceled` forever.

Cyrus's tuition row has the spaced form → status=canceled. Cyrus's lunch row has a clean fingerprint (no spaces in `lunch|pizza`) → status=owed. Grant Olowin's tuition has clean `5-days` form → status=owed.

Memory `feedback_systema_floyd_fingerprint_whitespace.md` flagged this previously. The fix is either (a) a one-off canonicalizer that rewrites old whitespace-bearing fingerprints in place, or (b) ignore — canceled rows don't count toward balance, so leaving them as harmless noise is acceptable.

## Proposed fixes

### Fix A — port name-based tab resolution into billing

Add `bfsWeekKey_` + `bfsResolveWeek_` helpers in `BillingFromSheets.js` (copy the logic verbatim from `weekKey_` / `resolveWeek_` in `Snapshot.js:299-317`). Replace the loop in `readRegistrationEnrollments_`:

```js
// BEFORE
for (var t = 0; t < tabs.length && t < BFS_WEEK_ORDER.length; t++) {
  var week = BFS_WEEK_ORDER[t];
  var sheet = tabs[t];
  ...
}

// AFTER
for (var t = 0; t < tabs.length; t++) {
  var sheet = tabs[t];
  var week = bfsResolveWeek_(sheet.getName(), t);  // name-based, t only as
                                                   // ultimate fallback
  if (!week) continue;       // skip tabs that don't resolve (Billing, Notes, ...)
  ...
}
```

**Important decision**: should the fallback to positional be kept? In `Snapshot.js` it falls back to position when the name doesn't parse. For the billing dashboard, where wrong week = wrong charge, I'd argue **drop the positional fallback** and skip un-resolvable tabs entirely. Safer.

### Fix B — canonicalize legacy fingerprints (optional)

Write a one-shot RPC `_rtRecanonicalizeFingerprints_` that walks every tx row's Col B note, parses the fingerprint, re-slugifies it through `bfsSlug_`, and writes it back if changed. Whitelist via RemoteTrigger.js. Run once, no scheduled retrigger.

Or just live with the canceled-noise rows — they don't affect balance math.

## Blast radius of the Fix A reconcile

After applying Fix A and running `buildAllBilling`:

- Every customer whose source row is in a "shifted" tab will see their existing wrong-week billing rows **flip to `canceled`** (no longer match any source enrollment because the week label in the fingerprint changed).
- **New rows** get added under the correct weeks, status `owed`.
- Net dollar amount is unchanged (same enrollments, just relabeled), but the dashboard will roughly **double its row count for affected customers** until Tom acknowledges and hides/cleans the canceled rows.
- For customers who have already paid: their `paid` rows will also flip to `canceled` (since fingerprints no longer match), but the cancellation logic might preserve paid-status — **needs to be verified before running**. Check what `buildAllBilling` / the diff-apply does to a row whose fingerprint disappears but status is `paid`.

Best path: snapshot the Dashboard tab to a backup tab → run Fix A → run `buildAllBilling` → manually reconcile any paid-row drift → delete backup.

## How to verify before pushing the fix

1. From the Apps Script editor (`emilio@nilsdigital.com` is fine for `clasp push`, but deployment changes require `systemafloydsheets@gmail.com`), run a diagnostic that lists tab names + positions in the Upper Campus + Lower Campus sheets. This will pinpoint **where** the extra tab is so you understand the shift's start.
2. Confirm at least 2 more known-shifted kids beyond Cyrus + Akasha + Grant Olowin, by running `traceCustomer` via the remote-trigger webapp (token in `.env`, URL `SF_BILLING_REMOTE_TRIGGER_URL`).
3. Eyeball the diff that Fix A would produce by running it in a one-off "dry run" — easiest is a forked copy of `readRegistrationEnrollments_` that returns its results without writing.

## Files touched this session (already committed + pushed)

- `Tom_Systema_Floyd/dashboard/index.html` — added attendance modal "By person" mode, Supabase-synced per-person picks (table `sf_daily_attendance_people` + 3 RPCs), Data Issues card refactored to one explicit `.ops-issue-row` per bad row with plain-English explanation + dedicated `Open ↗` deep-link, `sheetUrlForId` upgraded to take `(id, gid, row)`.
- `Tom_Systema_Floyd/sheets-snapshot/apps-script/Snapshot.js` — adds `sourceGid: sheet.getSheetId()` to every enrollment row in the 4 source-sheet readers + the dedup builders.
- `Tom_Systema_Floyd/App_documentation/dashboard.md` — documented the new attendance table, the deep-link URL convention, and the by-person modal UX.
- Supabase: migration `sf_daily_attendance_people` applied to project `nroeiabeirifurdaybyo`. RPCs gated by the same `claim_secret` as `sf_set_daily_attendance`.
- Apps Script: pushed via `clasp push -f` from `Tom_Systema_Floyd/sheets-snapshot/apps-script/` directory. The 5-min `pushSnapshotToGitHub` trigger picked it up; `sourceGid` now lives in `Tom_Systema_Floyd/dashboard/snapshot.json`.

## Files dirty at end of session (not committed by my edits, may be prior WIP)

- `Tom_Systema_Floyd/Billing dashboard/apps-script/BillingFromSheets.js` — 124 lines of unrelated WIP. Read the diff before committing if you continue someone else's billing work.
- `Tom_Systema_Floyd/Billing dashboard/apps-script/RemoteTrigger.js` — 23 lines of unrelated WIP. Same — read first.
- Various other clients' `PROJECT.md` files have unstaged edits from prior sessions.

## Open questions for the user (don't auto-execute these)

1. **OK to apply Fix A**, knowing it'll churn the Dashboard rows? (Tom will see ~2× row count temporarily until canceled rows are cleaned.)
2. **OK to apply Fix B** (canonicalize legacy fingerprints), or leave canceled noise rows alone?
3. **What's at position 1/2 of the Upper Campus sheet** that's pushing the rest of the tabs down? Investigate before fix so we know the root structural cause, not just the symptom.

## Commands & references the sibling Claude will need

- Project root: `c:\Users\emili\OneDrive\Documents\GitHub\Websites`
- Remote trigger curl (token + URL in `.env` — both must be loaded before the call):
  ```bash
  set -a && . .env && set +a
  curl -sL "${SF_BILLING_REMOTE_TRIGGER_URL}?token=${SF_BILLING_REMOTE_TRIGGER_TOKEN}&fn=traceCustomer&email=alexandra.berkley@gmail.com&sync=1"
  ```
- Apps Script for billing: `Tom_Systema_Floyd/Billing dashboard/apps-script/` (clasp-managed, bound to the Dashboard Sheet).
- Apps Script for snapshot: `Tom_Systema_Floyd/sheets-snapshot/apps-script/` (clasp-managed, standalone, web app deployed at the pinned URL in `.github/workflows/refresh-systema-snapshot.yml`).
- Supabase project: `nroeiabeirifurdaybyo` (Zona Libre), tables `sf_daily_attendance`, `sf_daily_attendance_people`, `sf_camp_enrollments`, `sf_camp_snapshots`. Anon key + URL embedded in `dashboard/index.html`. `claim_secret` for writes is hardcoded — see existing RPC SQL for the literal.
- Memories worth re-reading: `project_systema_floyd_sheet_tab_names.md`, `feedback_systema_floyd_fingerprint_whitespace.md`, `reference_systema_floyd_remote_trigger.md`.
