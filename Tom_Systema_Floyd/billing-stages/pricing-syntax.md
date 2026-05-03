# Form Pricing Syntax — Systema Floyd

> The convention every billable form option must follow so the billing dashboard auto-tallies it correctly. **Anyone creating or editing a GHL form needs to follow this.**

**Companion docs:**
- [billing-dashboard-plan.md](billing-dashboard-plan.md) — full architecture
- [billing-stages/](billing-stages/) — how the dashboard was built

---

## Quick reference (the rule)

> Every billable form option must use one of these formats:
>
> - `Description ($N)` — one-time charge
> - `Description ($N/week)` — multiplied by weeks selected
> - `Description ($N/day)` — multiplied by days × weeks
>
> Camp Duration options must include `# day(s)` in the label so the per-day multiplier knows the day count. Example: `3 days ($285/week)`.
>
> Free or non-billable options: omit the `$` entirely.

---

## The syntax

| Pattern in option label | Meaning | Math |
|---|---|---|
| `$N` (alone) | Flat one-time charge | `N` |
| `$N/week` | Per-week — multiplies by weeks selected | `N × num_weeks` |
| `$N/day` | Per-day — multiplies by days × weeks | `N × duration_days × num_weeks` |
| `# day` or `# days` *(in any option label)* | Sets the **duration multiplier** | (used by `$N/day` math) |
| No `$` anywhere in the label | Ignored | — |
| `$0` | Logs a $0 line, doesn't add to balance | 0 |

---

## Where the multipliers come from

### `num_weeks`

The count of items selected in the **Camp Dates** field (the multi-week checkbox).

- If the parent picks `Jun 1-5, Jun 8-12, Jul 6-10` → `num_weeks = 3`
- Default `1` if the form has no Camp Dates field

### `duration_days`

The first integer found in any `# day` / `# days` text in any option label of the submission. Typically the Camp Duration field.

- `3 days ($285/week)` → `duration_days = 3`
- `1 day ($125/week)` → `duration_days = 1`
- Default `1` if no `# days` pattern is found anywhere in the submission

---

## Examples

| Form option label | Pattern | Math |
|---|---|---|
| `Jun 1-5 ($350)` | flat | $350 once |
| `T-shirt XL ($25)` | flat | $25 once |
| `Aftercare ($0)` | flat (zero) | $0 |
| `Camp 1-day ($125/week)` | per_week | `$125 × num_weeks` |
| `Camp 3-day ($285/week)` | per_week + sets `duration_days=3` | `$285 × num_weeks` |
| `Pizza ($7.75/day)` | per_day | `$7.75 × duration_days × num_weeks` |
| `Sandwich ($8/day)` | per_day | `$8 × duration_days × num_weeks` |
| `Snack pack ($15/week)` | per_week | `$15 × num_weeks` |
| `Cabin Group A` | no `$` | ignored entirely |

---

## Worked example

Mary submits a form with:

- **Camp Duration:** `3 days ($285/week)` → flat per-week + sets `duration_days = 3`
- **Camp Dates:** `Jun 1-5, Jun 8-12, Jul 6-10` → `num_weeks = 3`
- **Lunch:** `Pizza ($7.75/day)` → per-day
- **T-shirt:** `T-shirt XL ($25)` → flat

| Line item | Pattern | Total cell formula | Total |
|---|---|---|---|
| Camp 3-day | per_week | `=285*3` | $855.00 |
| Pizza | per_day | `=7.75*3*3` | $69.75 |
| T-shirt XL | flat | `=25` | $25.00 |
| | | **Mary owes** | **$924.75** |

Each Total cell holds the literal formula. Click any cell in the dashboard and the formula bar shows exactly how the number was calculated. Auditable, transparent.

---

## What happens if syntax breaks

| Mistake | What the script does |
|---|---|
| `Pizza $7.75/day` (no parens around `$N`) | Regex still matches `$7.75/day` — **works** |
| `Pizza ($7.75 / day)` (space around `/`) | Regex doesn't match `/day` — **billed as flat $7.75** |
| `Pizza ($7.75 per day)` (uses "per") | Regex doesn't match — **billed as flat $7.75** |
| `Pizza (7.75/day)` (no `$`) | Regex doesn't match anything — **ignored entirely** |
| `Pizza ($7.75/hour)` (unsupported unit) | Regex matches `$7.75` but no `/day` or `/week` → **billed as flat $7.75** |
| `Pizza ($7.75/wk)` (abbreviated) | `/wk` not matched — **billed as flat $7.75** |
| `Pizza ($7.75/Day)` (capitalized) | Case-sensitive — **billed as flat $7.75** |

The regex is exact: `/\$(\d+(?:\.\d{2})?)(\/day|\/week)?/`. Items either match the convention precisely, fall back to flat pricing, or get ignored. There's no in-between.

**If something doesn't bill correctly:** check the Logs sheet in the dashboard. If a submission shows `lead_only` status when you expected billing, the regex didn't match anything — fix the form labels to follow the syntax.

---

## Camp Duration field — special handling

The Camp Duration field plays double duty:

1. **It's a flat per-week charge** — each option has a different price for that camp size
2. **It sets the duration multiplier** for any `$N/day` items in the same submission

Standard Camp Duration options:

```
1 day ($125/week)
2 days ($215/week)
3 days ($285/week)
4 days ($335/week)
5 days ($365/week)
```

The leading `# day(s)` is what the script reads to know how many days the kid attends. **Do not** drop the day count from the label.

If you ever offer a "Full Week" option, write it as `5 days ($365/week)` (with the digit) rather than `Full Week ($365/week)` — the script needs the digit to set `duration_days = 5`.

---

## Quick checklist when creating a new form

Before publishing a billable form:

- [ ] Every billable option has `($N)`, `($N/day)`, or `($N/week)` in the label
- [ ] No spaces around the `/` in `/day` or `/week`
- [ ] Free options either omit the `$` entirely or use `($0)`
- [ ] If the form has per-day items (lunch, aftercare): the form also has a Camp Duration field with `# day(s)` in each option
- [ ] If the form has per-week items: the form also has a Camp Dates multi-select field

After publishing:

- [ ] Submit one test entry yourself
- [ ] Within 5 minutes, check the dashboard — your test submission should appear with the correct math
- [ ] If it didn't bill correctly, check the Logs sheet for `lead_only` (no `$` matched) or `failed` (parse error)

---

**Last updated:** 2026-05-03
**Document owner:** Emilio (Nils Digital)
