# Stage 9d — Final acceptance check + sign-off

> Run last. End-to-end verification: real test forms in each subaccount, spot-check a few balances by hand, confirm zero phantom rows, confirm Waiver Origin populates, confirm chips render. The output is a sign-off report.

**Run order:** 5th (last). All four prior follow-ups must report PASS before this runs.
**Prerequisites:** [1-fix-stacked-row-groups.md](1-fix-stacked-row-groups.md), [2-phantom-rows-trace.md](2-phantom-rows-trace.md), [3-fix-waiver-origin.md](3-fix-waiver-origin.md), [4-status-chips-and-qa-count.md](4-status-chips-and-qa-count.md) all confirmed.
**Background:** [architecture spec](../docs/billing-dashboard-plan.md), [pricing convention](../docs/pricing-syntax.md), source in [../apps-script/](../apps-script/).

---

## The prompt

Copy this entire block into a fresh Claude Chrome extension instance with the Dashboard tab + Apps Script editor open:

````
FINAL ACCEPTANCE — Stage 9d. Verify the Systema Floyd Billing
Dashboard is production-ready. Single deliverable: a structured
sign-off report. No code changes unless something genuinely
fails — in that case, fix the smallest possible thing and
re-verify.

═══════════════════════════════════════════════════════════════════════
CONTEXT (short)
═══════════════════════════════════════════════════════════════════════

Project is a Google Sheet ("Systema Floyd — Billing Dashboard")
backed by Apps Script. It polls /forms/submissions in three GHL
subaccounts (FL, GA, VA) every 5 minutes, writes customer + tx
rows with sub-header + collapsible groups + per-customer balance
hyperlinks. Layout final:

  col A=Name, B=Email, C=Phone, D=Waiver Origin,
  E=Student Name, F=Contact Profile, G=Balance/Status

Stages 1–9 + 9a + 9b + 9c have all shipped. This is the final
check.

═══════════════════════════════════════════════════════════════════════
PART 1 — Layout + branding spot-check
═══════════════════════════════════════════════════════════════════════

Open Dashboard tab. Confirm:

  a. Row 1 header reads exactly:
       Name | Email | Phone | Waiver Origin | Student Name |
       Contact Profile | Balance

  b. Pick 3 random customer rows. For each:
       - Background is dark blue #143980, text white, bold
       - Col A (Name) populated
       - Col B (Email) populated, valid email format
       - Col C (Phone) populated
       - Col D (Waiver Origin) populated with Florida / Georgia
         / Virginia (or empty if the form genuinely didn't ask)
       - Col E (Student Name) populated if the customer has
         student-name fields on their form
       - Col F (Contact Profile) shows "Contact Profile Link"
         hyperlink to app.nilsdigital.com/...
       - Col G (Balance) shows currency value with bg color
         per balance state (red/white/blue)

  c. Pick 3 sub-header rows. Confirm:
       - Background mid-blue #4a6493, text white, uppercase
         bold
       - Labels: DATE | ITEM | UNIT PRICE | DAYS | WEEKS |
         TOTAL | STATUS

  d. Pick 5 tx rows. Confirm:
       - White (or status-colored) background
       - Date in col A formatted "MMM d, yyyy" or similar
       - Item label preserves any commas inside parens
       - Total in col F = a literal formula like =285*3
       - Status in col G = a colored chip dropdown

═══════════════════════════════════════════════════════════════════════
PART 2 — Submit one real test form per subaccount
═══════════════════════════════════════════════════════════════════════

This is the gold-standard end-to-end test. ASK the user to
submit one test form per state. Provide them a checklist:

  For FL (mandatory) and ideally GA + VA:
    - Pick a form that has student-name field(s)
    - Pick a Camp Duration option that includes "# day(s)"
    - Pick at least one $/day item
    - Pick at least one $/week item
    - Pick at least one flat-priced item with a comma inside
      parens (e.g. "Daily fruit (banana, blueberry) $10/day")
    - Submit
    - Wait 5–10 minutes for the cron to poll

If the user doesn't have time to submit live forms RIGHT NOW,
mark this part SKIPPED in the report and move on. Note the
specific expectations the next live form should be checked
against.

If they DO submit:
  - Open Logs sheet, find the new row(s) (sorted by timestamp
    desc)
  - Open Dashboard, find the new customer row(s)
  - Verify:
       a. New customer row appears in correct subaccount-routed
          state in col D
       b. Sub-header row directly under
       c. One tx row per priced item — labels intact, totals
          right
       d. Group state matches balance (collapsed if 0,
          expanded if > 0)
       e. Comma-in-parens label preserved in full
       f. Balance HYPERLINK opens the right state's GHL profile
          via app.nilsdigital.com
       g. NO phantom $1 rows

═══════════════════════════════════════════════════════════════════════
PART 3 — Spot-check 3 balances by hand
═══════════════════════════════════════════════════════════════════════

Pick 3 customers with balance > 0. For each:

  - Expand their group
  - Manually sum the col F (Total) values where col G (Status)
    = "owed"
  - Compare against the displayed balance in col G of the
    customer row

They should match exactly. If not, log which customer + what
they sum to + what's displayed.

═══════════════════════════════════════════════════════════════════════
PART 4 — Bulk menu smoke-test
═══════════════════════════════════════════════════════════════════════

  a. Pick a customer with balance > 0 and at least 2 tx rows
     all currently "owed".
  b. Click any cell in their tx range.
  c. Bulk → Set selected customer's tx rows → paid
  d. Verify:
       - All their tx rows turn green (paid bg)
       - Customer's balance hits $0.00
       - Balance bg flips to white
       - Group auto-collapses (or note if it requires a
         refresh)
  e. Bulk → Set ... → owed (revert)
  f. Verify the rollback works (rows back to white, balance
     restored, group expanded)

═══════════════════════════════════════════════════════════════════════
PART 5 — Health checks
═══════════════════════════════════════════════════════════════════════

  a. Run runFullQA(). Confirm: 56 PASS / 0 FAIL (or whatever
     the correct count is post-9c).
  b. Run pollFloridaSubmissions() manually. Confirm zero
     duplicate Logs entries created (Stage 8 dedupe still
     working).
  c. Confirm the time-driven trigger for pollFloridaSubmissions
     is still installed (Apps Script → Triggers).
  d. Confirm dailyHealthCheck trigger is installed.
  e. Grep across all .gs files: zero references to
     "doPost", "runFakeWebhook", "stage5E2ESetup",
     "app.gohighlevel.com" (URL host — leave the proper-noun
     "GoHighLevel" / "GHL" in comments).

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

  ## Part 1 — Layout + branding spot-check
    - Header row: PASS / FAIL
    - 3 customer rows: PASS / FAIL (note any failures)
    - 3 sub-header rows: PASS / FAIL
    - 5 tx rows: PASS / FAIL

  ## Part 2 — Live test forms
    - FL submitted? (yes/no/skipped)  — result
    - GA submitted? (yes/no/skipped)  — result
    - VA submitted? (yes/no/skipped)  — result

  ## Part 3 — Manual balance verification
    - Customer 1: name, hand-summed total, displayed balance,
      MATCH / MISMATCH
    - Customer 2: same
    - Customer 3: same

  ## Part 4 — Bulk menu
    - Set paid: PASS / FAIL
    - Set owed (rollback): PASS / FAIL

  ## Part 5 — Health checks
    - runFullQA: X PASS / Y FAIL
    - Manual poll: 0 duplicates? (yes/no)
    - Triggers installed: poll + dailyHealthCheck: yes/no
    - Grep clean: yes/no

  ## Sign-off
    - Production-ready? (YES / NO + reasoning)
    - Open issues / follow-ups (none expected)

  STOP. This is the last gate. If everything passes, report
  PRODUCTION-READY.
````

---

## Acceptance

1. All 5 parts pass (or have explicit, defensible "skipped" notes for live form submission)
2. Manual balance spot-checks all match
3. Bulk menu functions end-to-end
4. `runFullQA()` clean
5. No regressions from Stages 1–9c
6. Sign-off issued: PRODUCTION-READY
