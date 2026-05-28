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
- **Phone-first CTA strategy** (as of 2026-05-24): every primary button on `charles.html` points to `tel:+13056133300`, not to the `#hero-form` anchor. The hero form still exists and is reachable by direct anchor, but no CTA scrolls to it. If you add a new CTA, default it to `tel:` — only link to the form if Charles explicitly asks.

## Open threads
(none clear)

## Changelog
## 2026-05-28 Physical address removed from legal modal (Terms, Privacy, Contact)
Charles emailed asking to remove his physical address (18495 South Dixie Hwy. #236, Miami, Florida 33157) from the Terms and Contact pages, saying email + phone suffice for contact info. Removed all four street-address references in the legal modal: Terms tab "registered office is…" line, Privacy tab "please write to…" and "the above address" lines (repointed both to support@mobilenotarymiamiflorida.com), and the Contact tab "Address:" line. Left the Cutler Bay / Palmetto Bay service-area ZIP `33157` entries alone (those are coverage areas, not his address). Phone `305-613-3300` and email remain as the only contact details.

## 2026-05-24 Every primary CTA converted to click-to-call
Charles emailed asking to convert "Request an Appointment" buttons → "Click to Call" and "Get In Touch" → "Call Now", all linking to `tel:+13056133300` so mobile users tap straight into the dialer. Confirmed scope with Emilio and converted every form-driving CTA on the page (not just the literal matches):
- Header nav: "Get In Touch" + envelope icon → "Call Now" + phone icon
- Pain section: "Request a Free Quote" → "Click to Call"
- Process section: "Request Your Appointment" → "Click to Call"
- Inline dark CTA banner: "Request Your Appointment" → "Click to Call"
- Gallery section: "Get In Touch" → "Call Now"
- FAQ section: "Get In Touch" → "Call Now"
- Final CTA: "Request Your Appointment" → "Click to Call"
- Footer Quick Links (both charles.html and thankyou.html): "Request an Appointment" → "Click to Call"
Left "Schedule Your Mobile Notary" (benefits section) untouched — wasn't on Charles's list. The hero GHL form still exists and the `#hero-form` anchor still works for anyone who lands directly there; no buttons scroll to it anymore. Verified in Puppeteer at desktop + mobile widths.

## 2026-05-23 Pain-section SVG swapped for closed-storefront photo
Charles emailed that the Pain-section illustration "looks like a large empty space with a notepad and a clock." Replaced the inline 400x400 SVG (white-on-white documents + clock + tiny X marks) with a real photograph: Imagen-generated, mid-30s professional standing outside a closed Miami notary office at golden hour, holding a folder of documents, checking phone. Photo hosted in Mobile Notary Miami Florida GHL media library (`YUxVPDw3FnvQ2ne2mIu8`, file `ca6c82b3-f1eb-4777-ad52-ec78b47f3841.png`). Removed `.pain-illustration` wrapper CSS, added `.pain-photo` class that absolute-positions the image to fill the `.pain-image-col` rounded frame edge-to-edge. Four variation candidates (A bank-line, B overhead-desk, C counter-closeup, D closed-storefront) live in the GHL bucket for reference if Charles ever asks for a different angle.

## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state.
