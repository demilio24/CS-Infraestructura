# Nils Digital — Our own funnels (Automation audit + Marketing/Quiz/VSL)

## What this is
Nils Digital's own lead-generation funnels — the pages we use to sell our services. Split into two product lines, each with a VSL-style sales page designed to be embedded directly inside our own GoHighLevel funnel.

## Architecture
Plain HTML + embedded CSS/JS per page. Every file is built as a GHL "direct embed" — opens with `<meta>`, structured-data JSON-LD, Microsoft Clarity snippet, then a `html, body { overflow:hidden }` reset and a `#ghl-breakout` `position:fixed; width:100vw; height:100vh` wrapper that escapes GHL's nested containers (see global CLAUDE.md for the pattern).

```
NILS-FUNNELS/
├── Automation/
│   ├── automation-vsl-direct-bg-matrix.html   ← canonical (per project memory: matrix-bg green-theme variant)
│   ├── automation-vsl-direct.html             ← earlier base variant
│   └── featured-review-variations.html        ← standalone design-exploration page for "featured review" card variants (green palette)
└── Marketing/
    ├── nils-vsl-fast-direct.html              ← marketing/Google-Ads VSL (DM Sans + Google Sans + Instrument Sans)
    └── nils-quiz-fast-direct.html             ← quiz funnel front-end variant
```

### Automation/
The Automation product is "AI & Automation Audits for Service Businesses." `automation-vsl-direct-bg-matrix.html` is the canonical live page (matches the project memory note: green theme using `--blue*` token names that hold green values, sections 1-2 dark, 3-10 light via `.theme-light`). Uses IBM Plex Sans + Inter. Structured data declares ProfessionalService, Chicago IL, 5.0 / 200 reviews. Microsoft Clarity ID: `wkemyhll14`.

### Marketing/
The Marketing product is the Google Ads / website agency offer. Both pages are direct-embed VSLs sharing the same GHL breakout pattern, Google Sans + DM Sans + Instrument Sans typography.

## Conventions
- All files are designed to be pasted into a GHL custom-code element; they assume they will be rendered inside GHL's chrome and use a fixed full-viewport wrapper to escape it.
- Brand: Chicago, IL. 200+ businesses served. 5★ Trustpilot.
- Tokens named `--blue*` may carry green values (Automation page) — don't rename them; n8n/GHL references depend on the names.
- Microsoft Clarity snippet embedded in production pages (project IDs per file).

## Open threads
(none clear)

## Changelog
## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.
