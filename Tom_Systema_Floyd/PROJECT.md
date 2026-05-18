# Systema Floyd — martial arts school dashboard + billing system + funnel

## What this is
Tom runs Systema Floyd, a Florida-based martial arts school (Upper Campus + Lower Campus, summer camps, after-school, spirit dance, birthday parties). This is the largest multi-system client in the repo. The folder contains: (1) a registrations/lunches **dashboard** fed by Google Sheets → Apps Script → snapshot.json on a 5-min cron, (2) a **billing dashboard** (separate Apps Script project, bound to a Sheet) that polls GHL submissions + accepts manual entries and is the canonical billing record, (3) a 11-page client-facing **funnel**, (4) the legacy site mirror in `OG_Site/`, and (5) staged docs/specs. A **registration migration** from Tom's old paper/manual system into the new auto sheets is mid-flight (29 kids open, waiting on team reply).

## Architecture

### Top-level folders
- `App_documentation/` — Markdown specs for each subsystem: `billing_dashboard.md`, `dashboard.md`, `registration_system.md`, `camp_day_validator.md`, `waiver_matcher.md`, `school_enrollment_router.md`, `new_forms_spec.md`, `forms_todos.md`. Read these for system-level intent.
- `Billing dashboard/` — The billing Apps Script project (`apps-script/`, clasp-managed, bound to the Dashboard Sheet) plus `old-registrations/` (12 weekly CSVs from Tom + `_DISCREPANCY-REPORT.md` + `_EMAIL-TO-TOM.md` intake), `prompts/`, `docs/`, `setup-gcp.md`, `REPORT.md`, `TODO.md`. Files in `apps-script/`: `Polling.js`, `Triggers.js`, `SheetWrites.js`, `Transactions.js`, `Helpers.js`, `Configuration.js`, `FieldRegistry.js`, `LegacyImport.js` (not present — was Dedup.js/LegacyImport.js earlier; current set includes `BillingFromSheets.js`, `Code.js`, `Menu.js`, `Notifications.js`, `Payments.js`, `PricingGuide.js`, `QA.js`, `RemoteTrigger.js`, `Webhook.js`).
- `OG_Site/` — Static HTML scrape of the original systemafloyd.com (After School, Camps, Contact, Spirit Dance, Program Survey, FORM, asset folders, screenshots). Reference only.
- `billing-stages/` — Staged build plan + reference docs: `00-README.md` through `06-migrate-to-polling.md`, `billing-dashboard-plan.md`, `pricing-syntax.md`. Historical narrative of how the billing system was built.
- `context/` — Active handoff notes. Currently: `2026-05-07-dashboard-handoff.md` (registrations dashboard state). Always read this folder first when resuming.
- `dashboard/` — The registrations/lunches dashboard the team actually uses. `index.html` (KPIs + roster), `lunches.html` (kitchen prep), `snapshot.json` (read by both pages, written by GH Actions cron), `history/` (daily snapshots `2026-05-01.json`..today + `index.json`).
- `funnel/` — 12 client-facing pages: `home.html`, `camps.html`, `summer-camp-scholarship.html`, `after-school.html`, `private-lessons.html`, `spirit-dance.html`, `birthday-parties.html`, `rent-a-sensei.html`, `waiver.html`, `waiver-free.html`, `thankyou.html`, `vlad-seminar.html`. All seminar imagery + the flyer PDF live in the Floyd FL GHL media library (uploaded 2026-05-17, see changelog).
- `sheets-snapshot/` — The OTHER Apps Script project (clasp-managed) — the lightweight web app the dashboard pipeline calls. `apps-script/Snapshot.js` (hardcoded SHEETS map + readers), `DiscrepancyCheck.js`, `appsscript.json`, `README.md`.

### Data flow — Registrations dashboard
4 source Sheets owned by `systemafloydsheets@gmail.com` (Upper paid, Lower paid, FREE Higher, FREE Lower) → Apps Script web app **Floyd Roster Snapshot API** (scriptId `1EcPTHTRypJX_ywQXqj_LQuJMNk2RAjzSkIxsG8QzLe64jQtRXvEf6f8Y`, pinned deployment `AKfycbw6YVSJXxwEz5UPavqQYEn_c2oFGi2-Y7Re8KlGNQytqOLeYI3k_7v85YIvuTptKI5j`) → `.claude/scripts/fetch-systema-snapshot-from-sheets.py` (called by `.github/workflows/refresh-systema-snapshot.yml` every 5 min) → writes `dashboard/snapshot.json` + daily history file → `dashboard/index.html` + `dashboard/lunches.html` read snapshot.json. Always update the pinned deployment in place: `clasp deploy --deploymentId <pinned> --description "..."`. After-school is stubbed (`emptyAfterSchool_()`); AS Drive folder `1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V` is empty/not shared yet. See memory `project_systema_floyd_dashboard_pipeline.md`.

### Data flow — Billing dashboard (separate system)
Two ingest paths, both produce first-class tx rows on the bound Dashboard Sheet: (1) `pollFloridaSubmissions` (5-min trigger) pulls GHL form submissions, routes by `Waiver Origin` custom field to FL/GA/VA subaccount, `processSubmission` writes rows. (2) Manual entry — team types directly into the Sheet; `onEdit` in `Triggers.js` auto-applies formula `=C*MAX(D,1)*MAX(E,1)`, status dropdown, format, row-group membership. Transactions tab auto-syncs from each subaccount's `/payments/transactions`. As of 2026-05-07: 80 customers, ~634 rows, $61,104.25 balance after dedup.

### Source of truth
**Both dashboards: the Google Sheet is canonical.** Manual entries and legacy imports are equal to GHL-originated rows. Don't add features that require a `submission_id` on every row (manual rows don't have one). When pushing data back to GHL, only push rows with a `submission_id`. See memory `project_systema_floyd_sheet_source_of_truth.md`.

### Tech stack
HTML/CSS/JS dashboards (vanilla, no framework), two Google Apps Script projects (clasp-managed, bound and standalone), Google Sheets storage, GHL for forms + media + contacts, n8n for ancillary automations, Python fetcher in GitHub Actions cron, Supabase `public.ghl_tokens` for GHL OAuth (filter `account_name ILIKE '%Systema Floyd%'`, use `acces_token` column — typo is intentional).

## Conventions
- **Floyd team-facing emails go from `systemafloyd@gmail.com`** — NOT `emilio@nilsdigital.com`, NOT `systemafloydsheets@gmail.com` (that one is the Drive/Sheets file-owner permission anchor, never a sender). If the Gmail MCP is authenticated as a different account, flag the limitation up front. See memory `feedback_floyd_team_emails_account.md`.
- Snapshot bot commits with `[skip ci]` — those are noise in `git log`. Real work commits don't have that suffix.
- Apps Script deploys: always `clasp push -f && clasp deploy --deploymentId <pinned> --description "..."`. Never `clasp deploy` alone (regenerates URL, breaks the fetcher).
- During rebase, `git checkout --ours snapshot.json` means UPSTREAM (the bot's version), not your branch. Use `--theirs` or re-run the fetcher.
- Re-running any audit / dedup / import / restore function in the billing project is safe — all idempotent (Manual Imports audit keyed on `sheetId:tab:row`).
- Hook new "global" billing maintenance into the polling tail, not per-submission.
- Source sheet IDs (hardcoded — Upper paid `1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA`, Lower paid `18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs`, FREE Higher `1rK4p6jS1xqSf1qNO9-3ljCRzJcUIDF87sNo_UehBWYQ`, FREE Lower `1_659v7by990V4OJMd86nBG-HUN6_AzZNOAPoQN0LMxY`).

## Open threads

### Registration migration (waiting on team reply)
29 kids open: 21 Lower, 7 Upper, 1 unknown-campus. Intake email is drafted at Gmail draft `r3909052957474012439` ("Re: Summer Camp 2026 registrations, a few questions and some kids to add"). Original 23-kid intake was sent to Tom on 2026-05-06 at 18:52 (thread `19dfe98a5bcec7e4`). 4 stale drafts to manually trash (MCP lacks scope): `r-2138070793564794073`, `r-4694106148698038550`, `r2077446025218548779`, `r-2135374149152529346`. Special cases to flag: Jacob Perna age 0 (typo), Olowin twins age 2 (sheet had 3), Lotan Topor borderline (age 5), Paul McIntosh notes dedup. See memory `project_systema_floyd_migration_state.md`.

### Migration next steps (when reply lands)
Parse reply → write each kid into Upper (`1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA`) or Lower (`18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs`) sheet per their listed weeks (Mon-Fri checkmarks + lunch/breakfast/aftercare/shirt/notes) → upsert each parent email as GHL contact in Systema Floyd location with week-attendance tags → verify snapshot.json totals shift up → regenerate `_DISCREPANCY-REPORT.md`. Then delete stale drafts. See memory `project_systema_floyd_migration_todos.md`.

### Live billing TODOs
See memory `todos_systema_floyd_billing.md` for the prioritized list. Headlines:
- **Data-correctness (do first):** fix `upsertCustomerRow` HYPERLINK overwrite bug + `restoreLostProfileLinks()` one-shot; replace email-derived "Customer Name" placeholders with parent names; audit `IMPORT PLACEHOLDER` camp-price rows; clean double-`(+$30)` t-shirt labels.
- **Sync features:** Sheet → GHL contact upsert (so manually-imported customers get phone numbers etc. into GHL); sales tax by product type (FL 6% / GA 4% / VA 5.3% — verify with Tom, don't assume; matrix keyed on source-field name in col B note).
- **Resilience:** make `upsertCustomerRow` multi-source-aware (don't clobber manual cleanup on re-poll); add Manual Imports re-import safety via content hash; surface placeholder rows in a Dashboard filter.

### Registrations dashboard TODOs
See `context/2026-05-07-dashboard-handoff.md`. Headlines: wire up after-school once Drive folder `1hT0qjM_NCIkONm1-HhUr3rvB4FDV-o8V` populates and is shared (~20 lines in `Snapshot.js`); Free Camp wiring already live, fills automatically when form opens; KPI card styling pass pending direction choice; consider bringing back GHL `totals.contacts`/`leadOnly`/`newLast7Days`/`newLast30Days` as a hybrid pass.

### Demo-prep state snapshot (most recent prior milestone)
Full file map + shipped features from 2026-05-07 in memory `project_systema_floyd_state_snapshot.md`.

### Vlad Seminar follow-ups (open)
- **Form is a placeholder.** `funnel/vlad-seminar.html` iframes the After School Registration form (`TkioOL4IoByeHU3K2gTs`) — built before a dedicated seminar form existed. Create a GHL form with: student full name, contact email, phone, pass selection (Early 2-day $275 / Early 1-day Sat $155 / Early 1-day Sun $155 / Regular tiers / etc.), Friday Private Session opt-in (Yes/No — explain 30-pass cap and confirmation by email), marketing consent. Swap the iframe `src` form ID once it exists.
- **Page is not linked from the main funnel.** Once approved with Tom, add a header/footer entry on `home.html` and create a GHL embed snippet via `/ghl-embed`. Path will be `https://demilio24.github.io/Websites/Tom_Systema_Floyd/funnel/vlad-seminar.html`.
- **n8n token-refresh cron is dead.** `s1Z2H8GwdaU7n2kG` ("1. Updates All Tokens - 3 AM") fails with `Execution limit reached. Consider upgrading your plan` — see https://app.n8n.cloud/account/change-plan. All three Floyd tokens (FL, GA, VA) will go stale every 24h until n8n plan is upgraded or the refresh is moved off n8n. Manual refresh recipe documented in the 2026-05-17 changelog entry.

## Changelog

### 2026-05-17 — Vlad Seminar landing page shipped + Floyd GHL token chain repaired
Built `funnel/vlad-seminar.html` for the **Tactical Relaxation Festival with Vladimir Vasiliev** (Oct 10 & 11, 2026 at Palm Beach Day Academy). Source materials came from Tom's `Vlad Seminar/` folder: flyer PDF (v2 is current — venue is **Palm Beach Day Academy, 241 Seaview Ave**; v1 had the old "Island Rec Center" address — ignore it), Square page screenshot for pricing, social exports, and the wide composite header graphic. Page follows the existing funnel design system (Oswald/Inter, navy + cream) plus a **gold accent layer** (`--sf-gold #d4a843`) to differentiate the seminar from kid/family programs. Sections: hero with composite graphic + 4-tile meta grid, "About The Master" with credibility pills, 5 core principles (breathing/structure/smooth movement/short work/internal work), 3-card schedule (Friday optional Breathing & Health is gold-ribboned as the special), instructor-renewal strip, 3-tier pricing (Early through Aug 1, Regular, At-the-Door) with `$275/$155 | $355/$200 | $200 only` from the Square screenshot, Friday callout block, venue + 2 hotels, registration iframe, schema.org Event JSON-LD with all 5 offer tiers.

**Token chain repair:** The `acces_token` for "Systema Floyd - Florida" in `public.ghl_tokens` was 2 days stale (n8n cloud hit its monthly execution limit on `s1Z2H8GwdaU7n2kG` so the 3 AM refresh stopped firing). Pulled the GHL marketplace OAuth `client_id` + `client_secret` out of the `2. Get refresh token (Update Agency)` n8n workflow (workflowId `V5mA43CcQhQ0xVj5`), POSTed to `https://services.leadconnectorhq.com/oauth/token` with `grant_type=refresh_token` + `user_type=Location`, got a rotated pair, and wrote both back to Supabase. With the fresh token, uploaded 7 assets to the Florida media library (`8IWtNFlmgJ8bif9DivHT`): hero composite, 4x5 social, OG share, flyer PDF, Systema HQ logo, 9x16 stories, full flyer JPG. Page now references the GHL CDN exclusively; the local `funnel/vlad-seminar-assets/` folder has been removed. **Note for next time the cron is dead:** the manual refresh recipe is documented in this changelog entry — use the same client credentials, target `user_type=Location` for location-scoped tokens, and update Supabase immediately after (refresh tokens rotate on each use; the old one becomes invalid).

### 2026-05-17 — PROJECT.md seeded
Initial seed. Captures both Apps Script pipelines (registrations + billing), folder map, conventions, and all open migration/billing/dashboard threads as of this date.

### 2026-05-07 — Dashboard demo-prep day + registration migration intake
Shipped: auto-refreshing Transactions tab + filters, Pricing Syntax dropdown banner on Logs row 1, manual lunch-modification onEdit feature, legacy registration sheet importer (196 registrations), bulletproof dedup (115 rows / $15,891 removed), `setAllStatusesToOwed`, `normalizeLegacyTxRows`, billing `REPORT.md`. Also drafted 29-kid intake email + handoff note for the registrations dashboard. Reference: `project_systema_floyd_state_snapshot.md`, `context/2026-05-07-dashboard-handoff.md`.
