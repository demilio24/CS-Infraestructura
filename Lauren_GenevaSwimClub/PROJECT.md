# Lauren / Golden State CPR: CPR and lifeguard booking pages (filed under Geneva Swim Club)

## What this is
Two single-purpose booking landings under the "Golden State CPR" brand: one for CPR/First Aid class registration, one for hiring an event lifeguard. Both embed a GHL booking calendar. Filed under the `Lauren_GenevaSwimClub` folder name even though the visible brand is Golden State CPR (likely shared operator / sister business).

## Architecture
- `GSC-CPR.html` : "Book a CPR Class" landing, dark navy hero with curved bottom, embedded GHL booking iframe, trust band, footer
- `gsc-lifeguard.html` : "Book a Lifeguard" sibling landing with the same shell and palette, swapped copy and iframe target
- Tech: HTML + embedded CSS/JS, GitHub Pages, GHL iframe embed (standard pattern across all client funnels in this repo)

## Conventions
- Brand colors: navy `#002B45`, azure `#008ED3`, tint `#E6F4FA`, white
- Fonts: Montserrat 700/800 (headings) + Open Sans 400/600 (body)
- Hero uses an ellipse `clip-path` to curve into the white booking section below
- Both pages share identical layout primitives, sibling templates

## Open threads
- Folder name mismatches the brand on the pages (`GenevaSwimClub` vs `Golden State CPR`). Confirm with the user before renaming or repurposing.

## Changelog
## 2026-05-17 PROJECT.md seeded
Initial seed from existing folder state.
