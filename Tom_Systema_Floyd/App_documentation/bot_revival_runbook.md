# DiscrepancyCheck bot, revival runbook

Use this when the heartbeat-guard email fires (subject usually contains
"DiscrepancyCheck silence broken") or when `sf_bot_health` shows
`discrepancy_check.last_ok_at` more than ~30 minutes stale during
business hours.

Most outages trace back to a stale GHL access token in Supabase
(`public.ghl_tokens.acces_token`). The bot fetches that token fresh on
every run via the `get_systema_floyd_florida_token` RPC. If the token
has crossed its 24-hour TTL and the refresher hasn't run, every GHL
call 401s, the run aborts before the heartbeat is recorded, and
failures are silent (the email-digest branch comes after the work the
HTTP error aborts).

## Quick diagnosis (3 SQL queries)

```sql
-- 1. How stale is the heartbeat?
SELECT component, last_ok_at, now() - last_ok_at AS staleness, metadata
FROM public.sf_bot_health
ORDER BY last_ok_at DESC;

-- 2. How old is the GHL token? TTL is 24h.
SELECT "locationId", account_name, updated_at,
       now() - updated_at AS token_age,
       extract(epoch FROM (now() - updated_at)) / 3600 AS token_age_hours
FROM public.ghl_tokens
WHERE "locationId" = '8IWtNFlmgJ8bif9DivHT';

-- 3. Is the refresher running? (n8n exec history is the source of truth,
-- but a quick sanity check is comparing two consecutive token timestamps.)
```

Interpretation:
- **`discrepancy_check.last_ok_at` more than 60 min stale AND token_age_hours > 24** ⇒ token refresh is broken. Fix that first, then revive the bot.
- **`last_ok_at` stale but token is fresh** ⇒ the bot's trigger has been deleted/disabled, or Apps Script scopes were revoked. Re-install the trigger from the editor.

## Step 1, fix the token refresher

The refresher is the `GHL Token Manager` n8n workflow (id `i9ovjPw1ZDhGB86A`). It's supposed to call GHL's `/oauth/token` endpoint with the stored `refresh_token`, get a new `acces_token`, and write it back to `public.ghl_tokens`.

1. Open n8n: `https://n8n.nilsdigital.com/workflow/i9ovjPw1ZDhGB86A` (or whatever the workspace URL is, the workflow ID is `i9ovjPw1ZDhGB86A`).
2. Confirm the workflow is `Active`. If not, toggle it on.
3. Open the cron trigger node. If the cron expression is `0 */12 * * *` (every 12h) verify it's still saved.
4. Run the workflow manually once. Watch the HTTP Request node. Expected result: 200 OK from GHL, then a Postgres UPSERT into `ghl_tokens` that updates `acces_token` + `updated_at`.
5. If GHL returns 400/401 on the refresh call, the `refresh_token` itself has rotated out of validity. In that case the only path is a fresh OAuth handshake from the GHL UI (re-install the marketplace app for the Systema Floyd FL location). Tom needs to be in the loop on that since it touches his sub-account.
6. Re-run query #2 above. `token_age_hours` should now be near 0.

## Step 2, kick the bot

The Apps Script trigger fires every 15 minutes on its own, so once the token is fresh the bot will heal itself on the next tick. But you can speed it up by running once manually from the editor.

1. Open the Apps Script project, `https://script.google.com/home/projects/1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y/edit` (project id from `App_documentation/registration_system.md`).
2. From the function dropdown, select `runDiscrepancyCheck` and click Run.
3. Open the Executions panel. The run should finish in 30–90 seconds. Look for:
   - `Logger.log` line starting `DiscrepancyCheck: free added=...`
   - No red error icon
4. Re-run query #1. `discrepancy_check.last_ok_at` should now be a few seconds ago.

If `runDiscrepancyCheck` errors with `Missing Script Property: SUPABASE_*`, the script properties got wiped (rare). Restore them from the password vault: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_TOKEN_SECRET`, `DC_NOTIFY_EMAIL` (optional).

If the run succeeds but no rows appear in any sheet despite known unprocessed submissions, run `discrepancyBackfillTracking()` once. That sweeps every existing sheet row and matches it against GHL submissions to stamp the hidden `_submissionId` column, so the bot doesn't try to re-add rows the team typed in manually.

## Step 3, confirm the trigger is still installed

Most "bot dead" incidents are not trigger problems (the trigger keeps firing but the bot dies on the token check). But if the heartbeat stays stale after Steps 1+2, the trigger itself may have been removed.

From the Apps Script editor:
1. Triggers panel (clock icon in the left rail).
2. You should see one row with handler `runDiscrepancyCheck`, type `Time-driven`, every 15 minutes, owner `emilio@nilsdigital.com`.
3. If it's missing, run `discrepancySetupTrigger()` from the editor once. That re-installs.
4. You should also see one row for `discrepancyHeartbeatGuard` (daily). If missing, run `discrepancyHeartbeatSetupTrigger()`.

## Step 4, sweep what was missed during the outage

During the silent-fail window, GHL form submissions may have routed correctly via the primary workflow (no action needed) or fallen through (need backstop). The bot's normal 15-min run will catch any missed submissions on its next tick because Supabase tombstones are the source of truth, not the sheet rows. So if Step 2 succeeded, you've already done the sweep.

To verify how many rows the bot wrote on the catch-up run, check the run's report or:
```sql
SELECT form, status, count(*) FROM public.sf_form_submissions
WHERE recorded_at > now() - interval '1 hour'
GROUP BY form, status ORDER BY form, status;
```

## Why the email digest didn't warn earlier

Two design gaps:
1. The token-age *warning* (`> DC_TOKEN_STALE_WARN_HOURS`, default 12h) only fires when the token fetch **succeeds** but is old — a hard token failure never sets `_dcTokenAgeHours`, so there's no age to warn on.
2. The heartbeat guard runs **daily**, not every 15 minutes. So if the whole script/trigger dies (deauthorized, deleted, quota), you get ~24h of silent failure before the alert fires.

**Current behavior (since the per-form try/catch was added):** a hard token failure no longer goes silent. Each form check (`_dcCheckFreeCamp`, etc.) is individually wrapped in try/catch, and `_dcGhlToken_()` is called inside them — so a broken token throws, is caught, and lands in that form's `errors[]`, which **does** trigger the email digest (errors are part of the noteworthy gate). You get an error email every 15 min with the exception message. The only genuinely silent case is gap #2: the run itself never executing.

A further hardening (not yet done): wrap the token fetch to record a `token_failure` heartbeat and email immediately, so even a dead trigger surfaces faster than the daily guard. Open as a follow-up if this outage class repeats.
