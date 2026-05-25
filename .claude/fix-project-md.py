"""Resolve the merge conflict in Tristan_AquanautsAcademy/PROJECT.md and prepend
today's late-session changelog entry."""
import re

PATH = r"F:\GitHub\Websites\Tristan_AquanautsAcademy\PROJECT.md"

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: collapse the <<<<<<< ... ======= ... >>>>>>> conflict.
# Keep both sides as separate, distinct entries (they describe complementary work).
pattern = re.compile(
    r"<<<<<<< Updated upstream\n"
    r"(?P<upstream>.*?)\n"
    r"=======\n"
    r"(?P<stash>.*?)\n"
    r">>>>>>> Stashed changes\n",
    re.DOTALL,
)
def resolve(m):
    # Order: stash (evening, more recent in conversation) first, upstream (earlier check) second
    return m.group('stash') + "\n\n" + m.group('upstream') + "\n"

content_resolved, n = pattern.subn(resolve, content)
print(f"Conflict markers resolved: {n}")

# Step 2: insert today's late-session entry right after "## Changelog\n"
late_entry = """### 2026-05-25 (late) — UX polish, B retheme to "space swim school", handoff doc
- Wrote [HANDOFF.md](HANDOFF.md) — complete next-session brief covering live URLs, what's done, what's pending, file map, GHL access, gotchas, and quick-start instructions.
- Mobile UI/UX audit on both variations (Puppeteer): fixed iOS form-input zoom (16px font), undersized tap targets on `.loc-card-link` (44px min-height), tiny program-card-tag text (bumped to 0.78rem).
- Reviews section: added 6 new verbatim Google reviews (Kirsten R, Heidi R, Amanda C, Ranu D, Cristina P, Natali S) covering Tristan, Catherine, Brandon, Drake, Anastasia + autism/neurodiverse/adult/fearful-kid personas; 9 total. Replaced "Read More on Google" CTA with an in-page topic filter (All / Kids / Adaptive / Adults / Beat Fear). Bug fix: filter was wired but didn't visually hide cards — missing `.review-card.hidden { display: none; }` rule.
- Pre-fill CTAs: every CTA targeting `#hero-form` now smooth-scrolls AND pre-fills `program_interest` + `closest_location`, then pulses the form card. Program-card CTAs use `data-program`; location and team cards have location inferred from card content via JS.
- Gallery expanded from 6 to 12 images (added 6 pool-location photos). Image-section fit audit: swapped About to the warm "instructor-and-child in water" shot; swapped Lifeguard program card to the Naturally Pacific Resort pool photo.
- **Variation B retheme arc** (driven by user feedback "it just looks dark"):
  - Fixed `body { background }` blocking `body::before`/`::after` decorative layers (moved base color to `html`).
  - Saturn-style glowing planet (360px) in hero top-right with tilted ring + concentric water-ripple animation.
  - Strengthened hero wave divider (4-layer SVG, alpha 0.06 → 0.65). Added 3 more wave dividers between Programs→Events, Locations→Steps, Team→Why.
  - Bubbles: bigger (8-22px), brighter cores, 12s cycle.
  - Final shift from "outer space + bubbles" to "space swim school": deep pool blue base (#0a2548), strong caustic-light patches, faint pool-tile grid, drifting horizontal water-ripple bands, reduced starfield density.
  - Fixed B logo invisibility (removed `filter: brightness(0) invert(1)`, replaced with cyan drop-shadow glow).
- Team card alignment: `.team-card` flex-column, `.team-card-bio { flex: 1 }`, `.team-card-serves { margin-top: auto }`. "Book with X" CTAs now align across all 8 cards regardless of bio length.
- Headline rule established: section headlines max 2 lines. Team uses explicit `<br>` to force "Eight Instructors." / "110+ Years on Deck."
- Scheduled remote routine `trig_01MsfuJWmQYW5WUGNFzMsV6x` for the Wix→GHL URL swap at `2026-05-25T10:39:00Z` — now superseded because the parallel scrape conversation finished and `image_url_map.json` is ready; swap can be run directly.

"""

marker = "## Changelog\n\n"
idx = content_resolved.find(marker)
if idx < 0:
    raise SystemExit("Could not find Changelog marker")
ins = idx + len(marker)
new_content = content_resolved[:ins] + late_entry + content_resolved[ins:]

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"PROJECT.md rewritten ({len(content)} -> {len(new_content)} chars)")
