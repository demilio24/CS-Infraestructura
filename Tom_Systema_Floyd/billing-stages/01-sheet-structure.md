# Stage 1 — Sheet structure + Apps Script skeleton

> Build the empty shell. Sheet has the right columns, headers, formatting rules. Apps Script has configuration constants and reads tokens from Script Properties. **No live functionality yet** — later stages add logic.

**Prerequisite:** [Pre-flight setup](00-README.md#pre-flight-do-this-before-stage-1) complete (Script Properties with tokens added)
**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## The prompt

Copy this entire block into the Claude Chrome extension while the empty Google Sheet is open:

```
STAGE 1 of 5 — Build the sheet structure and Apps Script configuration skeleton.
This stage produces no live functionality; only structure. Later stages add logic.

═══════════════════════════════════════════════════════════════════════
GOAL FOR THIS STAGE ONLY
═══════════════════════════════════════════════════════════════════════

  1. Wipe any existing tabs in this Google Sheet.
  2. Create one tab named "Dashboard" with the column structure below.
  3. Apply conditional formatting rules.
  4. Open the Apps Script editor and create the configuration file with
     constants and a helper to read tokens from Script Properties.
     NO functions that touch the sheet yet. NO doPost. NO onEdit.

═══════════════════════════════════════════════════════════════════════
SHEET STRUCTURE — tab "Dashboard"
═══════════════════════════════════════════════════════════════════════

Wipe existing tabs. Create one tab "Dashboard" with these settings:

  - 7 columns total (A through G), all visible. NO hidden columns.
  - Row 1 = header row, frozen, with this content:
        A1 = "Name"
        B1 = "Email"
        C1 = "Phone"
        D1 = "Waiver Origin"
        E1 = "Balance"
        F1 = ""  (blank — col F is only used by tx rows)
        G1 = ""  (blank — col G is only used by tx rows)
  - Header row formatting: bold, font size 11, dark blue-grey background
    (#0F3634 with white text — match Systema Floyd's brand).
  - Add a basic filter on cols A–G (Data → Create a filter).
  - Set column widths approximately:
        A: 180px (Name)
        B: 220px (Email)
        C: 140px (Phone)
        D: 130px (Waiver Origin)
        E: 130px (Balance)
        F: 110px
        G: 130px
  - Format col E as currency (USD).
  - Format col F as currency (USD).

═══════════════════════════════════════════════════════════════════════
CONDITIONAL FORMATTING RULES — apply via Format → Conditional formatting
═══════════════════════════════════════════════════════════════════════

Apply these rules to the entire data range (A2:G1000 or use a generous
range that covers future growth):

Rule 1 — Customer rows (any row where col A is a non-empty text that
         is NOT one of "Date", and col B contains "@" indicating email):
  Custom formula: =AND($B2<>"", REGEXMATCH($B2, "@"), $A2<>"Date")
  Format: bold, font size 11, background #EEF3F8 (light blue-grey)

Rule 2 — Sub-header rows (col A literally equals "Date"):
  Custom formula: =$A2="Date"
  Format: bold, ALL CAPS via Format → Text → All caps
          (or just bold uppercase text), font size 9.5,
          background #D5DCE5 (darker blue-grey), white text

Rule 3 — Tx row, status = paid (col G = "paid"):
  Custom formula: =$G2="paid"
  Format: background #E0F4E5 (light green)

Rule 4 — Tx row, status = canceled (col G = "canceled"):
  Custom formula: =$G2="canceled"
  Format: background #FCE4E4 (light pink), col F text color red (#D8453D)

Rule 5 — Tx row, status = refunded (col G = "refunded"):
  Custom formula: =$G2="refunded"
  Format: background #FFE5CC (light orange), col F text color red (#D8453D)

(Tx rows with status = owed get NO conditional formatting — they stay
 default white. Apps Script handles Balance cell colors directly later.)

═══════════════════════════════════════════════════════════════════════
APPS SCRIPT — create file Configuration.gs
═══════════════════════════════════════════════════════════════════════

Open Extensions → Apps Script. Create a single .gs file named
"Configuration" with the following code (and ONLY this code for now):

  /** ─── Subaccount routing config ─────────────────────────────────
   *  Tokens are stored in Script Properties (Project Settings → Script
   *  Properties), NOT inlined in code. Use getTokenFor(subaccount).
   */
  const SUBACCOUNTS = {
    Florida:  { locationId: '8IWtNFlmgJ8bif9DivHT', tokenKey: 'GHL_TOKEN_FLORIDA' },
    Georgia:  { locationId: 'ufcwXlTuemk8qbAZQPT6', tokenKey: 'GHL_TOKEN_GEORGIA' },
    Virginia: { locationId: '19PYgF6rAz20w4ZyLEGX', tokenKey: 'GHL_TOKEN_VIRGINIA' },
  };
  const DEFAULT_SUBACCOUNT = 'Florida';

  const GHL_API_BASE = 'https://services.leadconnectorhq.com';
  const GHL_API_VERSION = '2021-07-28';

  /** ─── Pricing convention regexes ────────────────────────────────── */
  const PRICE_REGEX = /\$(\d+(?:\.\d{2})?)(\/day|\/week)?/;
  const DURATION_REGEX = /(\d+)\s+days?/i;

  /** ─── Student name field IDs (in priority order) ───────────────── */
  const STUDENT_NAME_FIELD_IDS = [
    'NzRxGhIZJ0RZclSGprrF',  // Student 1 - Name
    'yKxmNI57yrPozW0Zd3cA',  // Student 2 - Name
    'eyNFkL0qAZug3mMnQBvk',  // Student 3 - Name
    'nPhA81OMvPttlnwQtujH',  // Student 4 - Name
    'WitmrGYAPRw66ONJuRjQ',  // Summer Name (legacy)
    'rwAlfmxIbkk5k7nmgahu',  // Free Camp Name (legacy)
    'mCopCd8PHPPGBdo30zYK',  // After School Name (legacy)
  ];

  /** ─── Sheet column constants ────────────────────────────────────── */
  const SHEET_NAME = 'Dashboard';
  const COL = {
    NAME_OR_DATE: 1,            // A
    EMAIL_OR_ITEM: 2,           // B
    PHONE_OR_UNIT_PRICE: 3,     // C
    WAIVER_OR_DAYS: 4,          // D
    BALANCE_OR_WEEKS: 5,        // E
    TOTAL: 6,                   // F (only meaningful on tx rows)
    STATUS: 7,                  // G (only meaningful on tx rows)
  };

  /** ─── Read a token from Script Properties ──────────────────────── */
  function getTokenFor(subaccountName) {
    const meta = SUBACCOUNTS[subaccountName];
    if (!meta) throw new Error('Unknown subaccount: ' + subaccountName);
    const token = PropertiesService.getScriptProperties().getProperty(meta.tokenKey);
    if (!token) throw new Error('Missing Script Property: ' + meta.tokenKey);
    return token;
  }

  /** ─── Smoke test for Stage 1 ────────────────────────────────────── */
  function stage1SmokeTest() {
    const results = [];
    // 1. Verify all three tokens are accessible
    for (const sub of Object.keys(SUBACCOUNTS)) {
      try {
        const t = getTokenFor(sub);
        results.push(`[OK] ${sub} token loaded (${t.substring(0, 10)}…)`);
      } catch (e) {
        results.push(`[FAIL] ${sub}: ${e.message}`);
      }
    }
    // 2. Verify the Dashboard sheet exists with the right header
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      results.push('[FAIL] Dashboard sheet not found');
    } else {
      const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
      const expected = ['Name', 'Email', 'Phone', 'Waiver Origin', 'Balance', '', ''];
      const match = headers.every((h, i) => h === expected[i]);
      results.push(match
        ? '[OK] Dashboard headers match'
        : `[FAIL] Headers mismatch: got ${JSON.stringify(headers)}`);
    }
    Logger.log(results.join('\n'));
    return results;
  }

═══════════════════════════════════════════════════════════════════════
ACCEPTANCE FOR STAGE 1
═══════════════════════════════════════════════════════════════════════

  1. The Sheet has exactly one tab "Dashboard". No others.
  2. Row 1 has the 5 visible headers in cols A–E. F1 and G1 are blank.
  3. Header row is frozen and styled with the dark blue-grey background.
  4. Filter is enabled on cols A–G.
  5. The 5 conditional formatting rules are present.
  6. The Apps Script file Configuration.gs exists with all the constants.
  7. Run stage1SmokeTest() from the Apps Script editor's run menu.
     All output lines start with [OK], none with [FAIL].

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  1. Confirmation each acceptance item passes.
  2. Output of stage1SmokeTest() (the Logger lines).
  3. Any deviations or assumptions you had to make.
  4. Done. Do NOT proceed to Stage 2 — wait for the next prompt.
```

---

## Acceptance criteria

1. The Sheet has exactly one tab "Dashboard". No others.
2. Row 1 has the 5 visible headers in cols A–E. F1 and G1 are blank.
3. Header row is frozen and styled with the dark blue-grey background.
4. Filter is enabled on cols A–G.
5. The 5 conditional formatting rules are present.
6. The Apps Script file Configuration.gs exists with all the constants.
7. `stage1SmokeTest()` runs cleanly — all `[OK]`, no `[FAIL]`.

## What to report back

1. Confirmation each acceptance item passes
2. Output of `stage1SmokeTest()` (the Logger lines)
3. Any deviations or assumptions made

## Next stage

After Stage 1's report is approved, move to **[02-helpers.md](02-helpers.md)**.
