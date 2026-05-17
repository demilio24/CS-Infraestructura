# Systema Floyd registrations dashboard — session handoff

_Snapshot for picking up the registrations + lunches dashboard work in a future session. Persistent architecture lives in `~/.claude/.../project_systema_floyd_dashboard_pipeline.md`; this file is the temporary "where we left off" + to-dos. Update or replace as work progresses._

## Where we left off (last shipped on `e374b58`)

- Sheets-as-source-of-truth pipeline is live: 4 sheets owned by `systemafloydsheets@gmail.com` → Apps Script web app → `dashboard/snapshot.json` (5-min cron) → `dashboard/index.html` + `dashboard/lunches.html`.
- KPIs read 92 unique kids / 183 student-week enrollments / 59% occupancy on Summer Camp tab.
- Roster panel is always open with live multi-term name search.
- Mobile nav: filter row stacks vertically, tabs scroll horizontally instead of wrapping.
- Lunches view at `dashboard/lunches.html` — per-week tables grouped by Pizza / Celis specialty / None / Other with day-by-day counts.
- New unified dashboard nav (Pages | Sheets | Docs) replaces the old chip strip; clean `.dash-header` (logo + "DASHBOARD") replaces the broken-looking `.sf-strip` clip-path divider.

## Open to-dos (pick up here)

### Soon

- [ ] **After-school wire-up.** AS sheets are expected in Drive folder `1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V`. Once they exist:
  - Add IDs to `SHEETS` in [Snapshot.js](../sheets-snapshot/apps-script/Snapshot.js).
  - Write `readAfterSchoolSheet_()` to extract per-program / per-day enrollments.
  - Replace the `emptyAfterSchool_()` stub in `buildSnapshot()` with real aggregation.
  - Push + redeploy with `clasp push -f && clasp deploy --deploymentId AKfycbw6YVSJXxwEz5UPavqQYEn_c2oFGi2-Y7Re8KlGNQytqOLeYI3k_7v85YIvuTptKI5j --description "v8: AS"`.
  - The AS folder is currently not shared with `emilio@nilsdigital.com`; either share the folder once or drop sheet IDs into chat for me to wire up.
- [ ] **Free Camp data appearing.** Wiring is live and ready. Once Tom's free-camp form opens and submissions populate the FREE Higher / FREE Lower sheets, the Free Camp tab will fill automatically. No code change required. Watch the byCampus + byWeek numbers light up.
- [ ] **KPI card styling pass.** User asked for visual improvements to Unique Students / Upper / Lower / Top Week cards. Last open question (unanswered before pivoting to lunches): pick a direction A) per-card color accents · B) icons · C) stronger hierarchy + sparklines · D) all three · E) describe.

### Nice-to-have, parked

- [ ] **GHL totals back?** `totals.contacts`, `leadOnly`, `newLast7Days`, `newLast30Days` are zeroed since we moved off GHL as the data source. If the dashboard's lead-funnel KPIs need to come back, add a hybrid GHL pass to the Python fetcher that merges those four fields only.
- [ ] **Quick-links scroll affordance.** On 1440px the last "Sheet Access" doc link is right at the visual edge. Could add a fade gradient on the right when the nav scrolls.
- [ ] **AS-tab work in `index.html`.** Was un-pushed at session start (per session-context). Status: still part of a working tree change at the time of the nav-redesign commit, so it likely got bundled into recent commits. Verify if there's anything still un-shipped before considering this done.
- [ ] **Lunches icon.** The current `<svg>` for the Lunches nav link is a stylized chafing-dish dome — fine but a "utensils" or "plate" icon would read clearer.

### Reference

- Apps Script editor: https://script.google.com/d/1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y/edit
- Web app endpoint (pinned, do not regenerate): `https://script.google.com/macros/s/AKfycbw6YVSJXxwEz5UPavqQYEn_c2oFGi2-Y7Re8KlGNQytqOLeYI3k_7v85YIvuTptKI5j/exec`
- Live registrations dashboard: https://demilio24.github.io/Websites/Tom_Systema_Floyd/dashboard/
- Live lunches view: https://demilio24.github.io/Websites/Tom_Systema_Floyd/dashboard/lunches.html
- Source sheets quick map (also hardcoded in `Snapshot.js`):
  - Upper Campus paid: `1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA`
  - Lower Campus paid: `18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs`
  - FREE Higher Campus: `1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ`
  - FREE Lower Campus: `1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY`
- After-school folder (pending): `1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V`
- Cron workflow: [.github/workflows/refresh-systema-snapshot.yml](../../.github/workflows/refresh-systema-snapshot.yml)
- Python fetcher: [.claude/scripts/fetch-systema-snapshot-from-sheets.py](../../.claude/scripts/fetch-systema-snapshot-from-sheets.py)

### Comms reminders

- Team-facing Floyd emails should be sent **from `systemafloyd@gmail.com`**, not from `emilio@nilsdigital.com` and not from the `systemafloydsheets@gmail.com` permission-anchor account. Last update email was drafted in emilio's inbox (draft `r501278789631719593`) because the Gmail MCP isn't yet swapped to the team account.
- Existing Tom-facing draft from this session is `r501278789631719593` (subject: "Camp dashboard update"); previous superseded draft was `r7539209170403299208`.
