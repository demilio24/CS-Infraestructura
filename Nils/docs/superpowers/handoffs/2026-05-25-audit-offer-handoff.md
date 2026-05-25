# Handoff: The 14-Day Audit offer + sample blueprint deliverable

**Date:** 2026-05-25
**Author:** Claude (Opus 4.7, 1M context) with Emilio
**Status:** Shipped and live on GitHub Pages
**Next session:** Anyone resuming sales work, deck revisions, or deliverable iteration

---

## TL;DR

Nils Digital launched a new productized offer this session: a **$3,000, 14-day technical audit** that produces a build-ready architecture and execution plan. Three assets were built and shipped:

1. **The pitch deck** (HTML slide deck for selling the audit)
2. **A polished sample deliverable** (HTML long-read styled doc shown to prospects so they see exactly what they receive)
3. **A markdown version of the deliverable** (for pasting into Google Docs)

All three are live on GitHub Pages and pushed to `main`.

---

## Live URLs

| Asset | URL |
|---|---|
| **Pitch deck** | https://demilio24.github.io/Websites/Nils/presentation-audit.html |
| **Sample blueprint (HTML, prospect-facing)** | https://demilio24.github.io/Websites/Nils/sample-blueprint-systema-floyd.html |
| **Sample blueprint (Markdown, Google Docs paste)** | https://github.com/demilio24/Websites/blob/main/Nils/sample-blueprint-systema-floyd.md |

---

## Files

| Path | What it is |
|---|---|
| [Nils/presentation-audit.html](../../../presentation-audit.html) | 7-slide audit pitch deck, sibling to `presentation.html`, EN/ES toggle |
| [Nils/sample-blueprint-systema-floyd.html](../../../sample-blueprint-systema-floyd.html) | Polished long-read deliverable, editorial style, tech-detail dropdowns |
| [Nils/sample-blueprint-systema-floyd.md](../../../sample-blueprint-systema-floyd.md) | Markdown version of the same deliverable |
| `.claude/shot-audit-deck.js` | Screenshot script: 3 viewports × 2 langs × 7 slides for the pitch deck |
| `.claude/shot-blueprint.js` | Screenshot script: 3 viewports × 7 page sections for the blueprint |
| `.claude/shot-blueprint-tech.js` | Focused screenshot of the tech-dropdown open state |

---

## The offer at a glance

| Dimension | Value |
|---|---|
| **Price** | $3,000 (one-time payment) |
| **Timeline** | 14 days |
| **Phases** | 5 (Kickoff → Deep Dive → Architecture → Blueprint Build → Strategy Walkthrough) |
| **Credit toward future build** | None, fully standalone deliverable |
| **Audience** | Both SMB owners with messy ops + founders who got burned by half-built tools |
| **CTAs** | Hero + Investment slides route to `https://nilsdigital.com/client` |
| **Trust signals** | "100+ Audits delivered" + 5-star Trustpilot pill under hero CTA |
| **Languages** | English + Spanish (manual Latin American translation, no auto-translate) |

---

## Pitch deck spec (`presentation-audit.html`)

**7 slides:**

1. Hero ("The first step towards automation isn't tools. It's an automation blueprint")
2. Problem (tools without a plan never work)
3. Metaphor → transition to offer (surgeon doesn't operate without diagnosis)
4. The Offer (14-Day Audit, deliverable = single document with every step / integration / automation / code node / decision)
5. The Process (5-phase timeline: Days 1-2 Kickoff, 3-4 Deep Dive, 5-9 Architecture, 10-12 Blueprint Build, Day 14 Walkthrough)
6. Questions (4 Q&As)
7. Investment ($3,000, 14 days, bullets, CTA)

**Visual:** Sibling to `Nils/presentation.html` (blue glassmorphism, Google Sans + DM Sans + Instrument Sans, glass orbs, same chrome).

**EN/ES toggle:** Top-right pill. Selection persists via `localStorage` under key `nils-audit-deck-lang`. Translation map lives in the inline `<script>` as a single `i18n = { en: {...}, es: {...} }` object keyed by `data-i18n` attrs on translatable elements. Even the "Q:" prefix on question cards swaps to "P:" in Spanish via `[lang="es"] .qa-card__q::before { content: "P"; }`.

**Verified visually at:**
- 1920 × 1080 desktop
- 1440 × 900 desktop
- 390 × 844 mobile
- Both EN and ES

**Voice source:** Extracted from `Nils/funnel/automation-vsl-funnel-direct.html` (the existing Nils-authored automation funnel where the audit pitch was already partially written as embedded sections).

---

## Sample blueprint deliverable spec

### HTML version (`sample-blueprint-systema-floyd.html`)

Polished, editorial long-read styled to be **less intimidating for non-technical buyers** while still containing the depth a developer needs to quote a build.

**11 sections:**

1. Executive Summary (with stats: 70+ Locations / 7,000+ Active monthly students / 8 Distinct programs)
2. Current-State Diagnosis (the "before" picture, 6 fragmented surfaces, 15–25 hrs/wk leakage, 6 specific data risks)
3. Target-State Architecture (component table + boxes-and-arrows diagram + failsafe pattern)
4. Component Specifications (8 subsystems, each with an "+ Implementation details" dropdown)
5. Tool Stack & Rationale
6. Data Model
7. Build Sequence (6 phases / 12 weeks, each independently shippable)
8. Decision Log (7 key architectural choices with tradeoffs)
9. Risk Register (12 risks, each with mitigation, color-coded pills)
10. Out of Scope
11. Appendices (glossary, monthly tool cost, operator runbook index)

**Visual:**
- Warm off-white background (`#fbfaf7`) so it reads like a document, not a software screen
- Instrument Serif italic display headings (Stripe / Notion editorial vibe)
- Sticky sidebar TOC with scroll-spy on desktop, collapses to a card on mobile
- Stat callouts (big blue serif numbers with small labels)
- Phase cards with numbered circles + italic goal lines
- Decision cards with blue left-border
- Risk pills color-coded (Low / Medium / High)
- Footer CTA card on dark navy with blue button routing to the booking page

**Tech-detail dropdowns:** Each of the 8 component cards has a collapsed `<details class="tech">` block with "Implementation details" content for technical readers. Includes triggers, file lists, schemas, fingerprint formats, row lifecycle state diagrams, sales tax matrix, recovery RPCs, GHL custom-field conventions, slug-to-file maps. Collapsed by default so prospects can skim cleanly.

**Em-dashes:** Zero. Verified by grep.

**Scrubbed for prospect use:**
- No internal Nils notes
- No exact billing balances
- No script IDs / OAuth tokens
- No GHL location IDs
- No in-flight changelog references

**Framed as:** "The plan delivered on Day 14" before any build work begins. Reads as the actual output of a 14-day audit, not a marketing document.

### Markdown version (`sample-blueprint-systema-floyd.md`)

Same content, markdown format. Best path to Google Docs:
- Open the file in any markdown viewer, select all, copy, paste into a blank Doc. Headings, tables, and bullets translate cleanly. ASCII diagrams paste as monospace code blocks.
- For a polished .docx: `pandoc sample-blueprint-systema-floyd.md -o sample-blueprint-systema-floyd.docx`, then upload to Drive.

---

## Open follow-ups

### 1. Section 2.1 detail table inconsistency

**Status:** Awaiting Emilio's call.

The executive summary stats row was updated mid-session from per-campus numbers (2 campuses / ~120 students / ~80 households) to network-wide (70+ Locations / 7,000+ Active monthly students / 8 Distinct programs). **Section 2.1 "The shape of the operation" further down the page still has the smaller per-campus numbers** plus related details (5+ partner schools, $250k-$500k annual revenue estimate, ~7 instructors).

**Two options offered to Emilio:**

1. **Scale §2.1 up to network-wide** — internally consistent. Lose the granular "this is one campus" texture.
2. **Keep §2.1 as "the Florida operation we audited"** — frames the doc as "network-wide context + one campus we went deep on." Preserves the realism but requires a one-line edit at the top of §2.1 to introduce the framing.

He has not picked yet. If you're picking this up cold, ask which way to go before editing.

### 2. Refund / guarantee language

**Status:** Not currently on the audit deck.

The existing automation funnel (`Nils/funnel/automation-vsl-funnel-direct.html`) carries a "7-day money-back guarantee — Love the blueprint, or don't pay" plus "You keep the blueprint either way" pattern. This was deliberately omitted from the audit deck for simplicity, but it's a strong conversion lever if booking lags.

If you add it back, the natural slot is either as a 4th bullet on the Investment slide or as a sub-line under the price.

### 3. CTA destination

**Status:** Both audit deck CTAs and the blueprint footer CTA route to `https://nilsdigital.com/client`.

If a dedicated audit-call calendar gets created (separate from the existing client portal), swap:
- 2 hrefs in `presentation-audit.html` (hero CTA + Investment slide CTA)
- 1 href in `sample-blueprint-systema-floyd.html` (footer CTA)

---

## How to resume

### Edit the pitch deck copy

Open [Nils/presentation-audit.html](../../../presentation-audit.html). Translations live in the inline `<script>` as `i18n = { en: {...}, es: {...} }` keyed by `data-i18n` attributes. To change a string: find its key in the `data-i18n="..."` attribute on the HTML element, then update both `i18n.en[key]` and `i18n.es[key]` in the script.

For a new translatable element: add `data-i18n="some.key"` to the element and add `"some.key": "..."` to both language objects.

### Verify the pitch deck visually

Default (3 viewports × 2 langs × 7 slides = 42 screenshots):
```bash
node .claude/shot-audit-deck.js
```

Single viewport:
```bash
W=1920 node .claude/shot-audit-deck.js
```

Output: `.claude/screenshots/audit-{viewport}-{lang}-slide{N}.png`

### Edit the blueprint copy or structure

Open [Nils/sample-blueprint-systema-floyd.html](../../../sample-blueprint-systema-floyd.html). Tech-detail content for each component sits inside a `<details class="tech">` block at the end of each `.component` div. Add new tech detail by following the existing `<h5>` / `<ul>` / `<pre><code>` pattern inside `.tech-body`.

To add a tech dropdown to a NEW section (Tool Stack, Build Sequence, etc.), copy the existing `<details class="tech">` template, drop it where you want it, and the CSS will pick it up automatically.

### Verify the blueprint visually

```bash
node .claude/shot-blueprint.js
```

Captures 3 viewports × 7 page sections = 21 screenshots. Output: `.claude/screenshots/blueprint-{viewport}-{section}.png`.

For the tech-dropdown open state specifically:
```bash
node .claude/shot-blueprint-tech.js
```

Output: `.claude/screenshots/blueprint-tech-{closed,open}.png`

### Edit the markdown version

Open [Nils/sample-blueprint-systema-floyd.md](../../../sample-blueprint-systema-floyd.md). Keep parity with the HTML version when copy changes.

---

## Commits in this work track

```
7594f3bf  Nils blueprint: scale up exec summary stats to 70+ locations / 7,000+ students
8c3661b0  Nils blueprint: tech-detail dropdowns inside each component
90a43d23  Nils blueprint: remove cover note and the cost mention in Tool Stack H2
86e7cda5  Nils: prospect-facing HTML version of the sample blueprint
64e97995  Nils: sample audit deliverable for prospect-facing use (.md version)
ae3d7955  Nils audit deck: price $1,400 → $3,000, ES slide 5 headline tightened
95226820  Nils audit deck: center fix, hero proof bar, mobile scroll
6f84f97b  Nils audit deck: cap all headlines at 3 lines max
1ca95138  Nils: 14-Day Audit pitch deck (presentation-audit.html) + EN/ES toggle
```

---

## Quick wins for the next session

If you have 30 minutes and want to keep moving:

1. Resolve the §2.1 stats inconsistency (one of the two options above)
2. Add the refund/guarantee language to the Investment slide
3. Record a 2-minute Loom walking through the pitch deck for Emilio to attach to outbound emails

If you have 2 hours:

4. Build a second example deliverable (different vertical, e.g., dental office or insurance agency) so the same `sample-blueprint-*.html` template can serve multiple prospect types
5. Add a "Book your audit" embedded calendar slot inside the deck itself so prospects can book without leaving
6. Write a 1-page printed handout version of the deck for in-person sales meetings (PDF, generated from the existing HTML)

---

## Memory references

These auto-memories are most relevant to this work track:

- `feedback_no_emdashes` — house style rule (no em-dashes in client-facing copy)
- `feedback_section_variations` — produce 2-4 variations of every section so user picks
- `feedback_one_sentence_per_line` — desktop typography rule
- `feedback_screenshot_max_2000px` — screenshot dimension cap

---

**End of handoff.**

If you're picking this up cold, the highest-value first action is to read this doc top to bottom, then open the three live URLs and click through them. Everything else flows from understanding what was shipped.
