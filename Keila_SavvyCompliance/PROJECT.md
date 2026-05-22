# Keila / Savvy Compliance: AML compliance portal and consultation history (Spanish-language)

## What this is
Savvy Compliance is an AML (anti-money-laundering) consultancy run by Keila Mulero. This folder holds the admin portal and a separate AML query history search frontend backed by Supabase + an n8n logger workflow that pulls RiskTech / AMLRISK consultations off the team's n8n executions.

## Architecture
- `portal.html` : main Savvy Compliance admin portal (Spanish, `lang="es"`, tab navigation, Inter)
- `aml-search.html` : standalone AML query history search UI; talks directly to Supabase `risktech_aml_results` via the JS client, supports search / lists explainer / CSV export tabs
- `README.md` : full architecture doc for the AML logging pipeline (n8n workflow `EE5YEALMVbebJlFh` → Supabase project `nroeiabeirifurdaybyo` → frontend). Read this for any AML-pipeline work.
- Tech: HTML + embedded CSS/JS, GitHub Pages, GHL iframe embed (standard pattern across all client funnels in this repo); Supabase JS client from CDN, no build step

## Conventions
- Brand colors: blue `#2563eb` primary, slate text `#1e293b` / `#64748b`, white surfaces with `#e2e8f0` borders
- Font: Inter only
- Locale: `es-PA` (Panamá); Spanish copy throughout
- Container max 1100px (search) / 960px (portal), 44px header logo

## Open threads
- AML search UI is intentionally kept separate from `portal.html`. Do not integrate without explicit confirmation (see README §5).
- After any n8n SDK update, AML logger credentials must be re-attached manually in the UI (README §6).

## Changelog

## 2026-05-18 — Synced local working tree with remote main
Pulled ~3,300 remote commits. No file-level conflicts in this folder; the merge incorporated remote changes cleanly. No structural decisions made here — no code or copy edits this session.

## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state. Full pipeline docs already live in README.md.
