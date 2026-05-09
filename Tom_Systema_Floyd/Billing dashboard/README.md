# Systema Floyd — Billing Dashboard

Single Google Sheet ("Systema Floyd — Billing Dashboard") backed by Google Apps Script. A 5-minute time-driven trigger polls `/forms/submissions` in three GoHighLevel subaccounts (Florida, Georgia, Virginia), writes one customer row per unique email plus collapsible groups of transaction rows beneath, and exposes a per-customer balance hyperlink that opens the right GHL subaccount profile so the operator (Erin) can charge the customer's card.

**Owner:** Tom Floyd (Systema Floyd Martial Arts)
**Operator:** Erin
**Built by:** Emilio (Nils Digital)
**State:** Stages 1–9 shipped. Five focused follow-ups remain (see `prompts/`).

---

## Folder layout

| Path | What's there |
|---|---|
| [`apps-script/`](apps-script/) | Source code, cloned via `clasp` from the live Apps Script project. `.gs` files come down as `.js` — `clasp push` converts back. |
| [`docs/`](docs/) | The two authoritative design docs: architecture spec + pricing convention. |
| [`prompts/`](prompts/) | Five open follow-up prompts numbered 1–5. Run in that order. |

## How to run the open work

Read [`prompts/README.md`](prompts/README.md). Short version: paste each prompt 1 → 5 in order, either into a fresh Chrome-extension session OR (preferred) hand it to Claude Code locally. Once `5-final-acceptance.md` signs off PRODUCTION-READY, the build is done.

## How to develop locally

```
# One-time setup (already done):
#   npm install -g @google/clasp
#   clasp login
#   clasp clone <SCRIPT_ID> in apps-script/

# Daily flow:
cd "Tom_Systema_Floyd/Billing dashboard/apps-script"
# ... edit files ...
clasp push                # push local changes back to Apps Script
clasp pull                # pull cloud changes into local files
clasp open                # open the project in the browser
```

The Apps Script editor is still where you Run functions, view real-time execution logs, and manage triggers — clasp doesn't replace those. It replaces the read/edit step with proper local files that Claude Code (or any editor) can read in full without the Chrome extension content-filter clipping reads.

---

## Live operational state (read this before debugging)

**Account ownership** — diverges from who created the project. Don't assume.

| Layer | Account | Why |
|---|---|---|
| Sheet ownership | `systemafloydsheets@gmail.com` | Tom's account. Don't change. |
| Script ownership / clasp deploy | `systemafloydsheets@gmail.com` | Owns the bound script. Current `~/.clasprc.json` is authed as this account. |
| Time-driven triggers (`pollFloridaSubmissions`, `dailyHealthCheck`) | `emilio@nilsdigital.com` | Moved 2026-05-08 to escape the 20K consumer UrlFetch daily quota. Workspace gives 100K. |
| GCP project linked to script | `systema-floyd-billing` (project number visible in Script Editor → Project Settings) | Created for `clasp run` autonomy; OAuth consent screen is in **Testing** mode, not verified. |
| OAuth test users (allowlist) | `systemafloydsheets@gmail.com`, `emilio@nilsdigital.com` | New users get hard 403 ("Access blocked: app not verified") until added at https://console.cloud.google.com/apis/credentials/consent (must be signed in as `systemafloydsheets@gmail.com` to edit). |
| GHL API tokens (`GHL_TOKEN_FLORIDA` etc.) | Script Properties | Tied to the project, not any user. Survive trigger ownership changes. |

**Polling cadence** — every 5 min via `pollFloridaSubmissions` time-driven trigger. Don't guess: open Script Editor → Triggers panel as `emilio@nilsdigital.com` to see live state.

**Per-poll cost** — at this writing:
- 1 UrlFetch call (`ghlListSubmissions`) on every idle poll
- + 1-2 calls per new submission for contact lookup
- + ~3×N calls (where N = Dashboard customer count) for `syncTransactionsSheet`, **but only when a poll processes new submissions** — see the gate at `Polling.js:678`

If you see ~22K calls/day or unexplained quota errors, the gate has been removed. Re-add the `processedCount > 0 &&` guard before `syncTransactionsSheet()` in `pollFloridaSubmissions`.

**Debugging quota / trigger / run-state** — run the `debugQuotaState` function in `Polling.js`. It dumps:
- Effective vs. active user (so you know which quota is being charged)
- All triggers visible to the running user (NB: only shows triggers owned by the runner)
- `lastPolledAt`, `lastPollSummary` Script Properties
- Last 8 rows of the Logs sheet

Run it from the editor signed in as the account whose quota you suspect (usually `emilio@nilsdigital.com`).

**Quota math at current customer count (~636 Dashboard rows ≈ 100-150 customers):**
- Idle days: ~300 calls/day on the 100K Workspace quota (0.3%)
- Active days with frequent submissions: still well under 5%
- The system is effectively un-blowable at any realistic scale

**Email notifications** — `notifyError` in `Notifications.js` emails `emilio@nilsdigital.com` on any `poll_error`, with a 1-hour throttle per `(severity, subject)` pair so a stuck loop sends one alert per hour, not 12.

---

## How to make changes (the safe sequence)

1. Edit files in `apps-script/` locally
2. From `Tom_Systema_Floyd/Billing dashboard/apps-script/`: `npx --yes @google/clasp@latest push -f`
3. If you changed trigger configuration: open the editor as `emilio@nilsdigital.com` and re-run `installPollingTrigger` and/or `installDailyHealthCheckTrigger`. Re-running deletes the old trigger and installs the new one — both atomic operations on emilio's trigger inventory only.
4. If you added a new OAuth scope: emilio will be re-prompted to consent on the next manual run. Triggers continue running on the previous consent until manually re-authorized.
5. Verify with `debugQuotaState` and a fresh `lastPolledAt` Script Property.

---

## Production architecture (one-liner per piece)

| File | What it owns |
|---|---|
| `Configuration.js` | `SUBACCOUNTS` const, COL constants (`NAME_OR_DATE=1`, `EMAIL_OR_ITEM=2`, ..., `BALANCE_OR_STATUS=7`), `STUDENT_NAME_FIELD_IDS`, `getTokenFor`. |
| `Helpers.js` | Pure helpers: `parsePrice`, `extractMultiplier`, `stripPriceFromLabel`, `parseDurationDays`, `parseMultiSelectValue` (paren-aware), `resolveSubaccount`, `ghlSearchContactByEmail`, `buildProfileUrl` (now `app.nilsdigital.com`). |
| `SheetWrites.js` | All Dashboard cell writes: `getDashboardSheet`, `findCustomerRowByEmail`, `findCustomerTxRange`, `upsertCustomerRow`, `appendSubHeaderRow`, `appendTxRow`, `applyStatusDropdown`, `updateBalanceFormula`, `applyRowGrouping`, `setGroupExpansion`. |
| `Webhook.js` | Legacy `extractSubmissionFields` (still used by polling). The webhook receiver `doPost` was deleted in Stage 6. |
| `Triggers.js` | `onEdit`, `findOwningCustomerRow` (walks up to the customer row owning a tx edit). |
| `Menu.js` | `onOpen`, the Maintenance menu (`Re-sort by email`, `Show debug log`), the Bulk menu (`Set selected customer's tx rows → paid/owed/canceled/refunded`). |
| `Polling.js` | The 5-minute cron entry points (`pollFloridaSubmissions`, GA, VA), `processSubmission`, `seenSubmissionIds` (dual-source dedupe: Logs sheet primary, Dashboard cell-notes backup), `replayAllSubmissions`. |
| `Notifications.js` | `notifyError`, `dailyHealthCheck` (emails `emilio@nilsdigital.com` if anything errors). |
| `FieldRegistry.js` | `getFieldRegistry` / `refreshFieldRegistry` for caching `/locations/{id}/customFields` so we can translate `payload.others`'s field IDs into named fields. |
| `QA.js` | `runFullQA` — full self-test across categories A–H. Run after every change. |

For the full architecture picture, layout diagrams, pricing examples, and worked-out balance math, see [`docs/billing-dashboard-plan.md`](docs/billing-dashboard-plan.md).

---

## Change history

### 2026-05-08 — UrlFetch quota fix + Workspace migration

**Symptom that started this:** `[CRITICAL] GHL polling failed` emails arriving every hour for ~36 hours straight, all with `API error: Service invoked too many times for one day: urlfetch.` Root-caused via Logs sheet inspection + the `Polling.js` source.

**Root cause:** `syncTransactionsSheet` (a Transactions-sheet rebuilder that calls 3 GHL endpoints per Dashboard customer) ran unconditionally on every 5-min poll. At ~138 customers it produced ~22,000 UrlFetch calls/day, which sailed past the 20,000/day consumer-Gmail UrlFetch quota that `systemafloydsheets@gmail.com` was running on. Once the daily counter hit zero, every subsequent poll failed at the very first API call until midnight Pacific.

**Fix sequence shipped this day:**

1. **Polling 5 min → 30 min** as an immediate weekend bandaid (`installPollingTrigger` updated, re-run from editor). 6× call reduction, but still close to the line.
2. **`syncTransactionsSheet` gated** behind `processedCount > 0` ([`Polling.js:678`](apps-script/Polling.js#L678)). Idle polls dropped from `1 + 3N` calls to just 1. Combined with cadence change, daily volume crashed from ~22K to ~300.
3. **Triggers migrated** from `systemafloydsheets@gmail.com` (20K quota) to `emilio@nilsdigital.com` (Workspace, 100K). Required:
   - Sharing the Sheet with emilio as Editor
   - Deleting old triggers from the Gmail account's Triggers panel (those triggers are owned by *whoever installed them*, so only that user can delete them — file ownership transfer would NOT have moved them)
   - Re-running `installPollingTrigger` and `installDailyHealthCheckTrigger` as emilio
   - Adding `emilio@nilsdigital.com` as a test user on the `systema-floyd-billing` GCP project's OAuth consent screen (the script's bound OAuth screen is in **Testing** mode, which gives non-allowlisted users a hard 403, distinct from the standard "unverified app" warning that lets you bypass via "Advanced → Go to project")
4. **Polling restored to 5 min** once the gate + Workspace move were in place. New form submissions now appear on the Dashboard within 5 min instead of 30.
5. **`debugQuotaState` helper added** ([`Polling.js`](apps-script/Polling.js)) — dumps effective user, all visible triggers, `lastPolledAt`, `lastPollSummary`, and the last 8 Logs rows. Run from the editor whenever you need to verify trigger state without poking the live sheets.

**Trade-off accepted with the gate:** refunds, voids, and manual GHL edits no longer auto-reflect on the Transactions sheet within 5 minutes. They appear on the next poll that processes a new submission. If real-time refund/void monitoring becomes important, the right move is a standalone `installTxSyncTrigger()` running `syncTransactionsSheet` every 60 min independent of polling — captured as a TODO.

**Verification:** `debugQuotaState` confirmed `Session.getEffectiveUser() = emilio@nilsdigital.com` post-migration. Gmail account's Triggers panel verified empty. Logs sheet `poll_error` rows stopped after midnight Pacific (which is when the 20K Gmail quota counter resets). Steady-state daily call volume now ~0.3% of emilio's 100K Workspace cap.

### Companion change in `Tom_Systema_Floyd/sheets-snapshot/`

The dashboard snapshot pipeline (separate from this billing dashboard, but architecturally related) was rewired the same day to bypass the unreliable GitHub Actions cron and write directly from Apps Script to GitHub via the Contents API. See [`Tom_Systema_Floyd/sheets-snapshot/README.md`](../sheets-snapshot/README.md) for that one's history.

---

**Document owner:** Emilio (Nils Digital)
