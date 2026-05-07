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

**Document owner:** Emilio (Nils Digital)
