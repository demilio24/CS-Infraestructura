# Billing Dashboard Bugs

A running log of bugs found in the Systema Floyd billing dashboard. Each entry covers the symptom, root cause, fix, deploy state, and visual impact for parents/Tom.

---

## +1 week shift in registration billing

**Status:** Code fixed in commit `e2a395e9` ([Billing dashboard/apps-script/BillingFromSheets.js](Billing%20dashboard/apps-script/BillingFromSheets.js)). `clasp push` already confirms the remote script is up to date. Last step before this is fully resolved: run `nuclearResetBilling` to flush the reshuffle in one clean pass.

### The symptom Tom reported

Kids he registered are "missing from the billing dashboard." Named example: Cyrus bar-or (parent `alexandra.berkley@gmail.com`), registered in the PAID Upper sheet for **June 15-19**, couldn't be found under that week.

### What's actually wrong

Cyrus isn't missing — he's billed under **June 22-26** (one week off). Same +1 week shift hits Akasha Smith (Aug 3-7 → Aug 10-14) and Grant Olowin (Lower, Jun 1-5 → Jun 8-12). Likely every kid registered in a tab after the shift-point has the wrong week label.

### Why

The billing reader (`readRegistrationEnrollments_`) walks source-sheet tabs by position — `tabs[0]` is treated as week 1, `tabs[1]` as week 2, and so on. Tom's source sheets have one or more **non-week tabs** mixed in (Notes / Lookup / etc.), which shoves every weekly tab one slot to the right. Result: every kid after the non-week tab gets billed under the *next* week's label.

The `Snapshot.js` reader (which the registration dashboard uses) was fixed for this months ago via name-based resolution. The billing reader never got the same fix.

### What changed (commit `e2a395e9`)

Resolve the week from the **tab name** (`6/15-6/19` → "June 15th-19th") instead of from the tab's position. Tabs whose names don't parse as a week (Notes, Lookup, etc.) are skipped entirely — no positional fallback, because billing under the wrong week is worse than billing nothing.

### What `nuclearResetBilling` does next

Wipes the Dashboard tab and rebuilds every row from the source registration sheets using the fixed reader. The reshuffle happens in one clean pass instead of letting the 5-min cron do it incrementally (which would temporarily leave the dashboard cluttered with `canceled` rows for the wrong-week positions before the new correct-week rows showed up).

### What changes visually after the reset

- Same kids, same dollar amounts, same weeks of actual enrollment
- Cyrus now shows under June 15-19 (where Tom registered him), not June 22-26
- Same for Akasha, Grant, and any other affected kids
- **Net balance is unchanged** — the pre-deploy audit confirmed 0 paid / 0 refund-needed / 0 canceled rows across all 247 tx rows ($48,326.90 total), so the reshuffle moves "owed" → "owed" with zero status-loss risk

### Risk envelope

- Reset runs ~3-5 min. During that window the Dashboard is mid-rebuild — don't have Tom looking at it live.
- The fix removes the silent shift but doesn't address the *root structural cause* (which non-week tab is sitting in front of the weekly tabs in Upper / Lower). The bug can't reintroduce itself unless someone adds another non-week tab in the future and the new tab happens to use a name that parses as a week — extremely unlikely.
- `nuclearResetBilling` is the same function the 3 AM self-heal already runs — it's a well-trodden code path, not new behavior.

**Net:** not changing what gets billed or what anyone owes — just fixing which week each line item is filed under. Tom should see Cyrus, Akasha, and Grant under the right weeks after the reset.

---

## Some customer rows missing their collapsible row groups

**Status:** Self-resolved before investigation could see the broken state — Tom ran `nuclearResetBilling` and the missing groups came back. Defensive logging was added in commit `e2a395e9` so the next occurrence is diagnosable. No reproducible repro yet, so the root cause is unconfirmed.

### The symptom Tom reported

A handful of customer sections on the Dashboard tab were showing without a collapsible row-group on the left margin — the little `[-]` / `[+]` outline buttons that normally let you fold a customer's tx rows under their customer-header row were missing for some customers but not others.

### What's actually wrong (best inference, unconfirmed)

The billing script creates one row-group per customer at multiple points in the pipeline. There are four ways a customer can end up without one, and any of these could have been the cause:

1. **Silent throw in `shiftRowGroupDepth(1)`** — the Sheets API occasionally rejects a row-group create with "Cannot insert a row group at this location" (typically when an adjacent group's boundary conflicts with the new range). Pre-fix, both `fixDashboardGroups` and `nuclearResetBilling` swallowed this error with no log, so the customer just lost its group with no signal in the Logs tab.
2. **Malformed customer header** — if column B of a customer header gets corrupted (no `@` in the email cell) AND the row below it isn't a proper `DATE … STATUS` sub-header, the state-reader doesn't register the customer at all, and the group-fix skips it.
3. **Sub-header missing or corrupted** — if a customer is registered in state but the `DATE … STATUS` row got overwritten, the group-fix bails out at the `txLast < subHeaderRow` guard.
4. **Duplicate-email collision** — the customer-state map is keyed by email. If a parent's section accidentally exists twice (rare; can happen after manual reorders), only one wins in the hash and the other section has no group rebuilt.

The daily 3 AM `dailyDashboardSelfHeal` already runs `findUngroupedCustomers_` → triggers `nuclearResetBilling` if any are found, so the bug self-corrects overnight regardless of root cause. Tom's reset triggered the same cleanup path manually.

### What changed (commit `e2a395e9`)

Restored `Logger.log` on the two previously-silent `catch (e) { /* group quirk */ }` blocks in [Billing dashboard/apps-script/BillingFromSheets.js](Billing%20dashboard/apps-script/BillingFromSheets.js) — one in `appendNewCustomerSection_`, one in `nuclearResetBilling`. Each now logs the customer email, sub-header row, last tx row, and error message. The nuclear path also prints a summary `WARNING: N/M customer row groups failed to create` line so failure counts are greppable in the Logs sheet.

No behavioral fix yet — the next time a customer ends up ungrouped, we'll see exactly which one and why in the Logs sheet (or via the `tailLogs` remote-trigger RPC). Once we know which of the four failure modes is hitting, we can patch the specific one.

### What changes visually after the reset

- Nothing for parents — they don't see the Dashboard sheet.
- For Tom: the collapsible outline groups are back, same as before.
- The new logging only appears in the **Logs** sheet inside the billing project; it doesn't surface in any user-facing UI.

### Risk envelope

- Logging change is read-only — can't make the bug worse.
- Worth checking the Logs sheet every few days until we either see the bug recur (and capture diagnostic data) or decide it was a one-time glitch.
- If it recurs with a clear pattern in the logs, we patch the specific failure mode and remove the catch entirely (let it throw and surface).

**Net:** investigation deferred until we have diagnostic data from a live recurrence. Affected customers are still billed correctly; only the cosmetic row-folding outline was missing.

---

## Whitespace in legacy tuition fingerprints (deferred, low impact)

**Status:** Identified in the 2026-05-22 investigation. No fix applied. Acceptable to leave alone.

Some old tuition rows have fingerprints like `cyrus-bar-or|june-22nd-26th|tuition|5 days` (note the **space** in `5 days`). Current code at [Billing dashboard/apps-script/BillingFromSheets.js:2966](Billing%20dashboard/apps-script/BillingFromSheets.js#L2966) slugifies new fingerprints to `5-days` (hyphen) via `bfsSlug_`, so the current code is right. Old rows with the spaced form persist and never match a fresh fingerprint, so the diff-apply marks them `canceled` forever.

Cyrus's tuition row has the spaced form → status=canceled. Cyrus's lunch row has a clean fingerprint → status=owed. Grant Olowin's tuition has the clean `5-days` form → status=owed.

The fix would be a one-off canonicalizer that rewrites old whitespace-bearing fingerprints in place. Not implementing because canceled rows don't count toward balance — they're harmless visual noise. Revisit only if Tom complains about clutter on affected customer cards.
