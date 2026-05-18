# Jacob / Superhero Swim University: certification community for swim instructors

## What this is
Jacob runs Superhero Swim University (SSU), a paid Skool community that certifies swim instructors (Survival Swim, Adaptive Aquatics, etc.) and ships members a branded rashguard on signup. This folder holds two near-identical Skool funnel landings plus a retreat link-tree.

## Architecture
- `skool1.html` : Skool funnel landing variant 1, drives "Start Free Trial" clicks to `skool.com/superheroswimuniversity`, GHL-breakout shell with bubble background, Microsoft Clarity `wkehznw4ua`
- `skool2.html` : Skool funnel landing variant 2 (A/B sibling of skool1, near-identical structure and CTA)
- `retreat_link_tree.html` : standalone "Superhero Swim Instructor Retreat 2026" link tree, water-canvas + bubbles background, Bangers + Nunito fonts
- Tech: HTML + embedded CSS/JS, GitHub Pages, GHL iframe embed (standard pattern across all client funnels in this repo)

## Conventions
- Brand colors: deep blue `#1e2d73` / `#2b3a8e`, sky `#5ba3d9`, pool `#7ec8e3`, with yellow `#FFD700` accent
- Fonts: Inter + Poppins on Skool pages, Bangers + Nunito on the retreat page (superhero / fun energy)
- Media bucket on GHL CDN: `fnkYRrAiIDiQrWbiOtRL`
- Both Skool pages use the full GHL-breakout reset (fixed `#ghl-breakout` over viewport)

## Open threads
- skool1.html vs skool2.html are sibling variants. Confirm which is current before editing.

## Changelog
## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state.
