# Open follow-ups — run in order

> Five focused prompts to ship the Systema Floyd Billing Dashboard. Run them one at a time, in this exact order.

| # | File | What it does |
|---|---|---|
| 1 | [1-fix-stacked-row-groups.md](1-fix-stacked-row-groups.md) | Make `applyRowGrouping` idempotent + reset groups before any rebuild. Stops the stacked +/- gutter controls. |
| 2 | [2-phantom-rows-trace.md](2-phantom-rows-trace.md) | Un-truncate Logs raw_payload, add per-iteration trace logging, identify the field producing `item="1"` rows, apply targeted fix. |
| 3 | [3-fix-waiver-origin.md](3-fix-waiver-origin.md) | Diagnose what the Waiver Origin field is actually called per subaccount; add alias-based lookup so col D populates. |
| 4 | [4-status-chips-and-qa-count.md](4-status-chips-and-qa-count.md) | Confirm status cells render as colored chips; figure out why 5 new C_pmsv tests aren't being counted in `runFullQA`. |
| 5 | [5-final-acceptance.md](5-final-acceptance.md) | End-to-end sign-off: live test forms per state, manual balance spot-check, bulk-menu test, runFullQA pass, PRODUCTION-READY gate. |

## Two ways to run each prompt

### A. Local (recommended) — Claude Code + clasp

The Apps Script project is now cloned into [`../apps-script/`](../apps-script/). Hand the prompt to Claude Code and it edits the local files directly, then `clasp push` syncs to the cloud. Faster iteration, no Chrome extension content-filter blocks, full git versioning.

### B. Chrome extension (legacy)

Each prompt's body is still written as a paste-and-run block for the Chrome extension if you'd rather work in the browser:

```
1. Open the file
2. Copy the prompt block (between the ```` fences)
3. Paste into a fresh Claude Chrome extension tab
4. Let it run
5. Paste its report back into chat for review
6. Move to the next file
```

After **5-final-acceptance.md** signs off PRODUCTION-READY, the build is done.
