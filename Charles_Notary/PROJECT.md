# Charles / Mobile Notary Miami Florida: 24/7 mobile notary across Miami-Dade and Broward

## What this is
Veteran-owned mobile notary service operating across Miami-Dade and Broward County since 2012 (real estate, power of attorney, wedding officiating, etc.). This folder holds the main marketing site plus the post-conversion thank-you page.

## Architecture
- `charles.html` : main marketing / sales page (lives at mobilenotarymiamiflorida.com), includes Google Ads gtag `AW-16857632055` and the GHL form embed script
- `thankyou.html` : post-form thank-you page; fires the Google Ads conversion event on load and is set to `noindex, nofollow`
- Tech: HTML + embedded CSS/JS, GitHub Pages, GHL iframe embed (standard pattern across all client funnels in this repo)

## Conventions
- Brand colors: deep navy `#1B3A5C` primary, gold `#C9963B` secondary, dark footer `#111827`
- Fonts: Instrument Serif + Playfair Display (headings) with Inter (body)
- Container max 1200px / narrow 800px, full shadow + glow system including gold-tinted glow
- Phone number `305-613-3300` and veteran-owned positioning surface throughout

## Open threads
(none clear)

## Changelog
## 2026-05-23 Pain-section SVG swapped for closed-storefront photo
Charles emailed that the Pain-section illustration "looks like a large empty space with a notepad and a clock." Replaced the inline 400x400 SVG (white-on-white documents + clock + tiny X marks) with a real photograph: Imagen-generated, mid-30s professional standing outside a closed Miami notary office at golden hour, holding a folder of documents, checking phone. Photo hosted in Mobile Notary Miami Florida GHL media library (`YUxVPDw3FnvQ2ne2mIu8`, file `ca6c82b3-f1eb-4777-ad52-ec78b47f3841.png`). Removed `.pain-illustration` wrapper CSS, added `.pain-photo` class that absolute-positions the image to fill the `.pain-image-col` rounded frame edge-to-edge. Four variation candidates (A bank-line, B overhead-desk, C counter-closeup, D closed-storefront) live in the GHL bucket for reference if Charles ever asks for a different angle.

## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state.
