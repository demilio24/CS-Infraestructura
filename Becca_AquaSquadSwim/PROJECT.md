# Becca / AquaSquad Swim: water safety swim school in Wesley Chapel, FL

## What this is
Becca runs AquaSquad Swim, a certified survival-swim program for children in Wesley Chapel, Epperson, and surrounding Tampa-area communities. This folder holds the public marketing site (sales page + registration page) embedded into GoHighLevel.

## Architecture
- `becca.html` : main marketing / sales page with video hero, program overview, and CTA into registration
- `becca-register.html` : standalone registration landing (matches main page styling, hosts the GHL signup flow)
- Tech: HTML + embedded CSS/JS, GitHub Pages, GHL iframe embed (standard pattern across all client funnels in this repo)

## Conventions
- Brand colors: teal `#1aa79d` primary, deep teal `#18494c` dark, peach `#f8a28e` secondary
- Font: Jost (with Century Gothic / Trebuchet MS fallbacks)
- Container max 1200px, radius tokens 8/12/100px, three shadow tiers plus a teal glow
- Hero preloads a video from the GHL CDN bucket `Y6gwSTjgTSm8n6V1SQed`

## Open threads
- "Trained Professionals" band and plural "our instructors" copy assume AquaSquad now has a team beyond Becca (per Becca's revision request). Survival Swim is still Becca-only. No individual instructor names/bios are claimed (intentional, pending real bios).
- Phone number `813-320-9787` is now the primary contact CTA across the site (tel:+18133209787). Email `info@aquasquadswim.com` kept as secondary.

## Changelog
## 2026-06-01 Nav logo fix + responsive nav rework
The 110px nav logo was rendering squished (23×110 instead of ~107×110): it's a flex item and the row overflowed (the added phone CTA tipped it over), so the most-shrinkable item — the logo `<img>` — collapsed. Fixes:
- `.nav-logo` / `.nav-logo img` now `flex-shrink: 0` so the logo never compresses.
- The 8 desktop links don't fit alongside the phone + CTA below ~1200px, so links now collapse into the hamburger at `max-width: 1200px` (full horizontal link bar shows only on true desktop). Phone + CTA stay visible down to 900px; phone hides ≤900px (still in the hamburger menu + hero pill).
- Logo trimmed 110px→92px, link padding/gap tightened, CTA padding reduced so the full desktop row has comfortable spacing within the 1200px container.
- Verified at 1440/1280/1100/768/390 (`.claude/screenshots/becca-nav-*.png`).

## 2026-06-01 Full-service repositioning (ClickUp revision 86ahujk4z)
Becca's ClickUp revision asked to reposition the site from "survival-only" to a full-service swim school. Implemented across `becca.html`:
- **Title/meta**: broadened from survival skills to full-service swim school.
- **Hero**: new headline "Swim Lessons Built on Water Safety First"; subhead lists all program types; tagline "we teach self-rescue first and strokes second"; added a phone CTA pill + "Approved Step Up for Students Direct Provider" trust signal.
- **New "We Heard You" band** (`#flexible`): flexible-options narrative, safety-foundation philosophy, age-3-and-under Survival Swim recommendation, gradient callout.
- **Comparison section**: reframed from "survival instead of strokes" to "survival first, then strokes" so it no longer reads survival-only.
- **New "Trained Professionals, Not Summer Help" band** (`#instructors`): instructor-quality copy from Becca's request (de-em-dashed), team-standards messaging.
- **Services restructured** to: Survival Swim ($115/wk, Becca-only, at our pool, 6–8 wks) · Private Lessons (learn-to-swim + stroke dev) · Mobile Learn-to-Swim · Small Group/Sibling & Friend (custom pricing) · Adult Swim Lessons · Parent & Me (Coming Soon).
- **New pricing block** (`#pricing`): package tier (Single $75 / 6 @ $65 / 12 @ $60 / 18 @ $55), monthly memberships ($260 / $480, monthly commitment + 7-day cancellation), one-time non-refundable $100 registration fee, Step Up for Students Direct Provider callout.
- **FAQ**: added "more than survival swim?", "do you come to my home?", "Step Up for Students?", "registration fee?"; refreshed program-comparison + payments answers.
- **Process/Benefits**: made program-agnostic ("your swimmer"); added "Flexible and Convenient" benefit.
- **Nav/footer**: phone added everywhere, duplicate "Programs" link removed, "Pricing" link added, footer tagline broadened + Step Up line.
- Followed brand rule: no em-dashes in copy (used colons in pricing lists).
- `becca-register.html` reviewed: already program-agnostic ($100/$35 new/returning toggle), no changes needed.
- QA: desktop + mobile screenshots verified (`.claude/screenshots/becca-{desktop,mobile}-*.png`). Repeated-nav strips in tall captures are Puppeteer stitching artifacts, not page bugs.

## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state.
