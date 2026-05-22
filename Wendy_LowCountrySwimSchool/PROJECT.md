# Wendy LCSS — Low Country Swim School

## What this is
Client = Wendy (owner) + Jessica + Erin (operates GHL platform day-to-day). LCSS is a Charleston-area swim school running group + private lessons across multiple pools. This folder holds the public landing page, registration funnel, partnership form, and a one-time contact import script. **GHL platform is the source of truth**; the sheet→GHL contact sync done on 2026-04-30 was one-time, and Erin works in the platform only going forward.

## Architecture
- `home.html` — main landing page; navbar (DM Sans + Poppins), Microsoft Clarity (`wkegb4xxls`), GTM (`GTM-T2V7GZZ6`), Google Ads (`AW-16868839047`). Brand: navy `#081c30` + blue `#2773b1` + supporting green. Hosts hero, programs, locations, instructor roster, CTAs.
- `registration.html` — multi-step student registration form. Green theme (`--green #22c55e`, `--bg #f0fdf4`), animated blob background, sticky navy topbar, progress UI. Submits to GHL.
- `partnership-form.html` — pool partnership lead form (homeowners renting pools to LCSS for summer). DM Sans, navy/blue theme matching home.
- `thankyou.html` — post-registration confirmation; uses GHL full-width container reset.
- `Contacts/` — `contacts.csv` (88KB roster) + `import-contacts.js` (one-time GHL contact import script). `.work/` has run artifacts (`report.csv`, `report.json`, `errors.csv`) from the 2026-04-30 migration. **Emergency re-alignment only — do not re-run routinely.**
- `Registration Page/` — archived scrape of the previous third-party registration page (HTML + assets) used as reference when building `registration.html`.
- `uploads/` — local image staging before GHL upload (currently empty).

Tech stack: static HTML + embedded CSS/JS, GitHub Pages hosted, served into GHL via iframe embed.

## Conventions
- **Stakeholders are Wendy, Jessica, Erin (NOT Aaron).** Erin operates the GHL platform.
- **GHL platform is source of truth.** Don't sync to/from the sheet — that was a one-time import 2026-04-30. All contact + registration data lives in GHL going forward.
- CTAs avoid the word "free" (per Wendy); current canonical CTA wording lives in `home.html` — check before changing.
- Microsoft Clarity ID for LCSS: `wkegb4xxls`.

## Open threads
(none clear)

## Changelog
## 2026-05-21 — Added 2 new instructors to home page
Added Sarah C. (17 yrs coaching, 11 yrs NVSL) and Becca S. (swim + aqua fitness, Wisconsin/Hawai'i) to the team grid in `home.html` based on bios Wendy forwarded from each instructor. Photos uploaded to GHL media library (locationId `LHyUDIth9k9Kk9qv4BzQ`):
- Becca S: `https://assets.cdn.filesafe.space/LHyUDIth9k9Kk9qv4BzQ/media/4e0d7581-a627-435f-97a0-5e21d68ce8d4.jpeg`
- Sarah C: `https://assets.cdn.filesafe.space/LHyUDIth9k9Kk9qv4BzQ/media/f52049ef-fbc6-483c-bbb9-ea62ae2d2670.jpeg`
Note: n8n workflow `0L1NeAQaAoK4wref` (Gmail→Drive+GHL pipeline) successfully fetched the photos to Drive but its GHL upload step failed with `400 Unexpected non-whitespace character after JSON at position 1677` — had to upload to GHL directly via PowerShell + `medias/upload-file`. Worth fixing the workflow's GHL multipart encoding.

## 2026-05-17 — PROJECT.md seeded
Initial seed from existing folder state.

## 2026-04-30 — One-time sheet→GHL contact import
Ran `Contacts/import-contacts.js` against `contacts.csv` to align Erin's spreadsheet with the platform. Sheet deprecated after this date; Erin works in platform only.
