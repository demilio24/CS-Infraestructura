# Systema Floyd Billing Dashboard — Development Plan (v4)

> A single Google Sheet with one row per customer. Each customer's transactions are nested in a collapsible group beneath them with a sub-header that labels the columns. Balance is a clickable hyperlink that opens the right GHL subaccount profile. Status is a dropdown pill. Every Total is a visible formula showing exactly how it was calculated.

**Owner:** Tom Floyd (Systema Floyd Martial Arts)
**Day-to-day operator:** Erin
**Built by:** Claude Chrome extension (using the prompt in this document)
**Target ship:** Phase 1 in ~1 week of build + setup

---

## Architecture decisions (final)

| Decision | Choice |
|---|---|
| **Sheet count** | One sheet, "Dashboard" |
| **Row types** | customer / sub_header / tx — distinguished by content, no row_type column |
| **Hidden columns** | None |
| **Layout** | Everything left-aligns to col A |
| **Customer cols (A–E)** | Name, Email, Phone, Waiver Origin, Balance |
| **Sub-header + Tx cols (A–G)** | Date, Item, Unit Price, Days, Weeks, Total, Status |
| **Balance cell** | HYPERLINK formula opening the right GHL subaccount profile, displaying the dollar amount, with red/white/blue background |
| **Total cell** | Visible formula like `=285*3`, `=7.75*3*3`, `=25` |
| **Status cell** | Dropdown pills: 🟢 paid, 🟠 owed, ⚪ canceled, 🔵 refunded |
| **Balance math** | Apps Script writes a SUMIFS formula per customer with hard-coded row ranges; Apps Script extends ranges when transactions are added |
| **Identity key** | Email (lowercase, trimmed) |
| **Paid/owed status** | Manual — Erin clicks the pill and picks |
| **Cancellations/refunds** | Status flip to `canceled` or `refunded` (excluded from balance) |
| **Pricing convention** | `$N` flat / `$N/day` (× days × weeks) / `$N/week` (× weeks) |
| **Multi-state routing** | Waiver Origin → FL/GA/VA subaccount; default Florida if empty |
| **Webhook payload** | Use the per-submission block only (Defense A) — not the full contact state |
| **Dedupe** | None — trust Defense A |
| **Default group state** | Collapsed if balance = 0, expanded if balance > 0 |

---

## The mental model in one sentence

**Erin opens one Google Sheet. She sees one row per customer with their balance highlighted. She clicks the balance to open that customer's GHL profile and charge their card. To see what they owe for, she expands the row group and reads the line items. To mark something paid, she clicks the status pill and picks "paid." That's the whole tool.**

---

## The three subaccounts

| State | Location ID | Private Integration Token |
|---|---|---|
| Florida (default) | `8IWtNFlmgJ8bif9DivHT` | `pit-ba33c398-1647-41c9-9024-98f203d6b30c` |
| Georgia | `ufcwXlTuemk8qbAZQPT6` | `pit-3896bf36-9322-43e0-bbfb-61120444008a` |
| Virginia | `19PYgF6rAz20w4ZyLEGX` | `pit-5c4b1eea-7980-462b-8cb4-aaf3c4546b2a` |

---

## Column layout (final)

```
       col A           col B            col C            col D       col E      col F      col G
       ──────────────  ──────────────   ──────────────   ─────────   ─────────  ────────   ──────────
row 1  Name            Email            Phone            Waiver      Balance                            ← top header (frozen)

row 2  Mary Smith      mary@email.com   (555) 123-4567   Florida     $924.75                            ← customer row
                                                                     ↑ HYPERLINK + red bg

row 3  Date            Item             Unit Price       Days        Weeks      Total      Status      ← sub-header (grey, bold)

row 4  Apr 12, 2026    Camp 3-day       $285/wk          3           3          $855.00    🟠 owed     ← tx row (Total = =285*3)
row 5  Apr 12, 2026    Pizza            $7.75/day        3           3          $69.75     🟠 owed     ← tx row (Total = =7.75*3*3)
row 6  Apr 13, 2026    T-shirt XL       $25                                     $25.00     🟢 paid     ← tx row (Total = =25)
```

- Customer row spans cols A–E (5 cols of data).
- Sub-header and tx rows span cols A–G (7 cols of data).
- All rows anchor to col A — left-aligned.
- Mary's Balance cell (E2) contains:
  ```
  =HYPERLINK("https://app.gohighlevel.com/v2/location/8IWtNFlmgJ8bif9DivHT/contacts/detail/abc123",
             "$" & TEXT(SUMIFS(F4:F6, G4:G6, "owed"), "0.00"))
  ```
  Apps Script writes this formula and extends the F/G ranges as new tx rows arrive.

---

## Pricing convention

| Pattern | Math | Example |
|---|---|---|
| `$N` (alone) | flat | `T-shirt XL ($25)` → $25 |
| `$N/week` | `N × num_weeks` | `Camp 3-day ($285/week)` × 3 wks → $855 |
| `$N/day` | `N × duration_days × num_weeks` | `Pizza ($7.75/day)` with 3 days × 3 wks → $69.75 |
| `# day(s)` in any option label | sets the **duration multiplier** | `3 days ($285/week)` → days = 3 |
| no `$` | ignored | `Cabin Group A` |

### Worked example

Mary picks `Camp 3-day ($285/week)` + Camp Dates `[Jun 1-5, Jun 8-12, Jul 6-10]` (3 weeks) + `Pizza ($7.75/day)` + `T-shirt XL ($25)`.

| Item | Total formula in cell | Displays |
|---|---|---|
| Camp 3-day | `=285*3` | $855.00 |
| Pizza | `=7.75*3*3` | $69.75 |
| T-shirt XL | `=25` | $25.00 |
| | **Mary owes** | **$924.75** |

Mary's Balance: `SUMIFS` of `F4:F6` where `G4:G6 = "owed"` = $924.75 (T-shirt is paid, excluded).

---

## Pre-flight checklist

- [ ] Empty Google Sheet created and bookmarked
- [ ] One GHL workflow created in each of the three subaccounts (FL, GA, VA): trigger "Form Submitted" or "Survey Submitted" → Webhook action (URL filled in after Claude builds the script)
- [ ] `$N` / `$N/day` / `$N/week` convention documented for the team
- [ ] Camp Duration form options renumbered with leading digits: `1 day ($125/week)`, `2 days ($215/week)`, etc.
- [ ] Waiver Origin custom field exists in each subaccount with values "Florida" / "Georgia" / "Virginia"

---

## Development steps

### Step 1 — Setup
- Create Google Sheet, name it "Systema Floyd — Billing Dashboard"
- Bookmark URL
- Open in Chrome with Claude Chrome extension active

### Step 2 — Run the build
- Paste the prompt from [§ Claude Chrome extension prompt](#claude-chrome-extension-prompt) below
- Run; verify all acceptance criteria pass

### Step 3 — Wire up GHL webhooks (per subaccount)
- Copy the Apps Script Web App URL Claude reports back
- Paste it into the Webhook action of the workflow in each subaccount (FL, GA, VA)

### Step 4 — Form label cleanup
- Audit every billable form across all three subaccounts
- Update Camp Duration options to `# day(s) ($N/week)` format
- Add `/day` or `/week` suffixes to per-unit pricing items
- Confirm flat items use just `$N`

### Step 5 — Smoke test
- Submit a real test form in each subaccount
- Verify a customer + tx rows appear with correct math
- Click the Balance cell → confirm GHL profile opens in correct subaccount
- Flip a status pill → balance auto-updates

### Step 6 — Hand off
- Walk Erin through the layout
- Show how to flip status pills
- Show how to add a manual cash payment row (just type below the customer's existing tx rows)
- Bookmark in her browser

---

## Claude Chrome extension prompt

Copy this verbatim into the Chrome extension while the empty Google Sheet is open. All three tokens are baked in.

```
Build a billing dashboard for Systema Floyd Martial Arts in this Google Sheet,
backed by Apps Script + GoHighLevel API across three subaccounts.

═══════════════════════════════════════════════════════════════════════
BUSINESS CONTEXT
═══════════════════════════════════════════════════════════════════════

Systema Floyd is a martial arts school running camps and other programs
across three states. The team needs ONE bookmark — this Google Sheet —
to see who has signed up, who has paid, who owes, and a clickable link
to charge each customer's card via the right GHL subaccount.

Owner: Tom Floyd
Day-to-day operator: Erin

═══════════════════════════════════════════════════════════════════════
THE THREE SUBACCOUNTS
═══════════════════════════════════════════════════════════════════════

const SUBACCOUNTS = {
  Florida:  { locationId: '8IWtNFlmgJ8bif9DivHT',
              token: 'pit-ba33c398-1647-41c9-9024-98f203d6b30c' },
  Georgia:  { locationId: 'ufcwXlTuemk8qbAZQPT6',
              token: 'pit-3896bf36-9322-43e0-bbfb-61120444008a' },
  Virginia: { locationId: '19PYgF6rAz20w4ZyLEGX',
              token: 'pit-5c4b1eea-7980-462b-8cb4-aaf3c4546b2a' },
};
const DEFAULT_SUBACCOUNT = 'Florida'; // when Waiver Origin is empty/unknown

GHL API base:    https://services.leadconnectorhq.com
GHL Version:     2021-07-28

═══════════════════════════════════════════════════════════════════════
CORE PRINCIPLE
═══════════════════════════════════════════════════════════════════════

Every form submission is captured at the moment it happens via webhook.
Each billable line item becomes one transaction row. Customers and their
transactions live on the SAME sheet — customers are top-level rows,
transactions are nested in collapsible row groups beneath them.

DO NOT:
- Hard-code which custom fields are "billing fields" — discovery is
  regex-driven via the $N convention below
- Add hidden helper columns. There are NO hidden columns in this design.
- Add a "Billing → Add manual payment" menu. The team adds manual rows
  by typing them directly.
- Wrap formulas in IFERROR. If something errors, we want it visible.

═══════════════════════════════════════════════════════════════════════
THE PRICING CONVENTION (regex-driven discovery)
═══════════════════════════════════════════════════════════════════════

Form-option labels follow these patterns:

  $N           — flat one-time charge
  $N/day       — charge = N × duration_days × num_weeks
  $N/week      — charge = N × num_weeks

Where:
  duration_days = the integer N parsed from any "# day" or "# days"
                  occurrence in any option label of the submission
                  (typically the Camp Duration field, e.g. "3 days")
  num_weeks     = the count of weeks selected in the Camp Dates field
                  (defaults to 1 if no Camp Dates field on the form)

Regexes:
  PRICE_REGEX     = /\$(\d+(?:\.\d{2})?)(\/day|\/week)?/
  DURATION_REGEX  = /(\d+)\s+days?/i

═══════════════════════════════════════════════════════════════════════
WEBHOOK PAYLOAD HANDLING — Defense A only
═══════════════════════════════════════════════════════════════════════

GHL webhooks include the contact's FULL custom field state plus a per-
submission block. We process ONLY the per-submission block to avoid
re-processing old fields on every webhook.

Look for the submission block under one of these keys, in order:
  payload.submitted_form_data
  payload.formData
  payload.submission
  payload.form?.fields
If found, parse $N values from THAT block only.
If none are present, fall back to payload.customField — log a warning to
script properties so we know to investigate.

NO dedupe layer. We trust Defense A. If duplicates ever appear in
practice, we'll add dedupe later.

═══════════════════════════════════════════════════════════════════════
GHL PROFILE DEEP LINK
═══════════════════════════════════════════════════════════════════════

For each customer, generate a clickable link to their profile in the
right GHL subaccount.

  1. Read the contact's "Waiver Origin" custom field.
  2. Map to subaccount: "Florida" / "Georgia" / "Virginia". Empty or
     unknown → DEFAULT_SUBACCOUNT (Florida).
  3. Using THAT subaccount's token, search /contacts/search by email:
       POST https://services.leadconnectorhq.com/contacts/search
       Body: { "locationId": "<that subaccount's id>",
               "query": "<email>", "pageLimit": 1 }
  4. Pull contact_id from the response.
  5. Build URL:
       https://app.gohighlevel.com/v2/location/{LOCATION_ID}/contacts/detail/{CONTACT_ID}
  6. Use this URL inside the Balance cell's HYPERLINK formula.

If the contact isn't found in the routed subaccount: the Balance cell
becomes a plain TEXT (not a hyperlink) showing "(not found in {sub})"
in red. Erin investigates manually.

═══════════════════════════════════════════════════════════════════════
GOOGLE SHEET STRUCTURE — single tab "Dashboard"
═══════════════════════════════════════════════════════════════════════

Wipe any existing tabs. Create one tab called "Dashboard".

Three row types, distinguished by content (NO row_type column):
  - customer row    : has a name in col A, email in col B
  - sub_header row  : has the literal text "Date" in col A, "Status" in col G
  - tx row          : has a date value in col A, a status value in col G

Column layout — 7 columns total, all visible, all anchored to col A:

  Col A: Name (customer) | "Date" (sub-header) | timestamp (tx)
  Col B: Email (customer) | "Item" (sub-header) | option_label (tx)
  Col C: Phone (customer) | "Unit Price" (sub-header) | unit price text (tx)
  Col D: Waiver Origin (customer) | "Days" (sub-header) | duration_days (tx, blank if flat)
  Col E: Balance (customer, HYPERLINK formula) | "Weeks" (sub-header) | num_weeks (tx, blank if flat)
  Col F: (blank on customer rows) | "Total" (sub-header) | total formula (tx)
  Col G: (blank on customer rows) | "Status" (sub-header) | status pill (tx)

Top header (row 1) — pinned/frozen:
  A1 = "Name"
  B1 = "Email"
  C1 = "Phone"
  D1 = "Waiver Origin"
  E1 = "Balance"
  F1 = (blank)
  G1 = (blank)

Add a basic filter (Data → Create a filter) on cols A–G.

────────────────────── Customer row formatting ──────────────────────

Cells A–D: bold, font size 12, light blue-grey background (#EEF3F8).
Cell E (Balance): see "Balance cell" below.
Cells F, G: blank, no formatting.

────────────────────── Sub-header row formatting ──────────────────────

Cells A–G: dark blue-grey background (#D5DCE5), white bold uppercase
text, font size 10. The visual cue that this is a header inside a group.

────────────────────── Tx row formatting ──────────────────────

Cells A–G: regular weight, font size 11. Background per status:
  - status = "paid"      → row background #E0F4E5 (light green)
  - status = "owed"      → row background white (default)
  - status = "canceled"  → row background #FCE4E4 (light pink),
                            Total cell text red
  - status = "refunded"  → row background #FFE5CC (light orange),
                            Total cell text red

Use conditional formatting rules with custom formulas like:
  =$G2="paid"   → light green
  =$G2="canceled" → light pink + red text on F
  =$G2="refunded" → light orange + red text on F

────────────────────── Balance cell (col E on customer rows) ──────────────────────

The Balance cell holds a HYPERLINK formula:

  IF ghl_profile_url is known:
    =HYPERLINK(
       "https://app.gohighlevel.com/v2/location/{loc_id}/contacts/detail/{contact_id}",
       "$" & TEXT(SUMIFS(F{firstTxRow}:F{lastTxRow},
                          G{firstTxRow}:G{lastTxRow}, "owed"), "0.00"))

  IF contact not found:
    Plain text "(not found in {subaccount})" — no hyperlink

Apps Script writes this formula on customer creation and updates the
F/G ranges whenever a tx row is added or removed. The formula auto-
recomputes whenever a status pill changes.

NO IFERROR wrapping. If something errors (e.g., row got deleted), the
cell shows the raw error so Erin investigates.

────────────────────── Balance background color ──────────────────────

Apps Script sets the Balance cell's background color directly when
writing the formula, based on the computed numeric balance:

  balance > 0  → background #FCE4E4 (light red)
  balance = 0  → background white (no fill)
  balance < 0  → background #E0EEF8 (light blue)

The script computes the balance value (same SUMIFS) once when writing,
applies the bg color, then writes the HYPERLINK formula. On status
flips by Erin, an onEdit trigger recomputes the balance and updates
the bg color.

────────────────────── Total cell (col F on tx rows) ──────────────────────

The Total cell holds a REAL FORMULA showing the math literally:

  pricing_rule = "flat"      → =25         (just the price)
  pricing_rule = "per_week"  → =285*3      (price × num_weeks)
  pricing_rule = "per_day"   → =7.75*3*3   (price × duration_days × num_weeks)

The cell displays the result. Click the cell → formula bar shows the
math. Erin can audit any total instantly.

Format col F as currency (USD).

────────────────────── Status cell (col G on tx rows) ──────────────────────

Apply data validation to col G on tx rows:
  Allowed values: paid, owed, canceled, refunded
  Default: owed (set when tx row is created)
  Use Google Sheets dropdown chip style (the "smart chip" dropdown that
  renders as a colored pill).

If chip-style dropdowns aren't reliably configurable from Apps Script,
fall back to a plain dropdown — the row's conditional formatting still
gives the visual color cue.

═══════════════════════════════════════════════════════════════════════
ROW GROUPING
═══════════════════════════════════════════════════════════════════════

For each customer, wrap their sub-header row + all their tx rows in a
row group:

  sheet.getRange(subHeaderRow, 1, numRows, 1).shiftRowGroupDepth(1);

Default state per customer:
  - balance > 0  → group EXPANDED (the user sees who owes what)
  - balance = 0  → group COLLAPSED (clean view, click + to expand)

Apps Script sets this on customer creation and re-applies after every
update (webhook + status flip).

═══════════════════════════════════════════════════════════════════════
APPS SCRIPT
═══════════════════════════════════════════════════════════════════════

──────────────────── Configuration ────────────────────

const SUBACCOUNTS = { /* as defined above */ };
const DEFAULT_SUBACCOUNT = 'Florida';

const PRICE_REGEX = /\$(\d+(?:\.\d{2})?)(\/day|\/week)?/;
const DURATION_REGEX = /(\d+)\s+days?/i;

const STUDENT_NAME_FIELD_IDS = [
  'NzRxGhIZJ0RZclSGprrF',  // Student 1
  'yKxmNI57yrPozW0Zd3cA',  // Student 2
  'eyNFkL0qAZug3mMnQBvk',  // Student 3
  'nPhA81OMvPttlnwQtujH',  // Student 4
  'WitmrGYAPRw66ONJuRjQ',  // Summer Name (legacy)
  'rwAlfmxIbkk5k7nmgahu',  // Free Camp Name (legacy)
  'mCopCd8PHPPGBdo30zYK',  // After School Name (legacy)
];

──────────────────── doPost(e) — webhook receiver ────────────────────

Always returns 200 OK to GHL. Errors logged to script properties.

  1. Parse e.postData.contents.
  2. Extract email (lowercase, trimmed), name, phone.
  3. Read Waiver Origin → resolve subaccount.
  4. Search the routed subaccount for the contact by email → contact_id.
  5. Build profile URL (or null if not found).
  6. UPSERT customer row (find existing by email, or create new).
  7. Identify the per-submission fields (Defense A — see the WEBHOOK
     PAYLOAD HANDLING section). Compute duration_days and num_weeks.
  8. For each PRICE_REGEX match in those values:
     - Compute total via the pricing rules
     - Append a tx row inside that customer's group
     - Total cell gets a literal formula like =285*3
  9. Update the customer's Balance formula range (extend to cover the
     new tx rows).
 10. Compute balance numerically, set Balance cell bg color.
 11. Set group default state (collapsed if balance=0, expanded if >0).

──────────────────── upsertCustomerRow(...) ────────────────────

Find existing customer by email (search col B):
  - If found: update name (A), email (B), phone (C), waiver_origin (D),
    profile URL embedded in HYPERLINK formula at E. DO NOT touch tx
    rows beneath.
  - If new: append at the bottom — customer row, then sub-header row,
    then row group around the sub-header (no tx rows yet but group
    starts here). Apply initial Balance formula referencing the
    sub-header's row + 1 (empty range until first tx).

──────────────────── appendTxRow(email, txData) ────────────────────

  - Find the customer row by email.
  - Walk down to find the END of that customer's tx range (last tx row
    or the sub-header row if no tx yet).
  - Insert a new row just below the last tx (or just below the sub-
    header for a brand-new customer).
  - Fill cols A–G:
      A: timestamp (formatted "MMM d, yyyy")
      B: option_label (cleaned, no $ portion)
      C: unit_price (text, e.g. "$285/wk", "$7.75/day", "$25")
      D: duration_days (numeric, or blank if flat)
      E: num_weeks (numeric, or blank if flat)
      F: literal Total formula (=285*3, =7.75*3*3, =25)
      G: status = "owed"
  - Apply data validation (status dropdown) on the new G cell.
  - Extend the row group to include this row.
  - Update the customer's Balance formula range to include this row.

──────────────────── recomputeCustomerBalance(customerRow) ────────────────────

  - Find the customer's tx range (sub-header + 1 to end of group).
  - Compute SUMIFS(F[range], G[range], "owed") → numeric balance.
  - Update Balance cell:
      - Background color (red/white/blue per the rules)
      - Group state (expanded if >0, collapsed if =0)

Called after every tx insert AND from the onEdit trigger when a status
pill changes.

──────────────────── onEdit(e) trigger ────────────────────

Fires when Erin edits any cell. If the edit is on a tx row's status
cell (col G):
  1. Find the customer that owns this tx row (walk up to the customer
     header).
  2. Call recomputeCustomerBalance(customerRow).

If the edit creates a new tx row manually (e.g., Erin types a row
beneath an existing customer):
  1. Same logic — find the owning customer.
  2. Update the Balance formula range to include the new row.
  3. Apply status dropdown validation if missing.

──────────────────── Maintenance menu ────────────────────

Single menu "Maintenance" with two items:
  - "Re-sort by email" — sorts so customers are alphabetical by email,
                         each customer's sub-header + tx rows immediately
                         follow. Rebuilds row groupings AND all Balance
                         formula ranges.
  - "Show debug log"   — opens a dialog showing the last 50 webhook
                         events from script properties.

──────────────────── runFakeWebhook() — keep, update assertions ────────────────────

Test scenario:
  - email "test@example.com"
  - waiver_origin "Florida"
  - Camp Duration "3 days ($285/week)"
  - Camp Dates ["Jun 1-5", "Jun 8-12", "Jul 6-10"]  (3 weeks)
  - Lunch "Pizza ($7.75/day)"
  - T-shirt "T-shirt XL ($25)"

After running, verify:
  - 1 customer row at row 2 with email "test@example.com"
  - 1 sub-header row at row 3
  - 3 tx rows at rows 4, 5, 6
  - Row group wraps rows 3–6
  - Customer's Balance cell (E2):
      Formula: =HYPERLINK("(not found in Florida)", ...) OR plain text
               "(not found in Florida)" since this email isn't in GHL
      Background: light red (balance is $924.75 > 0)
      Display: "$924.75"
  - Total cells:
      F4: formula =285*3, displays $855.00
      F5: formula =7.75*3*3, displays $69.75
      F6: formula =25, displays $25.00
  - Status pills on G4, G5, G6 all set to "owed"
  - Group is EXPANDED (balance > 0)

═══════════════════════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════════════════════

1. Save the Apps Script project (name: "Systema Floyd Billing").
2. Deploy → New Deployment → Web App
   - Execute as: Me (script owner)
   - Who has access: Anyone
3. Authorize when prompted.
4. Copy the Web App URL — return it in your final report.
5. Install onEdit simple trigger:
   - The function `onEdit(e)` is auto-installed as a simple trigger in
     Apps Script just by being defined. Verify by checking Triggers.

═══════════════════════════════════════════════════════════════════════
PHASE 2 — DOCUMENT AS // TODO COMMENTS, DO NOT IMPLEMENT
═══════════════════════════════════════════════════════════════════════

  // TODO(phase2): Liability waiver date column (when the waiver custom
  //   field on the contact is filled, surface the date on the customer
  //   row).

  // TODO(phase2): One-click Square charge using the GHL profile link
  //   plus a Square fee passthrough. Customer pays $listed-price plus
  //   the 2.7% + $0.15 Square processing fee so the gym nets full price.
  //   const SQUARE_FEE_RATE = 0.027;
  //   const SQUARE_FEE_FIXED = 0.15;
  //   function grossUpForSquare(net) {
  //     return Math.ceil((net + SQUARE_FEE_FIXED) / (1 - SQUARE_FEE_RATE) * 100) / 100;
  //   }

  // TODO(phase2): Auto-update transaction status from Square webhooks
  //   (match by email + amount within 7-day window).

  // TODO(phase2): "Cancel signup" / "Record refund" custom menu items
  //   that flip status with a confirmation dialog.

  // TODO(phase2): Per-customer sidebar UI with full history and reminder
  //   email button.

  // TODO(phase2): Automated weekly reminder emails to customers in
  //   balance > 0 status.

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════

1. One sheet "Dashboard" with the 7-column layout. No hidden columns.
   Top row frozen with headers Name / Email / Phone / Waiver Origin /
   Balance in cols A–E. Filter enabled on A–G.

2. NO "Billing" menu. "Maintenance" menu exists with two items.

3. runFakeWebhook() produces:
   - 1 customer row (row 2)
   - 1 sub-header row (row 3) styled grey/bold
   - 3 tx rows (rows 4–6)
   - Row group wrapping rows 3–6, expanded by default (balance > 0)
   - Customer's Balance cell shows "$924.75" on a light red background
     (or "(not found in Florida)" since the test email isn't real,
      still red-bg)
   - Total cells contain literal formulas (=285*3, =7.75*3*3, =25)

4. Click test customer's Balance cell → formula bar shows the HYPERLINK
   formula (or plain text if profile not found).

5. Click status pill on row 5 (Pizza) → dropdown opens with paid/owed/
   canceled/refunded. Pick "paid". Verify:
   - Pizza row turns light green
   - Customer's Balance auto-recomputes to $855 (red bg)
   - Group remains expanded (balance still > 0)

6. Flip the other two tx rows to "paid" so balance = 0. Verify:
   - Customer's Balance shows "$0.00" with white background
   - Group AUTO-COLLAPSES (default state for $0 balance applies on
     next render — note: may require a manual refresh or
     "Maintenance → Re-sort" to take effect)

7. Manually type a new tx row directly under the test customer's
   existing tx rows: A=current date, B="Manual cash", C="$50",
   F=50 (or the formula =50), G=paid via the dropdown. Verify:
   - Balance recomputes (still $0 since this row is paid)
   - Row group auto-extends to include the new row

8. Maintenance → Re-sort by email: rebuilds the layout cleanly with
   correct groupings and balance formula ranges.

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Apps Script Web App URL.
  2. Result of each of the 8 acceptance criteria.
  3. The actual GHL webhook payload structure (paste a redacted sample)
     so we know which "submission" key is present.
  4. Whether dropdown chips with colored pills could be configured via
     Apps Script API, or whether you fell back to plain dropdown +
     conditional formatting.
  5. Any unresolved issues, ambiguities, or assumptions made.
```

---

## Acceptance tests (after build)

| # | Test | Expected |
|---|---|---|
| 1 | Open the sheet | One tab "Dashboard", 7 columns visible, no hidden cols |
| 2 | Run `runFakeWebhook()` | 1 customer + 1 sub-header + 3 tx rows; row group wraps sub-header + tx; Balance cell shows $924.75 with red bg; group expanded |
| 3 | Click any Total cell | Formula bar shows the literal math (`=285*3`, `=7.75*3*3`, `=25`) |
| 4 | Click the Balance cell | Opens GHL profile in new tab (or shows "(not found)" if test email) |
| 5 | Flip a status pill via dropdown | Row recolors; balance auto-recomputes |
| 6 | Flip all to paid → balance hits $0 | Bg goes white; group default flips to collapsed |
| 7 | Type a manual row below existing tx | Range extends; balance recomputes; status validation applied |
| 8 | Maintenance → Re-sort by email | Sheet reorganizes; groupings + formula ranges rebuilt cleanly |

---

## Phase 2 roadmap

| # | Feature |
|---|---|
| 1 | Liability waiver date column |
| 2 | Square fee passthrough using `grossUpForSquare()` |
| 3 | Auto-update status from Square webhooks |
| 4 | "Cancel signup" / "Record refund" custom menu items |
| 5 | Per-customer sidebar UI with reminder email button |
| 6 | Automated weekly reminders to balance > 0 customers |

All documented as `// TODO(phase2)` in the Apps Script.

---

## Operations & maintenance

### Automatic
- New form submission → customer + tx rows + balance formula
- Multi-state routing via Waiver Origin
- GHL profile link generation
- Total formulas show the math literally
- Balance auto-recomputes on status flips (no Apps Script needed)
- Row group state (collapsed/expanded) follows balance state

### Manual
- Forms: maintain `$N` / `$N/day` / `$N/week` syntax in option labels
- Status flips: Erin clicks the pill, picks new value
- Cancellations: flip status pill to "canceled"
- Refunds: flip status pill to "refunded"
- Cash payments: type a new row directly under the customer's existing tx rows
- Re-sort: run "Maintenance → Re-sort by email" if rows drift after manual editing

### Daily routines

| Frequency | Task | Time |
|---|---|---|
| Daily | Erin: filter by Balance > 0, click Balance cells to charge cards via GHL | ~5 min |
| As needed | Flip status pills when payments land | ~5 sec each |
| Weekly | Scan canceled/refunded rows to confirm | ~5 min |
| Monthly | Tom reviews totals, hands to accountant | ~2 min |
| As needed | Anyone making a new form: confirm `$N` syntax | — |

---

## When something goes wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| New form submission doesn't appear | GHL workflow inactive in that subaccount, or webhook URL wrong | Check workflow status; re-paste URL |
| Balance shows `#REF!` or other error | A row got deleted that the formula referenced | Run "Maintenance → Re-sort by email" to rebuild ranges |
| Balance shows "(not found in {sub})" | Contact doesn't exist in the routed subaccount | Verify Waiver Origin field; check if contact is in different state |
| Status flip doesn't update balance | onEdit trigger not installed or broken | Apps Script → Triggers → confirm `onEdit` is registered |
| Multiplication math wrong | Either duration_days didn't parse (no `# day` in any option) or num_weeks is 0 | Confirm Camp Duration option contains `# day(s)`; confirm Camp Dates is multi-select |
| Form option with `$N` not picked up | Wrong syntax in label | Must be `$N`, `$N/day`, or `$N/week` exactly |

---

## Glossary

- **Customer row** — top-level row, one per unique email. Cols A–E filled.
- **Sub-header row** — labeling row inside each customer's group. Cols A–G filled with literal labels ("Date", "Item", etc.).
- **Tx row** — one transaction line item. Cols A–G filled with actual data.
- **Row group** — Google Sheets feature that wraps the sub-header + tx rows under each customer for collapse/expand.
- **`$N` convention** — every billable form option label uses `$N` (flat), `$N/day`, or `$N/week`.
- **Duration multiplier** — integer parsed from `# day` or `# days` in any option label of the submission. Default 1.
- **`num_weeks`** — count of selected items in the Camp Dates field. Default 1.
- **Waiver Origin** — custom field indicating which subaccount holds the customer's card on file. Empty → Florida.
- **Phase 1** — what ships in this build.
- **Phase 2** — features deferred (Square auto-flip, fee passthrough, etc.). Documented as `// TODO(phase2)` in code.

---

**Last updated:** 2026-05-01
**Document owner:** Emilio (Nils Digital)
**Sheet location:** _to be filled in after creation_
**Apps Script Web App URL:** _to be filled in after Step 2_
