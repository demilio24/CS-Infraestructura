# DiscrepancyCheck Fixes — 2026-05-27

## What happened

Juliana (Systema Floyd Executive Assistant) emailed that 3 scholarship kids didn't appear on the FREE camp sheets:
- **Savannah Hazen** — June 1st-5th
- **Serenity Randolph** — June 1st-5th, July 6th-10th
- **Malia** (no last name) — June 1st-5th, August 3rd-7th

All 3 had valid GHL form submissions (Free Camp form `3Z4E9y7WlWgkZDxViBUW`). The per-week GHL routing workflows failed to write them to the sheets, and the DiscrepancyCheck failsafe also couldn't catch them.

## Root causes found and fixed

### 1. Expired GHL OAuth token (fixed: PIT swap)

**Problem:** The DC fetched its GHL token from Supabase via a `get_systema_floyd_florida_token` RPC. That token is an OAuth token with a 24h TTL, refreshed by an n8n cron (`s1Z2H8GwdaU7n2kG`). The n8n cron has been dead since it hit the plan's execution limit. Token expired, DC couldn't call GHL, silently failed.

**Fix:** Replaced the entire 55-line `_dcGhlToken_()` function with a one-liner returning the Florida PIT (`pit-ba33c398-1647-41c9-9024-98f203d6b30c`). PITs don't expire. The DC no longer depends on n8n or Supabase for GHL auth.

**File:** `sheets-snapshot/apps-script/DiscrepancyCheck.js`, function `_dcGhlToken_()` (was lines 1915-1971, now line 1915).

### 2. En-dash vs hyphen in week names (fixed: normalize in `_dcAsArr`)

**Problem:** The GHL Free Camp form returns en-dashes (`–`, U+2013) in some week labels (e.g. `June 1st–5th`) but `DC_WEEK_TO_TAB` maps regular hyphens (`-`, U+002D). The lookup silently skipped unrecognized weeks. Inconsistency is in the GHL form itself: some weeks use en-dashes, others use hyphens (`August 3rd-7th`).

**Fix:** Added `.replace(/–/g, '-')` in `_dcAsArr()` so all week strings are normalized before any lookup. This is the function that processes the raw weeks field from every form submission.

**File:** `sheets-snapshot/apps-script/DiscrepancyCheck.js`, function `_dcAsArr()` (line ~2504).

## What was deployed

Both fixes pushed via `clasp push -f` from `emilio@nilsdigital.com`. Time-driven triggers pick up `@HEAD` automatically, no deployment bump needed. The DC trigger (`runDiscrepancyCheck`, every 15 min) was re-confirmed via `discrepancySetupTrigger()` run from the editor.

Two manual runs of `runDiscrepancyCheck` from the Apps Script editor:
1. **First run** (PIT fix only): `free added=38, free linked=184, free errors=0`. Added 38 missing kid+week rows, linked 184 existing manual rows. Only 1 of the 3 flagged kids' entries made it (Malia Aug 3-7, the one with a regular hyphen).
2. **Second run** (PIT + en-dash fix): should catch the remaining 4 entries (Savannah June 1-5, Serenity June 1-5 + July 6-10, Malia June 1-5).

## Also done this session

- **Refreshed Florida OAuth token in Supabase** for other systems (billing dashboard) that still use it. The token was manually refreshed via the company master token + `/oauth/locationToken` endpoint. Both the FL `acces_token` + `refresh_token` and the company master `refresh_token` were updated.

## Open items / TODOs

### Immediate (verify)

- [ ] **Confirm the 3 kids landed on the sheets.** After the second DC run, check the FREE Upper sheet (`1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ`) tabs `6/1-6/5` and `8/3-8/7` for Savannah Hazen and Malia, and the FREE Lower sheet (`1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY`) tabs `6/1-6/5` and `7/6-7/10` for Serenity Randolph. Campus rule: Upper = age 6+ as of June 1, 2026.
- [ ] **Reply to Juliana** confirming the kids are on the sheet. She emailed from systemafloyd@gmail.com.

### Short-term

- [ ] **Audit the 38 added rows for correctness.** The DC auto-added 38 rows in the first run. Spot-check a few to make sure campus assignment, week placement, and field mapping are correct. The DC uses grade-based heuristics for campus (Pre-K/K → Lower, 1st+ → Upper).
- [ ] **Check if any other recent submissions have en-dash weeks.** The en-dash issue may have affected more than just these 3 kids. The fix is in place going forward, but any submission that was processed before the fix and had an en-dash week would have been skipped. Run the DC once more and check if `free added` is > 0.

### Longer-term

- [ ] **Fix the GHL form itself.** The en-dash inconsistency is in the Free Camp form's week option labels in GHL. Some weeks use `–` (en-dash) and others use `-` (hyphen). Standardize them all to hyphens in the GHL form builder so the normalize-fix in `_dcAsArr` is defense-in-depth rather than the only guard.
- [ ] **n8n token refresh cron is still dead.** The DC no longer needs it, but other systems do (billing dashboard uses Supabase tokens). Either upgrade the n8n plan or add a self-refresh mechanism in the billing Apps Script project. The FL token refreshed today expires in ~24h.
- [ ] **Consider adding the PIT to the billing dashboard too.** The billing project (`Billing dashboard/apps-script/`) could use the same PIT approach to avoid the OAuth refresh dependency entirely. The FL PIT is `pit-ba33c398-1647-41c9-9024-98f203d6b30c`.

## Key reference

| Item | Value |
|------|-------|
| FL PIT | `pit-ba33c398-1647-41c9-9024-98f203d6b30c` |
| FL Location ID | `8IWtNFlmgJ8bif9DivHT` |
| Free Camp Form ID | `3Z4E9y7WlWgkZDxViBUW` |
| FREE Upper Sheet | `1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ` |
| FREE Lower Sheet | `1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY` |
| Apps Script Project | `1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y` |
| n8n Token Refresh (dead) | Workflow `s1Z2H8GwdaU7n2kG` |
| OAuth client_id | `68334ff3222aadb0b7062c18-mbdajx5l` |
