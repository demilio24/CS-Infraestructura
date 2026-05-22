# Summer Camp 2026 — Roster Sync

Reconciles Tom's weekly camp rosters into the Upper and Lower campus Google Sheets and the Florida GHL location, end to end. Originally built to import the May 8 master CSVs Tom sent (12 weeks, 228 raw rows), then extended to add students missed by the master CSVs and remove cancelled-after-the-fact kids. Idempotent — re-running any operation against the same inputs is a no-op.

**Owner:** Tom Floyd (Systema Floyd Martial Arts)
**Operators:** Tom, Juliana (Executive Assistant)
**Built by:** Emilio (Nils Digital)
**State:** Initial sync + delta + GHL upsert all applied. 9 newly-added student rows + Aria Wk12 are yellow-highlighted on the sheets pending team review.

---

## What lives where

| System | ID / URL | Holds |
|---|---|---|
| Upper Campus sheet | `1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA` | Camp roster for kids age 6+, 12 tabs (one per week, named by date range like `6/1-6/5`) |
| Lower Campus sheet | `18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs` | Camp roster for kids age 5 and under, same tab structure + an extra "Is This Student Potty Trained" column |
| Florida GHL location | `JL5Xsreqcpi8naffNZWe` | Parent contacts tagged `Summer Camp 2026` (63 active) |
| Apps Script (this folder) | `1qOGxtunYFN8Y_8o6O7PuyyObNcPZz0lQaoviYh_ZhP7uNTBr1WT7xJUe` | The web app that reads/writes both sheets via tokenized `?op=…` endpoints |

The Apps Script is owned by `systemafloydsheets@gmail.com` (the same automation account that owns the campus sheets), deployed as web app `executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`, guarded by a token query param.

---

## Folder layout

| Path | What's there |
|---|---|
| [`apps-script/`](apps-script/) | Source for the roster-sync web app, cloned via clasp. `Code.js` = logic, `Data.js` = 228 raw CSV rows embedded as JSON, `Delta.js` = curated additions/removals, `appsscript.json` = manifest with web app + executable config. |
| `week1.csv` … `week12.csv` | Per-week clean CSV decoded from Tom's May 8 email. Source of truth for what was in the master CSVs. |
| `contacts_summer_consolidated.csv` | One row per unique (Parent Email, Student Name) across all 12 weeks. 89 rows. |
| `contacts_summer_by_parent.csv` | One row per unique parent email with all kids + weeks aggregated. 61 rows. The seed list for the GHL upsert. |
| `APPLY_PLAN.md` | Full pre-apply dry-run report: every name + email + target tab, with self-check that no planned-new key matched a skipped-already-present key. |
| `GAP_REPORT.md` | Findings from the email + form-image sweep — 9 missing students, 4 SKIP/cancelled conflicts, 1 missing-week entry (Aria Wk12). |
| `verify_highlights.json` | Per-tab list of every yellow-highlighted Student Name cell. Use this to drive the team's review pass. |
| `ghl_upsert_report.json` | Result of the initial 61-parent upsert (all created net-new). |
| `ghl_delta_report.json` | Result of the delta: 5 new parents upserted, 3 cancelled-only-child parents deleted. |
| `DRAFT_email.md` | The "Hi team" email asking the team to review yellow rows. Mirror of the Gmail Draft. |

---

## How the sync ran

1. **Pull CSVs** — n8n workflow `Gmail to Drive and GHL: Search and Save Attachments` (id `0L1NeAQaAoK4wref`) downloaded all 12 attachments to a Drive subfolder + GHL media library.
2. **Consolidate** — `.claude/scratch/consolidate_summer.py` decoded base64, normalized Week 1's different schema (`Group`/`Duration` vs `Weeks Attending`), and produced the per-week CSVs + the two consolidated views.
3. **Apply to sheets** — Apps Script `applyContacts({apply:true})` walked each week's CSV rows, dedup'd against existing tab content by `lower(StudentName) | lower(Email)`, appended missing rows, and yellow-highlighted the Student Name cell (`#fff475`).
4. **Upsert parents to GHL** — `.claude/scratch/ghl_upsert_parents.py` POSTed each unique parent email to `/contacts/upsert` with tag `Summer Camp 2026`. (Note: requires browser User-Agent — Cloudflare 1010-blocks the default Python UA.)
5. **Email + form-image sweep** — re-ran the n8n workflow for `from:systemafloyd@gmail.com newer_than:7d has:attachment` to grab every recent registration screenshot. Drive `read_file_content` OCR'd 16 images. Cross-referenced every form against the consolidated CSV → 9 missing students surfaced.
6. **Delta apply** — extended `Code.js` with `applyDelta({apply:true})` driven by `Delta.js`'s `NEW_STUDENTS` (10 rows) and `SKIP_STUDENTS` (4 rows). 9 added (yellow), 13 removed.
7. **Delta GHL** — `.claude/scratch/ghl_delta.py` upserted 5 new parents, deleted 3 cancelled-only-child parents.

## How to re-run

Web app endpoints (token at the top of `Code.js`):

```
GET .../exec?token=<SECRET>&op=tabs           # list every tab + row count for both sheets
GET .../exec?token=<SECRET>&op=dryrun         # what would the May 8 master sync add/skip
GET .../exec?token=<SECRET>&op=apply          # actually run the master sync (idempotent)
GET .../exec?token=<SECRET>&op=delta_dryrun   # what would the delta add/remove
GET .../exec?token=<SECRET>&op=delta_apply    # actually run the delta (idempotent)
GET .../exec?token=<SECRET>&op=verify         # count yellow-highlighted Student Name cells per tab
```

To edit the script:

```
cd "Tom_Systema_Floyd/Summer-2026-rosters/apps-script"
# ... edit files ...
npx --yes @google/clasp@latest push --force
npx --yes @google/clasp@latest deploy --description "v<n> <description>"
```

The first time the script ever needs a new OAuth scope, the owner (`systemafloydsheets@gmail.com`) must hit Run once in the Apps Script editor and approve the consent dialog. After that, anonymous web app calls work.

To regenerate `Data.js` from local per-week CSVs (e.g., if Tom sends new ones):

```
python .claude/scratch/build_appscript_data.py
```

To regenerate `Delta.js`, hand-edit it — it's a curated list, not auto-derived.

---

## Pricing-syntax convention (matters for the billing dashboard)

Every billable field on the new rows follows the regex from [`../Billing dashboard/docs/pricing-syntax.md`](../Billing%20dashboard/docs/pricing-syntax.md):

- Per-day items: `$N/day`, e.g. `Pizza ($7.75/day)`, `Before care ($20/day)`, `Aftercare ($25/day)`
- Per-week items: `$N/week`, e.g. `Pizza ($30/week)`, `Aftercare Weekly ($175/week)`
- No spaces around the slash, no "per day" wording — the regex is exact

If you add new entries to `Delta.js`, follow this convention so the billing dashboard picks them up automatically.

---

## Campus assignment rule

Used both during the master sync and in `Delta.js` `campus` fields:

1. Week 1 CSV `Group` column wins (Upper / Lower / Mini → Upper / Lower / Lower)
2. Else `Additional Notes` containing "Upper Campus" or "Lower Campus" wins
3. Else age ≥ 6 → Upper, age < 6 → Lower (age unknown → Lower)

For sibling pairs at age boundaries, this can land them on different campuses (e.g., Liam McPherson age 6 → Upper; Luke McPherson age 5 → Lower).

---

## Open follow-ups

- [ ] Team to review the **yellow-highlighted Student Name cells** on both sheets, fix any wrong-campus / wrong-week placements, and clear the highlight once confirmed
- [ ] Fill in Mon-Fri attendance for the 3 partial-week kids without specified days: Liam McPherson (Wk8), Luke McPherson (Wk8), Anna McIntosh (Wk2)
- [ ] If new registration forms come in: re-run the n8n workflow for the relevant date range, OCR any new screenshots, then add to `Delta.js` `NEW_STUDENTS` and run `?op=delta_apply`

---

**Document owner:** Emilio (Nils Digital)
**Last updated:** 2026-05-08
