# Systema Floyd Billing Dashboard — Build Report

A Google Apps Script project bound to a Google Sheet that turns every Systema Floyd
camp-registration form submission into a structured, collapsible billing record, polls
GoHighLevel (GHL) every 5 minutes for new submissions, and surfaces a separate
payment-history tab pulled live from each customer's GHL subaccount.

This report is two parts:
1. **What the application does** — for stakeholders / future maintainers who need the
   mental model.
2. **Developer notes** — design decisions, gotchas, file map, and the demo-prep work
   we did at the end.

---

## 1. Application description

### What it is

A Google Sheet (the **Billing Dashboard**) lives at the center. Apps Script code attached
to the sheet handles three concerns:

- **Ingest** — every 5 minutes, poll GHL for new camp-registration form submissions.
- **Project** — turn each submission into a structured row block on the Dashboard tab,
  parse pricing rules, group rows per customer, recompute balances.
- **Mirror** — keep a separate Transactions tab in sync with each customer's actual
  payment history pulled live from their WaiverOrigin subaccount.

Three GHL subaccounts feed it: **Florida** (canonical contact home + polling source),
**Georgia**, and **Virginia**. Contacts always live in Florida; payments live in
whichever subaccount the customer's *Waiver Origin* custom field routes them to.

### Two views the team works in

#### Dashboard tab — what the customer owes

Every customer becomes a contiguous block of rows:

| Row | Color | Purpose |
|---|---|---|
| Customer row (1) | Dark blue (#143980), bold white | Name / Email / Phone / WaiverOrigin / Students / Profile link / Balance |
| Sub-header (1) | Mid blue (#4A6493) | `DATE / ITEM / UNIT PRICE / DAYS / WEEKS / TOTAL / STATUS` |
| Tx rows (N) | White | One row per item the customer owes/paid |

The whole `[sub-header … last tx row]` range is wrapped in a collapsible row group, so
the team can drill into one customer at a time. Verification fee rows post as `paid`
automatically (since GHL already charged the $1); everything else posts as `owed`.

**Filter strip (row 1, cols H/I/J) — same widget pattern on both sheets:**

- **H1** (`Filters`) — `Filters` / `Owes a balance` / `Fully paid`
- **I1** (`All items`) — `All items` / `Hide paid items`
- **J1** (`Actions`) — `Actions` / `Minimize all groups` / `Expand all groups`

Default values read as the column-label themselves so the cell is self-explanatory.
J1 actions reset to `Actions` after firing, so they're re-pickable.

**Status pills** are smart-chip dropdowns (rendered via the Sheets advanced API with
`showCustomUi: true`) that pick up semantic colors from sheet-wide conditional
formatting:

| Status | Background | Foreground |
|---|---|---|
| paid | #D4EDDA | #155724 |
| owed | #F8D7DA | #721C24 |
| canceled | #FFF3CD | #856404 |
| refunded | #FFE5CC | #A05A00 |

**Bulk status changes** work two ways:
- Sub-header `STATUS` cell → dropdown picker with "Mark all paid / owed / canceled /
  refunded" — sets every tx row in that customer's block (verification fee excluded),
  resets back to `STATUS` after firing.
- Multi-cell select in col G → type a status → Ctrl+Enter — sets every selected tx row,
  recomputes balance + balance-note for every customer touched.

**Balance cell** is a SUMIFS formula that subtracts refunded amounts. Each balance cell
also carries a copy-pasteable Note listing every owed item in plain English ("Items
owed:" + bullets) so the team can paste it directly into a payment description.

**Grand total** sits in row 1 col G as a header-style formula:
`Balance: $X,XXX.XX = SUMIF(B:B, "*@*", G:G)`.

#### Transactions tab — what the customer paid

Mirrors the Dashboard's row-block layout (dark-blue customer / mid-blue sub-header /
collapsible group of tx rows), but the data is a live read from
`/payments/transactions` in the routed subaccount:

```
Customer row:  Name | Email | Phone | Students | Subaccount | Profile | Net Total Paid
Sub-header:    DATE | SOURCE | AMOUNT | STATUS | CARD | RECEIPT | REFUNDED
Tx rows:       Apr 12 2026 | Stripe Checkout | $215.00 | succeeded | VISA •••• 4242 | Open receipt | $0.00
```

- Profile link goes to the **subaccount** contact (where refunds and card updates
  happen), with the FL profile URL stored as a cell Note for cross-reference.
- Net Total cell carries a rich Note: routing, succeeded/refunded/failed/pending
  counts and amounts, last payment date, average succeeded amount.
- Source cell on each tx row carries the GHL transaction ID as a Note.
- Status pill conditional-formatting on col D: succeeded=green, refunded=orange,
  failed=red, pending=yellow.
- Customers with zero transactions are skipped so the sheet stays compact.
- Auto-refreshes on **every** poll cycle (no menu, no buttons). Filters persist
  across rebuilds because they live in row 1 cols H/I/J — outside the data area
  that gets wiped on each sync.

**Filter options on Transactions:**

- **H1** (`Filters`) — `Filters` / `With refunds` / `With failures` / `Has card on file` / `No payments yet`
- **I1** (`All transactions`) — `All transactions` / `Succeeded only` / `Refunded only` / `Failed only` / `Pending only`
- **J1** (`Actions`) — `Actions` / `Minimize all groups` / `Expand all groups`

#### Logs tab — audit trail

Every poll attempt and every submission's outcome lands here:
`Timestamp | Submission ID | Email | Status | Details | Raw Payload`. Status is one
of `processed / duplicate / lead_only / failed / poll_error`, each with its own
conditional-format row color. The `submission_id` column also doubles as the
authoritative dedup source (see *Dedup* below).

### Data flow per submission

```
GHL form submission
  ↓ 5-min poll (pollFloridaSubmissions)
ghlListSubmissions('Florida', startAt, endAt)
  ↓ for each submission
processSubmission(submission)
  ├─ ghlGetContact('Florida', contactId)         (canonical contact home)
  ├─ readWaiverOrigin(contact)                    (custom field → subaccount routing)
  ├─ resolveSubaccount(waiverOrigin)              (Florida / Georgia / Virginia)
  ├─ ghlSearchContactByEmail(targetSub, email)    (find same contact in routed sub)
  ├─ buildProfileUrl(loc, contactId)              (deep-link for col F)
  ├─ upsertCustomerRow                            (creates dark-blue header row)
  ├─ appendSubHeaderRow                           (mid-blue, with bulk-action dropdown)
  ├─ for each priced field on submission:
  │   appendTxRow(customerRow, { item, unitPrice, multiplier, pricingRule, days,
  │                              weeks, selectedWeeks, status, ... })
  │   → multi-week answers fan out into one tx row per selected week
  ├─ updateBalanceFormula                         (SUMIFS minus refunded)
  ├─ applyRowGrouping + setGroupExpansion         (collapsed if balance == 0)
  └─ logEvent → Logs tab
↓ poll tail (when processedCount > 0)
repairAllSubHeaders / regroupAllCustomers / refreshGrandTotalHeader /
setupBalanceFilterToggle / applyChipDropdownsToAllTxRows / refreshAllBalanceNotes
↓ poll tail (every poll, regardless of new submissions)
syncTransactionsSheet → rewrite Transactions tab from live GHL payment data
```

---

## 2. Developer notes

### File map

```
apps-script/
├── appsscript.json     — manifest (V8 runtime, Sheets v4 advanced service, OAuth scopes)
├── Code.js             — entry/glue
├── Configuration.js    — SUBACCOUNTS map, COL constants, GHL_API_BASE, regex constants, getTokenFor
├── Helpers.js          — buildBalanceFormula, buildProfileUrl, ghlSearchContactByEmail,
│                         resolveSubaccount, readCustomField, plus inline test harness
├── FieldRegistry.js    — Map<fieldId, {name, dataType, picklistOptions}> from
│                         /locations/{id}/customFields, cached via PropertiesService
├── Polling.js          — pollFloridaSubmissions, processSubmission, readWaiverOrigin,
│                         ghlGetContact, ghlListSubmissions, setupLogsSheet,
│                         seenSubmissionIds, logEvent, installPollingTrigger
├── SheetWrites.js      — Dashboard writers + filter machinery + balance Notes:
│                         upsertCustomerRow, appendSubHeaderRow, appendTxRow,
│                         applyStatusDropdown, applyChipDropdownsToAllTxRows,
│                         updateBalanceFormula, applyRowGrouping, setGroupExpansion,
│                         buildBalanceNoteText, refreshBalanceNoteForCustomer,
│                         refreshAllBalanceNotes, setupBalanceFilterToggle,
│                         applyAllFilters_, collapseAllGroups, expandAllGroups,
│                         repairAllSubHeaders, resetAllRowGroups_,
│                         applyStatusActionDropdown, addQuickActionCheckboxes,
│                         setupFilterViews
├── Triggers.js         — onEdit dispatcher (Dashboard + Transactions filter cells +
│                         status flips + sub-header bulk actions + new-row inside-group),
│                         findOwningCustomerRow, isTxRow, extractProfileUrlFromCell
├── Menu.js             — onOpen (intentionally empty after the modal removal),
│                         resortByEmail, reprocessLeadOnlySubmissions, bulkSetStatus
├── Payments.js         — tx_searchContacts, tx_fetchTransactions (returns subContactId
│                         + subaccountLocationId so Transactions.js can build subaccount
│                         deep-links)
├── Transactions.js     — TX_SHEET_NAME, getTransactionsSheet, setupTransactionsSheet_,
│                         setupTxFilters_, applyTxFilters_, collapseAllTxGroups,
│                         expandAllTxGroups, syncTransactionsSheet, buildBreakdownNote_,
│                         getDashboardFontFamily_, extractContactIdFromProfileUrl,
│                         resetTransactionsSheet_
├── Notifications.js    — notifyError (tiered email alerts on poll/data failures)
├── Webhook.js          — doPost handler for GHL webhook fallback path
└── QA.js               — test suites + maintenance + auditing + normalizers:
                          runFullQA, prompt5FinalAcceptance, stressTest, nuclearReset,
                          leanReset, drainPolls, refreshAllWaiverOrigins,
                          dumpRegistry, listFloridaCustomFields, inspectContactCustomFields,
                          revertAllCustomersToOwed, revertPaidToOwedForCustomer,
                          revertFirstNCustomers, clearColHNotes,
                          setAllStatusesToOwed,            ← new (this session)
                          auditTxItemSyntax,                ← new (this session)
                          auditTxItemSyntaxFlat,            ← new (this session)
                          dumpAllTxItemsFlat,               ← new (this session)
                          normalizeLegacyTxRows             ← new (this session)
```

### Key design decisions

#### Polling, not webhooks

GHL webhooks are unreliable (delivery gaps, ordering quirks). The app uses a 5-minute
time-driven trigger calling `pollFloridaSubmissions`, which queries
`/forms/submissions?startAt=lastPolledAt&endAt=now`. Robust against missed webhooks,
trivially replayable, and `lastPolledAt` is stored in `PropertiesService` so a crashed
run resumes from the right cursor on the next tick.

A `LockService.getScriptLock()` at the top of the polling job prevents two concurrent
5-min triggers from double-processing if the previous run is still alive.

#### Routing: contacts live in FL, payments live in WaiverOrigin

The "Waiver Origin" custom field on the FL contact is the routing key. We poll
Florida only; for each new submission we fetch the contact, read Waiver Origin via
`readWaiverOrigin(contact)` (which iterates `getFieldRegistry()` as a `Map`, not
object — the Map gotcha bit us once), then `resolveSubaccount(waiverOrigin)` returns
`'Florida' | 'Georgia' | 'Virginia'`. Profile links and payment lookups go to the
routed subaccount.

#### Dedup is two-source

`seenSubmissionIds()` returns a Set populated from:
1. **Logs sheet col B** (primary) — append-only, survives Dashboard wipes/resets.
2. **Dashboard col B Notes** (backup) — catches rows that predate the Logs sheet.

The `processSubmission` early-exit on `seen.has(submissionId)` makes the polling job
idempotent.

#### Idempotency everywhere

`syncTransactionsSheet`, `repairAllSubHeaders`, `regroupAllCustomers`,
`addQuickActionCheckboxes`, `setupBalanceFilterToggle`, and `normalizeLegacyTxRows` are
all designed so re-running is a no-op. The polling tail therefore bundles all of them
without coordination.

#### Pricing rules

`PRICE_REGEX = /\$(\d+(?:\.\d{1,2})?)(\/day|\/week)?/` is the only thing that decides
whether a tx row is `flat`, `per_day`, or `per_week`. The regex looks for `$X` in the
form-answer text and an optional `/day` or `/week` suffix. This is the contract with
the form: as long as the answer text contains `$X/day` or `$X/week` somewhere, the
parser does the right thing. Otherwise it falls through to flat.

The col F formula for each tx row references C/D/E directly, so anyone clicking into
the Total cell can see the math:

| Pricing rule | Formula |
|---|---|
| flat | `=C<row>` |
| per_week | `=C<row>*E<row>` |
| per_day | `=C<row>*D<row>*E<row>` |

#### Multi-week breakdown

When the form answer includes a `selectedWeeks` array (camps where the parent picks
multiple weeks at once), `processSubmission` fans out one tx row per week — each row
gets the week label appended to the Item text (e.g., `"Camp Duration: 5 days
(June 1st-5th)"`) and `weeks=1` on that row. Mirrors how a customer would see the
charges break down on a Stripe statement.

#### Status chip rendering

Apps Script's `Range.setDataValidation(...requireValueInList(values, true))` produces
a dropdown **arrow**, not a chip. To get the modern smart-chip pill rendering we use
the Sheets advanced API directly:

```js
Sheets.Spreadsheets.batchUpdate({
  requests: [{
    setDataValidation: {
      range: { sheetId, startRowIndex: r-1, endRowIndex: r,
                startColumnIndex: 6, endColumnIndex: 7 },
      rule: {
        condition: { type: 'ONE_OF_LIST', values: [{userEnteredValue:'paid'}, ...] },
        showCustomUi: true,
        strict: true
      }
    }
  }]
}, ssId);
```

`showCustomUi: true` is the key. `applyChipDropdownsToAllTxRows` batches every tx
row's request into a single `batchUpdate` call to keep the API hit count down.

#### Auth model and the Transactions modal saga

The original Transactions feature was a Sheets HtmlService modal with a search box.
It worked once authorized — *for the script owner*. But every other Google account
hit `"Authorization is required to perform that action"` when typing in the search
box, even after `grantAuthorizationOnce` succeeded.

Root cause: `google.script.run` callbacks from `HtmlService` don't always inherit the
parent menu handler's full OAuth scope on a per-user-session basis (this is a
documented Sheets quirk). It's not fixable from the script side.

**Solution: replace the modal with a sheet.** The Transactions tab refreshes via the
polling tail (`syncTransactionsSheet` running in the trigger context, which has full
scope by definition), and the H1/I1/J1 dropdowns work via the standard onEdit
trigger. No HtmlService callbacks anywhere → no auth dance.

#### Filter cells survive sheet rebuilds

`syncTransactionsSheet` wipes and re-writes cols A:G on every poll. The H/I/J filter
cells live in row 1 only and are never wiped, so the user's selected filter persists
across rebuilds. `setupTxFilters_` only resets a cell value if the current value
isn't in the option list, which means re-runs leave a valid selection alone.

#### Font matching

`getDashboardFontFamily_()` reads `dash.getRange(2, 1).getFontFamily()` (or A1 if
empty) and `syncTransactionsSheet` applies it to the entire Transactions data area
in one batch `setFontFamily` call. Whatever the team picks for the Dashboard
propagates without code changes.

#### Refunds vs the balance formula

`buildBalanceFormula` is `SUMIFS(F:F, G:G, "owed") - SUMIFS(F:F, G:G, "refunded")`.
Refunded items reduce the balance (they're money the business owes the customer).
The balance Note's "Items refunded (we owe customer):" section makes this explicit
to anyone reading the cell.

### Things to watch out for

- **`acces_token` typo** in the Supabase `ghl_tokens` table is intentional and load-
  bearing — n8n workflows reference it by that exact name. Don't "fix" it.
- **`getFieldRegistry()` returns a `Map`, not a plain object** — iterate with
  `.forEach()` or `.get(id)`, never `for-in` (that one bit us once when reading
  Waiver Origin).
- **`insertRowAfter` copies data validation from the row above.** If the row above is
  a tx row (with the status-only chip dropdown), the new row inherits the same
  validation, which then *rejects* a SUMIFS formula on a customer-row balance cell.
  Every writer that calls `insertRowAfter` must follow it with `clearDataValidations`.
- **Verification fee rows are sacred.** Every bulk-action handler skips rows whose
  Item is exactly `"CC verification fee"` — they're real Stripe charges and must
  stay `paid`.
- **Don't run on the Apps Script 6-min execution limit.** `nuclearReset` used to
  exceed it; we split it into `leanReset` + `drainPolls` so the dashboard can be
  rebuilt in two steps. If `syncTransactionsSheet` ever grows past 6 min as customer
  count climbs, throttle it to every Nth poll via a `lastTxSyncAt` Script Property.
- **Test data leaks.** The `systemafloydsheets@gmail.com` Pakistan-timezone entries
  in `Form Submission.csv` are test submissions. They never reach the Dashboard
  because they have no Waiver Origin set — but if filtering ever changes, watch for
  them.

### Demo prep work (this session)

These functions all live in `QA.js`. They are explicitly *not* on the polling tail —
they're one-shots invoked manually via `clasp run` or the Apps Script editor.

#### `setAllStatusesToOwed()`
Force every tx row on the Dashboard to status `owed`, except `CC verification fee`
rows. Stronger than the older `revertAllCustomersToOwed` (which only flips
paid → owed): this also normalizes `canceled` and `refunded` back to `owed`.
Recomputes balance + balance-note for each customer touched.

Run result during demo prep: 16 customers checked, 13 rows flipped (Lauren 6,
Samantha 4, Daniela 3); other 13 customers were already at `owed` (verification
fees correctly preserved).

#### `auditTxItemSyntax()` / `auditTxItemSyntaxFlat()` / `dumpAllTxItemsFlat()`
Walk every Dashboard tx row, parse multiplier from col C number format, days/weeks
from D/E, source field from col B's cell note. Flag rows likely affected by the
day/week syntax change:
- `looks_undermultiplied` — flat unit format but days>1 or weeks>1
- `flat_high_amount` — flat unit ≥ $200 with no days/weeks (suspicious for camps)

The Flat / All variants exist because `clasp run` collapses nested arrays as
`[Array]`, so the flat string version is what you actually read.

#### `normalizeLegacyTxRows()`
One-shot fixer that brings every legacy-form tx row into the new visual format:
detects camp-registration source fields (`Select Camp Duration`,
`After care options`, `Select lunch option`, `Select Breakfast Option`) with `flat`
unit format, then:

| Original answer text | Becomes |
|---|---|
| Contains `"Full Week"` or `"weekly"` | `/week`, weeks=1, formula `=C*E` |
| Other Camp Duration answers | `/week`, weeks=1 |
| Anything else (after care, lunch, breakfast) | `/day`, days=1, weeks=1, formula `=C*D*E` |

Total stays mathematically identical. Each touched row gets a fresh "normalized
from legacy form syntax" Note. Idempotent — second run is a no-op since the
filter-on-flat-format short-circuit fires.

Run result during demo prep: **14 rows normalized across 6 customers** (Greg
Grant, Olivia Thomason, Laura Cook, Kelly Trochez, Iwona Robinson, Jason Fennell).
Every balance verified unchanged. The Dashboard now displays a uniform format
regardless of which form syntax the submission came from.

### Operational reference

| Action | How |
|---|---|
| Install the 5-min polling trigger | Run `installPollingTrigger` once from the Apps Script editor |
| Manual one-off poll | Run `pollFloridaSubmissions` |
| Resort customers alphabetically by email | Run `resortByEmail` |
| Reprocess lead-only submissions | Run `reprocessLeadOnlySubmissions` |
| Force-refresh field registry from GHL | Run `maintenanceForceRefreshRegistry` |
| Audit Dashboard for legacy-syntax tx rows | Run `auditTxItemSyntaxFlat` |
| Normalize legacy-syntax tx rows | Run `normalizeLegacyTxRows` |
| Force everything (except fee) back to owed | Run `setAllStatusesToOwed` |
| Full QA suite (90 assertions) | Run `runFullQA` |
| Full reset (data area + groups) | Run `leanReset` then `drainPolls` |

GHL tokens live in **Script Properties** under `GHL_TOKEN_FLORIDA`,
`GHL_TOKEN_GEORGIA`, `GHL_TOKEN_VIRGINIA`. They're long-lived Private Integration
Tokens — no refresh dance needed at the script level.

The 5-min trigger runs as the script owner's identity, so external requests use
that identity's OAuth grant — independent of which Google account is currently
viewing the sheet. This is what makes the auto-refresh work for everyone on the
team.
