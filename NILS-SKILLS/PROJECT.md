# Nils Digital — Internal content/strategy workspace (Instagram dashboard + research docs + transcriptions)

## What this is
Nils Digital's own back-office for content + strategy. Not a client site. Three pieces:
1. A self-contained Instagram Reels analytics dashboard (`dashboard.html`) comparing nilsdigital's reels to a configurable list of competitor accounts.
2. Markdown research/planning docs — competitor Reels research and a 30-day content calendar.
3. Raw transcriptions of our own VSLs and dictated content (`Transcriptions/`).

## Architecture
No backend. The dashboard is a single self-contained HTML file with all data inlined as a `var DATA = {...}` JSON blob in a `<script>` tag — refreshed by replacing that blob (likely from an n8n workflow that scrapes Instagram and writes the file).

Files:
- `dashboard.html` — Instagram Reels dashboard. Renders KPIs (posts, total/avg views, likes, comments, avg engagement, avg duration), a 91-day activity grid (GitHub-contributions style colored by daily views), competitor toggle bar (`badmarketing`, `funnelslayer`, `hookagency`, `kickchargecreative`, etc.), per-reel table with hook/views/engagement, and a date-range filter. Mobile-responsive. Embedded data has the "snapshot date" baked in (`DATA.date`).
- `instagram-reels-research-report.md` — March 2026 research on what's working on Reels for agency owners. Tiered creator list (Hormozi/Gadzhi → Saraev/Morgan/Gatari/Platten/McDowell), editing/hook patterns to copy.
- `nils-digital-30-day-content-calendar.md` — 30-day Reels calendar for nilsdigital, split into three pillars (Mechanism 40%, Proof 35%, Identity 25%) with day-by-day hooks + CTA types + scripts.
- `Transcriptions/` — `.txt` transcriptions of our reels and VSLs (numbered `2.mp4.txt` through `12.mp4.txt`, plus `Video Sales Letter.txt`, `VSL - Review Filtering System VSL.mp4.txt`, and `Typeless - me dictating.txt` for raw dictation).

## Conventions
- Dashboard design tokens: GitHub-ish neutral palette — `--bg:#ffffff`, `--surface:#f9fafb`, `--text:#111827`, `--muted:#6b7280`, `--blue:#3b82f6`, `--green:#22c55e`, `--red:#ef4444`, `--yellow:#eab308`, `--radius:10px`.
- Type: Instrument Sans (Google Fonts).
- iOS auto-zoom guard on form fields (`font-size: 16px !important` at ≤768px).
- Data refresh model: regenerate `var DATA = {...}` inside `dashboard.html` from upstream scraper; everything else is static.

## Open threads
(none clear — internal tooling, refreshed on demand)

## Changelog
## 2026-06-01 — Fixed the Refresh Dashboard CI (two bugs in series)
The dashboard is refreshed by a **GitHub Actions** workflow, not n8n: `.github/workflows/refresh-dashboard.yml` runs `NILS-SKILLS/.claude/scrape-dashboard.js` (Apify, `--limit 15`) every Monday 13:00 UTC, then commits `dashboard.html` + `.claude/dashboard-data/` + `.claude/reports/` back to main. It had failed **every weekly run since late March**. Root cause was two stacked bugs:
1. A repo-wide `.gitignore` rule `*/.claude/` (added after the data dirs were first committed in March) silently re-ignored the new snapshots. Under `bash -e`, `git add` of the ignored paths exited 1 → step failed before it ever reached push. Fixed by un-ignoring only `NILS-SKILLS/.claude/dashboard-data/` and `/reports/` (negation block in root `.gitignore`); all other per-project `.claude/` state stays ignored.
2. Fixing #1 exposed a 403 at `git push` — default `GITHUB_TOKEN` is read-only. Added `permissions: contents: write` to the workflow.
Also bumped `actions/checkout` and `actions/setup-node` to `@v5` (Node 24) ahead of the 2026-06-16 Node 20 deprecation. Verified green end-to-end via manual `workflow_dispatch` (run 26779498988); the bot's `Auto-refresh dashboard data 2026-06-01` commit landed on main.

## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.
