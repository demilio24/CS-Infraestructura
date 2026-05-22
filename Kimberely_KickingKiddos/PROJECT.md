# Kicking Kiddos — Private swim lessons (Topeka, KS), full multi-step booking funnel

## What this is
A multi-page booking funnel for Kimberely's "Kicking Kiddos" swim school. Parents land on the marketing home page (`kickingkiddos.html`), register their child, pick a level, and then schedule classes on a per-level scheduling page. All pages hosted on GitHub Pages and embedded inside GoHighLevel via the standard iframe wrapper.

## Architecture
Plain HTML + embedded CSS/JS per page. No build step, no framework. Each page is self-contained (Inter from Google Fonts, all CSS inlined inside `<style>`). Top-of-page sticky "funnel progress bar" appears on the inner funnel pages (Register → Picture Package → Select Your Level → Schedule Classes) to show parents where they are.

Funnel flow:
1. `kickingkiddos.html` — main sales/marketing home page (largest file, ~90KB).
2. `registration.html` — registration form + liability waiver + media release. Back link points to `kickingkiddos.html`.
3. `picture-package.html` — one-time upsell offer (special "picture package").
4. `levels.html` — "Find Your Level" quiz/picker that routes parents to the correct level scheduling page.
5. `level1.html`, `level3.html`, `level4.html`, `level6.html` — per-level scheduling pages (Nemo, etc.). Each carries the active funnel-step bar.
6. `jks.html` — "Just Keep Swimming" continuation/scheduling page (alternative path from levels).
7. `done.html` — final confirmation / wristband-rules screen with a red urgency card and band-rule explainer.

## Conventions
- Design tokens (in `kickingkiddos.html`): `--blue: #0A7EF5`, `--blue-deep: #0557b8`, `--gold: #F5A623`, `--dark: #080d1a`, `--text: #1a1a2e`, `--muted: #64748b`, `--max: 1120px` (funnel pages narrow to 860px). Three-tier shadow stack `--sh1/2/3` plus `--sh-blue` / `--sh-gold` glow shadows. Radii `--r: 16px`, `--r-lg: 24px`, `--r-xl: 32px`.
- Type: Inter 300–900.
- Funnel progress bar markup is duplicated on each inner page; states are `.funnel-step.done` (green check), `.funnel-step.active` (blue, larger), default (muted grey).
- Pages use `.reveal` IntersectionObserver fade-up pattern.
- Hosted on GitHub Pages; embed in GHL using the standard iframe wrapper from the user's global CLAUDE.md.

## Open threads
(none clear)

## Changelog

## 2026-05-18 — Synced local working tree with remote main
Pulled ~3,300 remote commits. No file-level conflicts in this folder; the merge incorporated remote changes cleanly. No structural decisions made here — no code or copy edits this session.

## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.
