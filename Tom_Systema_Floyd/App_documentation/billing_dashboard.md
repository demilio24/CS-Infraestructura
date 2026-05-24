# Systema Floyd, Billing Dashboard

How camp / after-school registrations become priced line items on a single
Google Sheet, how the team marks items paid, and how the system handles refunds
when a parent cancels.

> **Audience:** the operator (you), Erin (day-to-day operator), and any future
> engineer who needs to debug or extend the system. Read top to bottom on first
> pass; refer to specific sections later.
>
> **Relationship to other docs:** the [Registration System](./registration_system.md)
> writes rows into the camp roster sheets that this Billing Dashboard reads
> from. Anything in this doc that says "registration sheet" means one of those
> 4 (or N, for after-school) rosters. If the registration system stops writing
> rows correctly, the billing dashboard will reflect that drift on the next
> 5-min trigger.

---

## 1. Bird's-eye view

```
              ┌────────────────────────────────────────────────┐
              │  Registration sheets (source of truth)         │
              │  • 4 camp rosters (Free Up/Lo, Summer Up/Lo)   │
              │  • N after-school rosters (one per program)    │
              │  Owned by systemafloydsheets@gmail.com         │
              └─────────────────────┬──────────────────────────┘
                                    │ read every 5 min
                                    ▼
              ┌────────────────────────────────────────────────┐
              │  buildAllBilling()  in BillingFromSheets.js    │
              │  • Read Pricing tab catalog                    │
              │  • Walk every reg sheet → priced items         │
              │  • Apply inline tax + processing fee per item  │
              │  • Diff against current Dashboard:             │
              │      additions → new tx rows                   │
              │      deletions → status = canceled             │
              │                or = refund-needed (was paid)   │
              │      price changes → overwrite unit + total    │
              └─────────────────────┬──────────────────────────┘
                                    │ writes
                                    ▼
              ┌────────────────────────────────────────────────┐
              │  Billing Dashboard sheet (the operator's UI)   │
              │  • Dashboard tab, hierarchical view           │
              │  • Pricing tab, team-editable catalog         │
              │  • Logs tab, audit trail                      │
              └────────────────────────────────────────────────┘
                                    ▲
                                    │ writes audit row (paid)
                                    │ every 5 min if a $1 fee fires
              ┌─────────────────────┴──────────────────────────┐
              │  pollFloridaSubmissions()  in Polling.js       │
              │  Polls GHL Florida every 5 min for any         │
              │  submission carrying payment=$1 (the CC        │
              │  verification fee from the waiver form).       │
              │  Writes one paid $1 row only. Everything       │
              │  else now flows from the registration sheets.  │
              └────────────────────────────────────────────────┘
```

**Scope exclusion: free summer camp is never billed.** Registration sheets
classified `summer-free` (i.e., living under the `Free Summer Camp/` Drive
sub-folder) are filtered out by `bfsFilterBillable_` immediately after
discovery. Free campers don't owe anything by definition, so they never
appear on the billing dashboard even if their reg sheets happen to carry
opt-in fields the pricer could otherwise charge for. To change this, edit
the `BFS_NON_BILLABLE_TYPES` constant at the top of `BillingFromSheets.js`.

**Two independent triggers, both running as `emilio@nilsdigital.com`:**

| Trigger | Cadence | Function | What it owns |
|---|---|---|---|
| Sheet-driven billing | 5 min | `buildAllBilling` | Every line item except the $1 fee |
| GHL polling (legacy, fee-only) | 5 min | `pollFloridaSubmissions` | The $1 CC verification fee audit row |

Both hold a script-wide `LockService.getScriptLock()` for up to 2 minutes
before bailing, so a slow run can't be trampled by the next trigger.

---

## 2. The happy path (parent registers → line items appear → team marks paid)

1. Parent submits the Free Camp / Summer Camp form on `systemafloyd.com`.
2. GHL workflow writes a row into the right week's tab on the right roster
   sheet (or, if the workflow breaks, the discrepancy bot backfills it within
   15 min). See [Registration System doc](./registration_system.md).
3. Within 5 min, `buildAllBilling` fires. It:
   - Reads every registration sheet under
     `registration sheets/` Drive folder
     (`1ybmFvKPQV9YHeoxUfdcDpTdpjbUYpL2w`).
   - For each enrollment, generates one priced line item per item kind
     (tuition, lunch, breakfast, before/after care, t-shirt).
   - Applies the inline tax + processing fee per item (see §5).
   - Diffs against the current Dashboard tab and applies only the deltas.
4. New rows appear under the parent's existing customer header, or a new
   customer section is created at the bottom if it's a first-time parent.
5. Erin opens the Dashboard, sees the new owed items, processes payment
   externally (Stripe / Square / cash), then flips the row's status pill
   from `owed` → `paid`. The customer's balance cell (a SUMIFS formula
   filtered on `owed`) updates automatically.

When this works, no email goes out and no human intervention is needed past
flipping the status pill.

---

## 3. The cancellation / refund path (parent changes their mind)

If a parent deletes themselves from the registration sheet (or the team
removes a row on their behalf), the next 5-min reconciler picks it up:

- **Item was `owed`** → reconciler flips it to `canceled`. Balance drops
  automatically. Nothing further to do.
- **Item was `paid`** → reconciler flips it to `refund-needed`. This is the
  flag for the team: "you've collected money for something that's no longer
  on the roster, issue a refund." Once Tom processes the refund externally,
  he manually flips the cell from `refund-needed` → `refunded`.
- **Item was `refund-needed` or `refunded`** → reconciler does nothing.
  The refund flow is already in motion or done; the script doesn't loop
  back on a deletion it's already acted on.

This is the asymmetric semantics the team asked for: a deletion is always
acted on once, never overwritten by a later run, and `paid → refund-needed`
is the only transition that signals an actual obligation.

If the parent re-adds themselves (same email + student + week → same
fingerprint) before the reconciler has run, no transition happens, the
item stays where it was.

---

## 4. Components

### 4.1 The Billing Dashboard sheet

Single Google Sheet owned by `systemafloydsheets@gmail.com`. Shared with
`emilio@nilsdigital.com` as Editor.

**Tabs:**

| Tab | Purpose |
|---|---|
| `Dashboard` | The hierarchical view: customer headers + sub-headers + collapsible tx rows. The operator's UI. |
| `Pricing` | Team-editable catalog (auto-populated from GHL form fields on first setup, edited by hand thereafter). See §5. |
| `Logs` | Append-only audit trail. Every poll writes a row. Useful for debugging "what happened at 3pm?" |

The script considers the Dashboard tab authoritative; if a row is on the
Dashboard, its fingerprint (cell note on col B) and status pill (col G)
are preserved across rebuilds.

**Dashboard column layout (cols A-G):**

```
Customer header row:
  A: (blank)
  B: parent email
  C: phone (legacy, blank in sheet-driven flow)
  D: waiver origin link (legacy)
  E: comma-separated student names
  F: contact profile link (HYPERLINK to GHL contact, blank if no contact found)
  G: balance = =SUMIFS(F<txFirst>:F<txLast>, G<txFirst>:G<txLast>, "owed")

Sub-header row (mid-blue):
  A: "DATE"
  B: "ITEM"
  C: "UNIT PRICE (incl. tax + fee)"
  D: "DAYS"
  E: "WEEKS"
  F: "TOTAL"
  G: "STATUS"

Transaction row (one per priced line item):
  A: date stamp (yyyy-mm-dd, the day the item was added)
  B: =HYPERLINK("<source cell url>", "<student>, <label> (<week>)")
      with cell Note showing source sheet + week + row + link + fee breakdown
      + internal fingerprint
  C: unit price (already inflated with tax + fee)
  D: day count (e.g. "5" for a full-week tuition)
  E: week label (e.g. "July 27th-31st" or "March" or "Q2")
  F: total (unit × qty)
  G: status pill, one of `owed | paid | canceled | refund-needed | refunded | unpriced | ambiguous`
```

**Customer-header enrichment**, Parent Name (col A), Phone (col C), Waiver
Origin (col D), and the Contact Profile link (col F) all come from a one-shot
**GHL contact lookup** keyed by parent email. `bfsEnrichCustomer_(email)`
does one `POST /contacts/search` + one `GET /contacts/{id}` per unique
email and caches the result for the rest of the execution. At ~100 customers
that's ~200 UrlFetch calls per `nuclearResetBilling` run, well under the
Workspace 100K daily quota. The 5-min reconciler only enriches genuinely
new customers, so steady-state cost is near zero. If an enrichment fails
(transient GHL outage, no contact found, etc.) the four columns are left
empty; re-running `nuclearResetBilling` is the recover path.

Status pill values drive conditional formatting:

| Status | Color |
|---|---|
| `paid` | green background, bold |
| `owed` | yellow background |
| `canceled` | gray background |
| `refund-needed` | orange, bold |
| `refunded` | orange |
| `unpriced` | dark orange + whole row highlighted yellow |
| `ambiguous` | yellow + whole row highlighted yellow |

### 4.2 Apps Script project, Billing Dashboard

Script ID: `19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH`
Editor URL: <https://script.google.com/d/19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH/edit>

**Bound to** the Billing Dashboard Google Sheet (container-bound).

**OAuth scopes** (`appsscript.json`):
- `spreadsheets`, read/write the dashboard, pricing, logs tabs + all reg sheets
- `drive.readonly`, `DriveApp.getFolderById` for auto-discovery
- `script.external_request`, call GHL for the $1 fee polling path
- `script.scriptapp`, manage triggers
- `script.send_mail`, `notifyError` emails
- `script.container.ui`, the custom Maintenance / Bulk menus
- `userinfo.email`, surface `Session.getActiveUser()` in `debugQuotaState`

**Time zone:** `America/Chicago` (Tom is on Central; the team operates from
Florida but bills + accounting are Chicago-anchored).

**Files** (line counts give a rough sense of where the surface area lives):

| File | Lines | What it owns |
|---|---|---|
| `BillingFromSheets.js` | ~2830 | The entire sheet-driven pipeline: discovery, reading, pricing, reconciling, rendering. The big one. |
| `Polling.js` | ~1150 | GHL polling + the $1-fee-only writer (`processSubmissionVerificationFeeOnly`). Most of the old GHL-driven billing logic still lives here as a rollback artifact (`processSubmission`, no live caller). |
| `PricingGuide.js` | ~600 | `setupPricingSheet`, `migratePricingSheetAddAliases`, `prettifyPricingSheet`, bootstraps + maintains the Pricing tab. |
| `SheetWrites.js` | ~1260 | All Dashboard cell writes used by the legacy poll flow. Some helpers (`getDashboardSheet`) still used by `BillingFromSheets.js`. |
| `Configuration.js` | 83 | `SUBACCOUNTS`, `COL` column constants, `STUDENT_NAME_FIELD_IDS`, `getTokenFor`. |
| `Helpers.js` | 338 | Pure helpers (`parsePrice`, `extractMultiplier`, `parseMultiSelectValue`, etc.). |
| `Notifications.js` | 378 | `notifyError`, `dailyHealthCheck`. |
| `FieldRegistry.js` | 132 | Caches GHL `/locations/{id}/customFields` for the price-extraction step. |
| `Menu.js` | 397 | Maintenance + Bulk custom menus on the Billing Dashboard sheet. |
| `QA.js` | ~3170 | `runFullQA` self-test. Run after any change. |
| `Triggers.js` | 317 | `onEdit` handler (e.g. for Logs row 1 dropdown). |
| `Webhook.js` | 302 | Legacy `extractSubmissionFields`, used by polling. Webhook receiver was deleted. |
| `Code.js` | 106 | Tiny entry-point shims. |
| `Payments.js` | 151 | Legacy Stripe / payment helpers (mostly unused now). |
| `Transactions.js` | 647 | Legacy Transactions-sheet rebuilder. Currently gated behind `processedCount > 0`. |

**Script Properties:**
- `GHL_TOKEN_FLORIDA`, GHL access token for `8IWtNFlmgJ8bif9DivHT`
- `GHL_TOKEN_GEORGIA`, `ufcwXlTuemk8qbAZQPT6`
- `GHL_TOKEN_VIRGINIA`, `19PYgF6rAz20w4ZyLEGX`
- `lastPolledAt`, ISO timestamp of last poll (for the gap-fill window)
- `lastPollSummary`, JSON dump of the last poll's outcome

Tokens are externally rotated. If a poll starts erroring with HTTP 401,
rotate the token in Script Properties; do not commit it to the repo.

**Trigger inventory** (run from editor as `emilio@nilsdigital.com`):

| Trigger | Cadence | Function |
|---|---|---|
| Sheet-driven billing | every 5 min | `buildAllBilling` |
| GHL polling (fee-only) | every 5 min | `pollFloridaSubmissions` |
| Daily health check | once a day | `dailyHealthCheck` |

Triggers are owned by whoever installed them. Reinstall as emilio if they're
ever recreated, to keep the Workspace 100K UrlFetch quota.

### 4.3 GCP project, `systema-floyd-billing`

The Apps Script project's OAuth consent screen lives in this GCP project.
**Testing mode**, not verified. Practical consequence: only allowlisted test
users can authorize the script. Allowlist managed at
<https://console.cloud.google.com/apis/credentials/consent> (must be signed
in as `systemafloydsheets@gmail.com` to edit it).

Current test users:
- `systemafloydsheets@gmail.com`
- `emilio@nilsdigital.com`

Adding a new user (e.g. Erin) requires going there first; otherwise they
get a hard 403 "Access blocked: app not verified" on first manual run.

---

## 5. The Pricing tab and how items get priced

### 5.1 Pricing catalog structure

The `Pricing` tab in the Billing Dashboard sheet is a 6-column table:

```
Category | Item | Price | Multiplier | Source | Aliases
```

- **Category**, one of `Camp Duration`, `Lunch`, `Breakfast`, `Care`, `T-Shirt`,
  `After School Monthly`, `After School Quarterly`, `Other`. Banded by color
  in the sheet for visual scanning.
- **Item**, the clean item name (e.g. `Small`, `Lunchbox lunch ($10/day)`,
  `2 days`).
- **Price**, base price, before tax/fee inflation. **Just the number**, the
  script applies fees on read.
- **Multiplier**, `/day`, `/week`, or blank (one-time). Determines how the
  reader multiplies by `dayCount`.
- **Source**, the original GHL form-field option label the catalog row was
  derived from (e.g. `Small (+$30)`). Lookup uses this verbatim when the
  registration sheet copies the form text exactly.
- **Aliases**, comma-separated synonyms the team can append for fuzzy
  matching. Lookup is alias-aware: if the reg sheet says `lunchbox` and that
  appears in the Aliases column for `Lunchbox lunch ($10/day)`, it matches.

The Pricing tab is **auto-populated** by `setupPricingSheet()` on first run,
pulling priced options from every GHL form field with a price tag in its
option labels. After that, team edits win, the script will not overwrite
team-edited rows. Run `forceRebuildPricingSheet()` only when you want to
nuke the tab and re-pull from GHL.

### 5.2 Inline tax + processing fee

Every priced line item gets its **unit price inflated** before being written
to the Dashboard. No separate fee rows, the math is baked into each item.

| Item kind | Tax / fee applied | Total inflation |
|---|---|---|
| `shirt` | 7% sales tax + 3% processing fee | 10% |
| `tuition`, `lunch`, `breakfast`, `care`, after-school | 3% processing fee | 3% |
| `unpriced` or `$0` items | none | 0% |

The breakdown lives in the cell Note on col B:

```
Source: Upper Campus, July 27th-31st, row 14
Link: https://docs.google.com/.../edit#gid=...&range=H14

Pricing: Base unit $30.00 includes 7% sales tax plus 3% processing fee = all-in $33.00 per unit.

(Internal ref: parent.email|jane-doe|july-27th-31st|shirt|small)
```

The internal-ref line at the bottom is the **fingerprint**, the script
uses it to track this row across rebuilds. Don't edit it by hand.

### 5.3 Pricing rates, single source of truth

Both rates are defined as JavaScript constants at the top of
`BillingFromSheets.js`:

```javascript
const SHIRT_SALES_TAX_RATE   = 0.07;
const PAYMENT_PROCESSING_FEE = 0.03;
```

If they change, edit the constants, `clasp push`, then run
`nuclearResetBilling` once to recompute every existing item's inflated
unit price. Otherwise old items keep their old inflated price; only new
items get the new rate (since the inflation is applied at write time, not
read time).

### 5.4 Item kinds the pricer recognizes

`priceEnrollment_` (in `BillingFromSheets.js`) walks each enrollment and
generates up to 5 line items:

1. **Tuition** (`kind: 'tuition'`), paid camps only, FREE camps skip. One
   per (student, week). Multiplier `/week`, qty=1, so total = base price.
   Catalog lookup is by Category=`Camp Duration` + Item=`{N} days`.
2. **Lunch** (`kind: 'lunch'`), if the lunch cell is non-blank and not a
   Yes/No marker. Quantity = `dayCount` if multiplier is `/day`, else 1.
3. **Breakfast** (`kind: 'breakfast'`), same logic as lunch.
4. **Care** (`kind: 'care'`), same logic. Before-care, after-care, or both.
5. **T-shirt** (`kind: 'shirt'`), **one-time per student**, not per week.
   The fingerprint omits the week and the orchestrator dedupes across all
   sheets so a student registered for 5 weeks gets exactly 1 shirt charge.

**After-school** enrollments route through `priceAfterSchoolEnrollment_`,
which has a different shape, no per-day attendance, no lunch/breakfast/care,
just monthly or quarterly tuition per program. The catalog rows live under
Category `After School Monthly` / `After School Quarterly`.

### 5.5 Yes/No skip rule

FREE camp registration sheets use `"Yes"` / `"No"` markers in Lunch and
Breakfast columns to mean "kid wants the free meal", these are participation
indicators, not priced line items. `isBfsYesNoMarker_` recognizes
`Yes / Y / No / N / True / False / ✓ / ✔ / x` (case-insensitive) and skips
those cells entirely. Neither a priced nor an unpriced row is generated.

If you ever change a real lunch option to be called literally `"Yes Special"`,
that's fine, the regex requires the marker word to be the whole cell.

### 5.6 Unpriced + ambiguous flags

A line item gets one of these flags when pricing fails to resolve cleanly:

- **`unpriced`**, no catalog row matches the cell value at all. The item
  is still written to the Dashboard (so the team sees it), with `(unpriced)`
  prefix on the label and unit price = $0. Whole row highlighted yellow.
- **`ambiguous`**, more than one catalog row matches the same cell value at
  the same lookup priority stage. Same treatment as unpriced.

Both are recoverable by the team: open the cell Note's Link to jump to the
source cell in the reg sheet, fix the typo or add a catalog row, then wait
for the next 5-min trigger.

---

## 6. The reconciliation decision tree (per fingerprint, every 5 min)

```
1. Read current Dashboard state, map every existing tx row by fingerprint.
2. Build fresh items from registration sheets, map by fingerprint.
3. For each existing fingerprint NOT in fresh (CANCELLATION):
     • Legacy tax/fee row format?  → delete the row outright (architectural debris).
     • status was 'paid'?          → flip to 'refund-needed'. NEVER overwrite.
     • status was 'refund-needed' or 'refunded'? → no-op (already in refund flow).
     • status was 'canceled'?      → no-op.
     • else                        → flip to 'canceled'.

4. For each fresh fingerprint:
     • Already exists?
         - unit price or total differs by >$0.005? → write the new values,
           rewrite the Item cell's HYPERLINK formula, refresh the cell Note.
         - otherwise → no-op.
     • Brand new?
         - bucket by parent email → either append under existing customer
           or create a new customer section at the bottom of the sheet.

5. Re-render balance Notes on every customer touched (status, price, or
   new-item changes). Notes list ONLY their items, no em-dashes.

6. Source-note refresh sweep: walk every tx row, recompute the
   bfsBuildItemNote_ output from the matched fresh item, and rewrite
   the col B cell note if it differs. Runs in a single batch
   setNotes call so cost is flat regardless of row count.
   Fixes the staleness problem where "Source: <sheet>, row N"
   references go wrong after a teammate inserts/deletes rows in
   a reg sheet.

7. Run sanitizeDashboardCustomerHeaders + fixDashboardGroups (idempotent
   post-reconcile cleanup).
```

**Fingerprint format gotcha (fixed 2026-05-14):** fingerprints live in the
col B cell note as `(Internal ref: <fp>)`, and the readDashboardState_ regex
must capture them up to the closing paren, not stop at whitespace. An
earlier `[^)\s]+` regex would truncate multi-word fingerprints (e.g.
tuition `"...|tuition|3 days"` got read back as `"...|tuition|3"`),
making the reconciler think those fingerprints were "missing from fresh"
and mass-cancel them every tick. The current regex is `([^)]+)\)` plus
a `.trim()`, and `priceEnrollment_` also slugs the tuitionKey now so the
written fingerprints don't carry whitespace in the first place.

The diff approach is way faster than rebuilding from scratch every 5 min, and
it correctly produces the `paid → refund-needed` transition the team needs.

`nuclearResetBilling` exists as the override: wipes the whole data area
and re-renders from scratch in batch (~134s for 108 customers / 490 tx rows
at the time of writing). Use it when the Dashboard's gotten visibly out of
sync (duplicate rows, wrong groupings, partial state after a cancelled run).
Holds the same script lock as `buildAllBilling`.

---

## 7. Status pill lifecycle

The 7 status values, in roughly the order they're encountered:

```
        ┌──────────────────────────────────────────────────────────┐
        │                                                          │
        ▼                                                          │
   ┌─────────┐  team flips     ┌──────┐  reg deleted   ┌─────────────┐
   │  owed   ├────────────────►│ paid ├───────────────►│refund-needed│
   └────┬────┘   manually      └──┬───┘                 └──────┬──────┘
        │                          │                           │
        │ reg deleted              │ reg deleted               │ team flips
        ▼                          ▼ (no-op, stays paid)       │ manually
   ┌──────────┐                                                ▼
   │ canceled │                                          ┌──────────┐
   └──────────┘                                          │ refunded │
                                                         └──────────┘

   ┌──────────┐    ┌───────────┐
   │ unpriced │    │ ambiguous │    ← pricer-assigned; auto-clear when
   └──────────┘    └───────────┘      catalog/registration is fixed
```

Manual transitions Erin / Tom make (via the col G dropdown):
- `owed` → `paid` (after collecting payment)
- `refund-needed` → `refunded` (after issuing the refund)

Automatic transitions the reconciler makes:
- New fingerprint → `owed`
- Fresh fingerprint with no catalog match → `unpriced`
- Fresh fingerprint matching multiple catalog rows → `ambiguous`
- Fingerprint disappears + status was `owed` → `canceled`
- Fingerprint disappears + status was `paid` → `refund-needed`

---

## 8. Cell notes (the "where did this row come from?" badge)

Every tx row has a cell Note on **col B** (the Item cell). Hover the cell
in Sheets to see it. Format:

```
Source: Upper Campus, July 27th-31st, row 14
Link: https://docs.google.com/spreadsheets/d/.../edit#gid=...&range=H14

Pricing: Base unit $30.00 includes 7% sales tax plus 3% processing fee = all-in $33.00 per unit.

(Internal ref: jane.doe-gmail.com|j-doe|july-27th-31st|shirt|small)
```

- **Source**, which registration sheet, which week tab, which row.
- **Link**, clickable URL into the source cell. Opens the right tab + row +
  column so the team can fix typos without hunting.
- **Pricing**, the inflation breakdown (only on priced items; missing on
  `$0` / unpriced items).
- **Internal ref**, the fingerprint. Used by the reconciler to track this
  row across rebuilds. **Don't edit by hand**, if it changes, the next
  rebuild creates a duplicate.

A row **without a cell Note on col B** means it predates this convention or
was created via the `$1` fee path. Reconciler treats fingerprint-less rows
as untracked and leaves them alone.

The customer-row Balance cell (col G) also carries a Note listing every owed
item for that customer (built by `buildBalanceNote_`). No em-dashes, no
cross-customer info, just that one customer's owed items, line by line,
totalled at the bottom.

---

## 9. Operations

### 9.1 Functions you can call manually from the editor

Public functions (no trailing underscore) appear in the editor dropdown:

| Function | What it does |
|---|---|
| `buildAllBilling()` | The 5-min trigger entry point. Diffs and applies. Idempotent. |
| `nuclearResetBilling()` | Wipes the Dashboard data area and rebuilds from scratch. Use after structural drift. Lock-protected against concurrent runs. |
| `fixDashboardGroups()` | Rebuild the customer-level row groups (the +/- toggles) from scratch. Useful if grouping looks broken without doing a full rebuild. |
| `fixDashboardStatusValidation()` | Surgical: clears the status-dropdown data validation from customer header + sub-header rows (where a SUMIFS balance or the literal "STATUS" text triggers a red "Invalid" warning) and re-applies it on tx rows only. ~5-10s. Run after upgrading from an older nuclearResetBilling that applied the rule too broadly. Idempotent. |
| `sanitizeDashboardCustomerHeaders()` | Wipe placeholder text from customer headers ("(not found in unknown)" etc) and strip em-dashes from balance cell Notes. |
| `installBillingFromSheetsTrigger()` | (Re)create the 5-min trigger on `buildAllBilling`. Deletes any prior trigger on the same function first. |
| `setupPricingSheet()` | First-time bootstrap of the Pricing tab. Pulls every priced option from GHL form fields. |
| `migratePricingSheetAddAliases()` | One-shot: add the Aliases column with auto-derived synonyms. |
| `prettifyPricingSheet()` | Cosmetic: banded sections, color groups, frozen header. |
| `forceRebuildPricingSheet()` | Nuke the Pricing tab and re-extract from GHL. **Destroys team-edited rows.** Confirm before running. |
| `deleteBillingFlatTab()` | One-shot cleanup: remove the deprecated `Billing` tab if it's still hanging around. |
| `deleteManualImportsTab()` | One-shot cleanup: remove the deprecated `Manual Imports` tab. |
| `deleteBillingTabsFromRegistrationSheets()` | One-shot: remove the per-sheet `Billing` tabs that an earlier iteration wrote. |
| `installPollingTrigger()` | (Re)install the 5-min `pollFloridaSubmissions` trigger. |
| `installDailyHealthCheckTrigger()` | (Re)install the daily `dailyHealthCheck` trigger. |
| `debugQuotaState()` | Dump effective user, all visible triggers, `lastPolledAt`, `lastPollSummary`, last 8 Logs rows. Run as the user whose quota you're investigating. |
| `runFullQA()` | The full self-test suite. Run after every change before declaring done. |

### 9.2 Maintenance + Bulk custom menus

On open, the Billing Dashboard sheet exposes two custom menus (defined in
`Menu.js`):

**Maintenance:**
- Re-sort by email
- Show debug log

**Bulk (for the selected customer's rows):**
- Set all → paid
- Set all → owed
- Set all → canceled
- Set all → refunded

These are convenience wrappers for marking multiple rows at once. They don't
bypass the reconciler, the next 5-min run will respect the new status pills
because of the `paid → refund-needed` no-op rule.

### 9.3 Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| `Service invoked too many times for one day: urlfetch` | $1-fee polling running unconditional Transactions sync, or trigger moved off Workspace account | Verify `processedCount > 0` gate around `syncTransactionsSheet`; verify triggers run as `emilio@nilsdigital.com` |
| `[discoverRegistrationSheets_] failed: You do not have permission to call DriveApp.getFolderById` | The running account lacks `drive.readonly` scope (script never re-authorized after the scope was added) | Run any function manually from the editor as that account to trigger re-auth; or just let the fallback list take over (the 4 hardcoded summer-camp sheets cover 99% of volume) |
| Dashboard shows duplicate customers or duplicate tx rows | Fingerprint drift after a code change to the fingerprint format | Run `nuclearResetBilling` to wipe and rebuild with the current fingerprint format |
| Dashboard shows `(unpriced)` rows the team can't clear | Reg cell text doesn't match any Pricing row's Item or Source; no Alias added | Click the cell Note's Link, see what the reg sheet actually says, then either fix the typo there or add an alias in the Pricing tab |
| `+/-` toggle next to customer doesn't work | Row groups went nested across multiple reconciler runs | Run `fixDashboardGroups` (or `nuclearResetBilling` for a full reset). If `fixDashboardGroups` itself silently fails on certain customers (the API throws on some adjacent-group invariants), the catch blocks log to the Logs sheet as of `e2a395e9` (2026-05-23) — check there for `[fixDashboardGroups_] err for <email>: ...`. |
| Some kids labeled under the wrong week (e.g. Cyrus registered for 6/15-6/19 but billed under June 22nd-26th) | (Fixed `e2a395e9` 2026-05-23.) `readRegistrationEnrollments_` used to iterate source-sheet tabs by POSITION, so a non-week tab anywhere before the weekly tabs shifted every downstream week label by +1. | Pull latest; `bfsResolveWeek_` now matches tabs by NAME. Run `nuclearResetBilling` once to flush stale wrong-week rows. |
| Customer's Name or Phone keeps reverting to the GHL value after I manually fix it | (Fixed `04bb2d02` 2026-05-23.) `upsertCustomerRow` used to overwrite Name + Phone unconditionally on every poll. | Pull latest; Name only overwrites if existing is empty OR matches email's local part (placeholder); Phone only overwrites if empty. To force a re-pull from GHL, run `nuclearResetBilling` (its `bfsCustomerHeaderTuple_` path always uses fresh enrichment). |
| Customer's "View profile" link disappeared, now shows "(not found in Florida)" plain text | (Fixed `04bb2d02` 2026-05-23.) `upsertCustomerRow` used to clobber existing HYPERLINK formulas when called with `profileUrl: null`. | Pull latest; the patch checks col F's existing formula before overwriting. To repair already-damaged rows, call `restoreLostProfileLinks` via the remote-trigger webapp (see §9.5). |
| Total balance at top of dashboard is wrong by a lot | Stale customer balance formulas pointing to wrong row ranges (usually after a manual row insert/delete) | Run `nuclearResetBilling` |
| Two concurrent `nuclearResetBilling` runs corrupt the sheet | (Fixed 2026-05-14.) Older versions didn't hold the script lock. | Pull latest from `clasp push`; current version logs "could not acquire lock after 2 min, Skipping" instead of stomping. |
| `$1` rows missing or duplicated | GHL token expired, or dedup state lost | Check `GHL_TOKEN_FLORIDA`; run `replayAllSubmissions` to re-scan a window |
| Email alerts stopped arriving | `notifyError` is throttled to 1/hour per `(severity, subject)` pair | Check the Logs sheet for `poll_error` rows; not a bug |

### 9.4 Pulling a sample sheet for debugging

```bash
# In an Apps Script editor scratch function, paste:
function dumpFirstWeekTab() {
  var ss = SpreadsheetApp.openById('1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA');
  var tab = ss.getSheetByName('6/1-6/5');  // NB: short form!
  Logger.log(JSON.stringify(tab.getDataRange().getValues().slice(0, 3)));
}
```

Reg sheets use **short-form** tab names (`6/1-6/5`), not `WEEK_ORDER` long
form. This is also true for the discrepancy bot; see
[Registration System §4.3](./registration_system.md#43-google-sheets--the-rosters).

### 9.5 Remote-trigger webapp + RPCs

The billing Apps Script project deploys a single web app (`doGet` in
[RemoteTrigger.js](../Billing%20dashboard/apps-script/RemoteTrigger.js))
that lets you invoke whitelisted functions from outside the editor — your
laptop, a cron job, another script — without needing to be signed in as
the script owner. Useful for ad-hoc maintenance and audits.

**Auth model:** every request must pass `?token=<value>` matching the
`REMOTE_TRIGGER_TOKEN` Script Property. The webapp itself runs as the
script owner (`systemafloydsheets@gmail.com`) so it has all the right
permissions to read/write the bound sheet + the 4 source registration
sheets + GHL via the cached OAuth tokens.

**Invocation modes:**
- `&sync=1` — runs the function inside the request, returns the result. Subject to Apps Script's 6-minute web-request cap. Use for fast functions or anything where you need the result immediately.
- `&sync=0` (default) — schedules a one-time trigger ~10s in the future. Returns immediately. Trigger auto-deletes after firing. Use for long-running functions (`nuclearResetBilling`, etc).
- `?list=1` — return the whitelist + descriptions, no `fn=` needed.

**Example:**
```bash
. .env  # provides SF_BILLING_REMOTE_TRIGGER_URL + _TOKEN
curl -sL "${SF_BILLING_REMOTE_TRIGGER_URL}?token=${SF_BILLING_REMOTE_TRIGGER_TOKEN}&fn=remoteTriggerStatus&sync=1"
```

Adding a new RPC requires three edits to RemoteTrigger.js:
1. Add the function to `REMOTE_TRIGGER_WHITELIST` with a short description.
2. Add a `case 'fnName': return fnName(params);` to `_rtDispatch_`.
3. The function itself can live in any source file (it's resolved by name at dispatch time).

**Whitelisted RPCs as of `bc835b61` (2026-05-23):**

| RPC | Description | Typical use |
|---|---|---|
| `nuclearResetBilling` | Full Dashboard wipe + rebuild from registration sheets. ~3 min. | After a structural code change (fingerprint format, week resolution, etc) to flush stale rows in one clean pass instead of waiting for incremental reconciler. Use `&sync=0`. |
| `buildAllBilling` | 5-min reconciler entry point. Diff-based. | Trigger an early reconcile after manually editing the Manual Items tab. |
| `pollFloridaSubmissions` | $1 CC verification fee poll (legacy path). | Manual one-off after a token rotation. |
| `fixDashboardGroups` | Rebuild +/- row groups per customer. | When customers' collapsible outlines vanish on the Dashboard. |
| `restoreLostProfileLinks` | Walk customer headers, re-search GHL Florida for any with empty col F or `(not found in...)` plain text, write fresh HYPERLINK. Idempotent. | After any event that wipes profile links (e.g. an old `upsertCustomerRow` poll cycle pre-`04bb2d02`). |
| `testUpsertPreservation` | Regression check: call `upsertCustomerRow` against a known customer with stub GHL-style payload, verify Name/Phone are preserved per the `04bb2d02` patch. Pass `&email=<addr>`. | Before/after modifying anything in `upsertCustomerRow`. |
| `cleanupDoubleShirtSuffix` | Strip duplicated `(+$X)` suffixes from any col-B label (`Small (+$30) (+$30)` → `Small (+$30)`). Idempotent. Pass `&dryRun=1` to scan only. | If a future legacy importer ever reintroduces the bug; tested cleanly returns 0 on a healthy dashboard. |
| `cleanupExtraNuclearTriggers` | Delete duplicate `nuclearResetBilling` time-based triggers, keeping one. Idempotent. | When `remoteTriggerStatus` shows the same handler scheduled multiple times (typical cause: manual "install" clicks in the editor without first deleting). |
| `listAllCustomerEmails` | Return the sorted list of every unique parent email rendered on the Dashboard tab (customer-header rows only — tx rows excluded via HYPERLINK-formula detection). Use `&sync=1`. | Diffing snapshot.json vs billing to triage "missing customer" reports — see triage rule at the top of [billingdashboardbugs.md](../billingdashboardbugs.md). |
| `traceCustomer` | Return one customer's tx rows + col B Notes with source provenance. Pass `&email=<addr>`. | Investigating a specific customer (wrong week label, missing rows, etc). |
| `dashboardStats` | Aggregate counts: unique customers, students, tx rows, by status. | Quick health check. |
| `registrationStats` | Per-source-sheet counts: enrollments, unique students/parents, `dayZeroEnrollments` (phantom-skipped). | Diagnosing why parents are or aren't showing up on billing. |
| `remoteTriggerStatus` | Trigger inventory + last-poll timestamp + last-poll summary. | Health check; spot duplicate triggers; confirm last successful poll. |
| `tailLogs` | Last N rows of the Logs sheet. Pass `&n=<rows>` (default 20). | Investigate after an error report. |
| `sanitizeDashboardCustomerHeaders` | Strip `(not found in unknown)` placeholders + em-dashes from customer header cells. Idempotent. | Cleanup pass. |
| `addManualItem` | Append a row to the hidden Manual Items source tab. Same shape as the AddManualItem.html dialog. | Programmatic charges (refunds, credits, late fees). See whitelist comment for param shape. |
| `setupManualItemsTab` | Bootstrap the hidden Manual Items source tab. Idempotent. | First-time setup or after accidental deletion. |
| `setupPricingSheet` / `migratePricingSheetAddAliases` / `prettifyPricingSheet` | Pricing tab bootstrap + structure migrations. | First-time setup; column-add migration. |
| `installBillingFromSheetsTrigger` / `installPollingTrigger` / `installDailyHealthCheckTrigger` / `installDailyDashboardSelfHealTrigger` | (Re)install scheduled triggers. Each deletes prior triggers on the same handler first (idempotent). | Trigger restoration after editor mishaps. |
| `dailyDashboardSelfHeal` | The 3 AM self-heal: audit for ungrouped customers / malformed headers / `#REF!` balance errors → conditionally fire `nuclearResetBilling`. | Manual invocation if you suspect drift between cron windows. |
| `installFormSheetQuickLinks` | Idempotent: write Dashboard header row K-O HYPERLINK chips for the 4 form-sheet quick links. | Cosmetic restoration. |
| `removeItemUnderlines` | Strip default blue underline from Item / Profile HYPERLINK cells. Cosmetic. | Cosmetic restoration. |
| `dumpRegRow` | Return one row's raw cells from a registration sheet. Pass `&sheetId=<id>&tabName=<short-tab>&row=<N>`. | Verify what's actually in the source for a debugging session. |
| `traceAllFreeCampSources` | Scan every tx row's col B Note, return ones mentioning FREE Upper / FREE Lower. | Used during the FREE camp exclusion audit. |
| `listShirtOnlyCustomers` | Return every customer whose ONLY tx items are shirts (no tuition/lunch/breakfast/care). | Triage edge case. |
| `sampleCanceledRows` | First N (default 10) canceled tx rows with their col B source Notes. Pass `&n=<count>`. | Investigate why rows ended up canceled. |
| `fixDashboardStatusValidation` | Re-scope the status dropdown to tx rows only. ~5-10s. | After upgrading from an older `nuclearResetBilling` that applied the rule too broadly. |
| `debugQuotaState` | Dump effective user + visible triggers + last-poll info. | Diagnose UrlFetch quota issues. |

Token + URL live in `.env` at the repo root (gitignored). To rotate: regenerate
the `REMOTE_TRIGGER_TOKEN` Script Property in the editor and update `.env`; the
URL only changes if someone creates a NEW deployment instead of bumping the
existing one in-place (so use the pencil-icon "edit" flow in Deploy → Manage
Deployments, never the "New deployment" button).

**Deployment versioning:** the webapp is pinned to a specific code version,
not HEAD. `clasp push -f` updates HEAD, but the webapp continues running the
old version until you bump the deployment. To pick up a code change in the
webapp: clasp push, then in the editor (signed in as
`systemafloydsheets@gmail.com`) → Deploy → Manage Deployments → pencil-edit
the production deployment → Version: "New version" → Deploy. URL stays the
same; version increments. Triggers (time-based crons) DO pick up @HEAD code
automatically without a deployment bump — only the webapp invocation needs
the bump.

---

## 10. Recovery

| Disaster | Recovery |
|---|---|
| Dashboard data area accidentally wiped | The fingerprints are gone, so paid pills are lost. Run `nuclearResetBilling` to rebuild from registration sheets, then re-flip paid rows by hand from your records (or from Stripe history). |
| Pricing tab corrupted | Run `forceRebuildPricingSheet()`, re-pulls every priced option from GHL fields. **Loses team-edited aliases.** If aliases were valuable, restore via Sheets → File → Version history. |
| Trigger not firing | Check the editor's Triggers panel as `emilio@nilsdigital.com`. Re-run `installBillingFromSheetsTrigger()` to recreate. |
| Whole script project deleted | Code lives in `Tom_Systema_Floyd/Billing dashboard/apps-script/`. Re-clone via `clasp clone <SCRIPT_ID>`, then `clasp push -f`. |
| GHL token rotated and not updated in Script Properties | Polls error out with HTTP 401. Update `GHL_TOKEN_FLORIDA` (or GA/VA) in Project Settings → Script Properties. |
| Drive folder restructured / sheet moved out | Auto-discovery may miss the moved sheet. Either re-share with `emilio@nilsdigital.com` under the right parent folder, or add a fresh entry to `FALLBACK_REGISTRATION_SHEETS` for the new location. |
| Reg sheet column reordered or renamed | Billing's `readRegistrationEnrollments_` reads by header name (not position), but its set of recognized headers is fixed. If you add a "Lunch v2" column, billing won't know to look there. Add the header to the `bfsCol_(...)` candidate list in `readRegistrationEnrollments_`. |
| Reg sheet tab reordered or non-week tab added | Since `e2a395e9` (2026-05-23) tabs are resolved by NAME via `bfsResolveWeek_` (`6/15-6/19` → "June 15th-19th"), so reordering is safe. Tabs whose names don't parse as a week (Notes, Lookup, blank) are skipped. If you add a NEW weekly tab name format (e.g. `Week 1` instead of `6/1-6/5`), extend `bfsWeekKey_` to recognize it. |

---

## 11. Extending the system

### 11.1 Adding a new item kind (e.g. equipment, late fee)

1. Add a row to the `Pricing` tab under a new or existing Category (e.g.
   `Equipment`). Fill Price + Multiplier + Source.
2. If you want the reg sheets to drive it: identify which column in which
   reg sheets carries the value (e.g. `Equipment` column).
3. Add an item generator in `priceEnrollment_` next to the existing kinds
   (tuition / lunch / breakfast / care / shirt). Pattern:

   ```javascript
   if (e.cells.equipment && !/^none$/i.test(e.cells.equipment) && !isBfsYesNoMarker_(e.cells.equipment)) {
     var p = lookupPrice_(e.cells.equipment, catalog, 'equipment');
     if (p) {
       items.push({
         kind: 'equipment',
         label: 'Equipment: ' + p.item,
         price: p.price, multiplier: p.multiplier, qty: 1,
         total: p.price,
         unpriced: false,
         source: e.cells.equipment,
         linkToSource: e.cellLinks ? e.cellLinks.equipment : '',
         fingerprint: fpBase + '|equipment|' + bfsSlug_(p.item)
       });
     }
   }
   ```
4. Update `readRegistrationEnrollments_` to read the equipment column and
   stash it on `e.cells.equipment` (and `e.cellLinks.equipment`).
5. If the equipment is taxable, update `applyInlineFees_` to apply the right
   rate (e.g. add an `equipment-tax` rate). Otherwise it just gets the 3%
   processing fee like everything else.
6. Run `nuclearResetBilling` once to re-render everyone's items with the new
   kind.

### 11.2 Adding a new registration sheet folder

The auto-discovery `discoverRegistrationSheets_` walks the entire tree under
`REGISTRATION_ROOT_FOLDER_ID`. If you add a new sub-folder like
`After School/Spring 2027/`, you also need to teach `bfsClassifySheet_`
to route it:

```javascript
// In BillingFromSheets.js, bfsClassifySheet_:
if (/free summer camp/i.test(folderPath)) return 'summer-free';
if (/summer camp/i.test(folderPath))      return 'summer-paid';
if (/after school/i.test(folderPath))     return 'after-school';
// Add your new type here, e.g.:
if (/winter camp/i.test(folderPath))      return 'winter-paid';
return null;  // skipped
```

Then add a reader function (e.g. `readWinterCampEnrollments_`) and route to
it from `buildAllBilling`'s `(reg.type === '...')` dispatch.

### 11.3 Adding a new GHL location (Georgia, Virginia)

The `Configuration.js` `SUBACCOUNTS` map already includes GA and VA. To
enable them in polling:

1. Set `GHL_TOKEN_GEORGIA` / `GHL_TOKEN_VIRGINIA` in Script Properties.
2. Copy the `pollFloridaSubmissions` pattern in `Polling.js` into
   `pollGeorgiaSubmissions` / `pollVirginiaSubmissions`. (They exist
   already as stubs.)
3. Install separate 5-min triggers for each one. Stagger their start times
   (e.g. emilio runs FL at :00/:05, GA at :01/:06, VA at :02/:07) to avoid
   simultaneous Workspace UrlFetch bursts.
4. If they share the same Billing Dashboard sheet, the sheet-driven pipeline
   is location-agnostic, reg sheets are reg sheets, regardless of which
   GHL location seeded them.

---

## 12. Reference: Constants in the codebase

`BillingFromSheets.js` top of file:
- `REGISTRATION_ROOT_FOLDER_ID = '1ybmFvKPQV9YHeoxUfdcDpTdpjbUYpL2w'`, Drive root for reg-sheet discovery
- `SHIRT_SALES_TAX_RATE = 0.07`, 7% sales tax inflated into shirt unit prices
- `PAYMENT_PROCESSING_FEE = 0.03`, 3% processing fee inflated into all priced items
- `STATUS_VALUES = ['owed', 'paid', 'canceled', 'refund-needed', 'refunded', 'unpriced', 'ambiguous']`, the col G dropdown
- `FALLBACK_REGISTRATION_SHEETS`, 4 hardcoded summer-camp sheet IDs used when Drive discovery fails
- `BFS_WEEK_ORDER`, 12-week summer camp chronological order
- `BFS_WEEK_KEY_MAP`, derived lookup `(month-day key) → canonical week label`, populated at script-load from `BFS_WEEK_ORDER` via `bfsWeekKey_`
- `BFS_NON_BILLABLE_TYPES = ['summer-free']`, sheet types filtered out of billing — FREE camp parents register but aren't billed (no priced line items even if their reg sheet has opt-in fields)
- `BILLING_TAB_NAME = 'Billing'`, name of the (deprecated) per-sheet billing tab
- `UNPRICED_TAG = '(unpriced)'`, prefix on unpriced item labels
- `AFTER_SCHOOL_MONTH_COLUMNS`, Jan..Dec month names used by after-school readers
- `AFTER_SCHOOL_QUARTER_COLUMNS = ['Q1', 'Q2', 'Q3', 'Q4']`

`Configuration.js`:
- `SUBACCOUNTS`, Florida / Georgia / Virginia with locationId + tokenKey
- `DEFAULT_SUBACCOUNT = 'Florida'`
- `GHL_API_BASE = 'https://services.leadconnectorhq.com'`
- `GHL_API_VERSION = '2021-07-28'`
- `SHEET_NAME = 'Dashboard'`, the canonical tab name
- `COL.*`, column constants (`NAME_OR_DATE=1`, `EMAIL_OR_ITEM=2`, ...)
- `STUDENT_NAME_FIELD_IDS`, priority-ordered list of GHL custom-field IDs
  the script tries when extracting a student name from a submission

`PricingGuide.js`:
- `PRICING_SHEET_NAME = 'Pricing'`
- `LOGS_SHEET_NAME = 'Logs'`

When something needs to change, look here first.

---

## 13. Related memory notes (for future Claude/AI sessions)

- `project_ghl_script_deployment.md`, GHL script deployment uses commit-pinned
  jsDelivr URLs; purge cache after each push.
- `feedback_ghl_verify_location_first.md`, always cross-check `.env`'s
  `GHL_LOCATION_ID` against Supabase `ghl_tokens` or `Configuration.js` before
  writing.
- `feedback_no_emdashes.md`, never use em-dashes in copy or cell notes; use
  commas.
- `feedback_ghl_cloudflare_ua.md`, direct GHL API calls from Python need a
  browser User-Agent.
- `reference_systema_floyd_supabase_ghl_token.md`, fetching the Florida GHL
  access token from Supabase via the `get_systema_floyd_florida_token` RPC.
- `reference_systema_floyd_discrepancy_checker.md`, the 15-min failsafe that
  keeps the registration sheets this billing dashboard reads from accurate.
- `project_systema_floyd_sheet_tab_names.md`, reg sheet tabs use short form
  (`6/1-6/5`), not WEEK_ORDER long form. Affects both the discrepancy bot and
  any direct `getSheetByName` calls in billing code.
