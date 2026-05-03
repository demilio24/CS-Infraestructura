# Design: Nils-Quiz-Fast-Direct funnel page

**Date:** 2026-04-24
**Author:** emilio@nilsdigital.com
**Status:** Approved for implementation

## Goal

Create a quiz-led variant of the existing `nils-vsl-fast.html` funnel page. The quiz becomes the primary hero element. The VSL moves below the hero into its own section. Every quiz path leads to the calendar booking widget — no qualification gating (the "-direct" in the filename signals this).

Page name in the funnel directory: **Nils-Quiz-Fast-Direct**.
File path: `F:/GitHub/Websites/Nils/funnel/nils-quiz-fast-direct.html`.

## Source of truth

Base file: `F:/GitHub/Websites/Nils/funnel/nils-vsl-fast.html`. The new file is a copy of this base with structural changes outlined below. All design tokens, fonts, colors, animations, and shared components (HVP video player, FAQ accordion, case studies, footer, fire-badge tooltips) are reused unchanged.

## Page structure (top to bottom)

1. Hero — quiz-led (rebuilt)
2. VSL section — relocated from hero, otherwise unchanged markup
3. Case studies — unchanged
4. "How it works" — unchanged
5. FAQ — unchanged
6. Footer — unchanged

The existing `#apply-modal` is removed entirely; the quiz now lives inline in the hero.

## Section 1: Hero

Background, gradient, dot grid, and arc decorations stay identical to the current hero.

**Removed from hero (vs. `nils-vsl-fast.html`):**
- `hero-split` block (video + side proof column)
- `hero-cta-wrap` (the "Apply Now" button and disclaimer)
- The `hvp` video player markup (relocates to the VSL section)
- The 3-stat `hero-proof-col` (condensed into a single trust micro-line under the quiz card)

**New hero contents (in order):**
- Eyebrow: `FREE STRATEGY CALL · 60-SECOND QUALIFIER` (uses existing `.hero-eyebrow` class)
- Headline (uses `.hero-h1`): "Find out if Google Ads will work for **your business**." The phrase "your business" is bolded inline; do not use `.fire-text` here (that class carries a tooltip behavior that doesn't apply).
- Subhead (uses `.hero-sub`): "Answer 4 quick questions to see if you qualify for a free strategy call."
- Quiz card (new `.quiz-hero-card` wrapper, see Section 3)
- Trust micro-line below the card: "Takes 60 seconds · 200+ businesses served · 5.0 on Trustpilot" — small, white, low-opacity text. No new styles needed; reuses the existing `.hero-disclaimer` style.

## Section 2: Quiz card

A new white rounded card sitting on the dark blue hero background. Wrapper class: `.quiz-hero-card`.

**Styling (added to the existing `<style>` block, near the modal/survey styles):**
- `max-width: 620px`
- `margin: 32px auto 24px`
- `background: #fff`
- `border-radius: 24px`
- `padding: 36px 32px`
- `box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)`
- Mobile (≤ 640px): `padding: 24px 20px; border-radius: 20px; margin-inline: 16px`

**Inside the card:** reuse the existing `.survey-progress`, `.survey-bar`, `.survey-fill`, `.survey-step-lbl`, `.survey-step`, `.survey-q`, `.survey-hint`, `.survey-opts`, `.survey-opt`, `.survey-check`, `.survey-back` classes — they already render correctly on a white surface (they were designed for the modal-box, which is also white).

The progress bar uses the existing 5-step framing (Q1 → Q2 → Q3 → Q4 → Calendar): starts at 20% on Q1, then 40% / 60% / 80% / 100% as each question is answered. This matches the existing pattern in `nils-vsl-fast.html`.

The four survey steps are wrapped in a single container with a sibling `#scalendar` block (same approach as the existing modal). Only one step is visible at a time via the existing `.survey-step.active` toggle.

**The four questions (verbatim — do not reword):**

1. **Q1 — "Are you currently able to take on more clients?"**
   - (a) Yes, I'm ready to take on more clients
   - (b) No

2. **Q2 — "What is the average lifetime value of your client?"**
   - (a) Less than $1,500
   - (b) More than $1,500

3. **Q3 — "What are you currently doing for marketing?"**
   - (a) Word of mouth and referrals
   - (b) Paid ads

4. **Q4 — "What is your current monthly revenue?"**
   - (a) Less than $20,000
   - (b) More than $20,000

Each question has exactly two `.survey-opt` buttons. No optional hint copy, no text inputs, no $ inputs (the `survey-input-wrap` and `survey-dollar-wrap` styles remain in CSS for the unchanged base file but are unused by this page).

**Behavior:**
- Picking an answer auto-advances after 250ms (matches existing `pick()` pattern)
- "Back" arrow appears on Q2-Q4 (same `.survey-back` style/text as existing)
- Q1 has no Back arrow
- After Q4 is answered: progress bar fills to 100%, all `.survey-step` blocks hide, `#scalendar` shows. The quiz card grows to accommodate the iframe.

## Section 3: Calendar reveal (after Q4)

Reuses the existing `#scalendar` markup from `nils-vsl-fast.html` lines 5356-5447, including:
- Eyebrow text "You qualify"
- Headline "Good news 🎉 you're a fit. Grab a time below."
- Subcopy paragraph (free strategy call, no fluff/pressure)
- The `<iframe>` element with `id="5ZY5mQXXFUQ1bXxwyAuq_1774303721367"` and `scrolling="yes"`
- The `#cal-scroll-proxy` div for mobile drag-to-scroll
- The `#calendar-scroll-hint` ("👇 Make sure you scroll down and press Schedule Meeting")

**Calendar source:** `https://link.nilsdigital.com/widget/booking/wFhAJTJLU3Urtmxztnb5` (same as `nils-vsl-fast-direct.html`).

The iframe `src` lazy-loads when Q4 is answered (the iframe's HTML attribute starts as `about:blank`; JS sets the real URL on calendar reveal). This matches the lazy-load pattern in the existing modal version, just triggered from Q4-pick instead of `openModal()`.

## Section 4: VSL section (relocated)

A new `<section>` directly below the hero. Background: `var(--gray-bg)` (light gray, matches the existing page rhythm).

**Contents (in order, all reused from current hero markup):**
- Eyebrow: `WATCH THE 2-MINUTE OVERVIEW` (uses existing `.section-eyebrow` style)
- Headline: "We'll build you a website that gets **4x more clients** and run **extremely profitable** Google Ads." (the existing `hero-h1` content from `nils-vsl-fast.html` lines 3973-3991, including the `.fire-badge` "4x more clients" and `.fire-text` "extremely profitable" spans). Demoted from `.hero-h1` to `.section-h2` styling so it doesn't compete with the new hero headline.
- Subhead: the existing `.hero-sub-grid` with its three sub-items (Done-for-you setup / Profitable results guaranteed / Takes 1-2 hours), reclassed to `.section-sub-grid` if needed for spacing.
- The HVP video player block (`#hvp` + all its overlay/controls markup from lines 4010-4126) — copied verbatim, no JS changes needed.
- A horizontal 3-stat proof row below the video, reusing the existing `hero-proof-col` markup but rendered horizontally with appropriate spacing.
- Secondary CTA button (`.btn` style, blue): "Take the 60-second qualifier ↑" — smooth-scrolls to `#quiz-card` (the quiz card wrapper carries this id).

## Section 5: Other sections

The "How it works", case studies, and FAQ sections are kept exactly as they appear in `nils-vsl-fast.html`. Footer is unchanged.

## Section 6: JavaScript changes

**Adapted (existing functions, retargeted):**
- `pick(btn, step)` — same logic. Picks an answer, marks it `.selected`, then after 250ms calls `goStep(step + 1)` for steps 1-3 or triggers calendar reveal for step 4.
- `goStep(n)` — same logic. Toggles `.active` between `.survey-step` blocks, updates progress bar fill and label.
- Calendar lazy-load — moved from inside `openModal()` into the Q4 → calendar transition. Sets the iframe `src` to the booking URL only on first reveal.
- Iframe scroll proxy (`#cal-scroll-proxy`) — kept as-is; lets users drag-scroll the iframe on mobile.

**Removed:**
- `openModal()`, `closeModal()`, `handleOverlayClick()`
- The Escape-key listener that closed the modal
- The `nextFromInput()` handler for the old Q3 dollar input (this variant has no text inputs)
- The text-input focus/zoom-prevention logic for iOS (no inputs to focus)

**Untouched:**
- HVP video player JS (the entire custom media player module)
- Scroll-reveal `IntersectionObserver` for `.anim` elements
- FAQ accordion handlers
- Fire-badge tooltip handlers
- Footer year setter

## Section 7: What this page deliberately does NOT do

- **No tracking / logging of quiz answers.** Pure conversion device. (`survey-log.json` integration deferred to a future variant if needed.)
- **No qualification logic.** Every answer combination ends at the calendar.
- **No prefilling of answers into the booking widget.** Deferred — would require confirming GHL widget supports URL params.
- **No A/B variant of headline copy or question wording** in this initial build.

## Files touched

**Created:**
- `F:/GitHub/Websites/Nils/funnel/nils-quiz-fast-direct.html`

**Not modified:**
- `nils-vsl-fast.html`, `nils-vsl-fast-direct.html`, `nils-vsl.html`, `vsl.html`, `review.html`, `survey-log.json` — all left untouched.

## Acceptance criteria

1. Hero shows the new headline + quiz card; no video, no large CTA button, no side proof column.
2. Quiz advances through Q1 → Q2 → Q3 → Q4 with auto-advance after each pick.
3. Back button works on Q2, Q3, Q4. No Back on Q1.
4. After Q4 is answered, the calendar iframe loads and replaces the quiz inline.
5. Calendar source resolves to `https://link.nilsdigital.com/widget/booking/wFhAJTJLU3Urtmxztnb5`.
6. VSL section appears immediately below the hero with the existing video player and 3-stat proof row.
7. Secondary CTA below the video scrolls back up to the quiz.
8. FAQ, case studies, footer all render identically to `nils-vsl-fast.html`.
9. No console errors. No references to `openModal`, `closeModal`, or `#apply-modal` remain.
10. Page renders correctly on mobile (≤ 640px): quiz card has comfortable padding, calendar is scroll-proxy-enabled, video stacks cleanly.
