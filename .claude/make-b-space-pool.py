"""Variation B: shift the dominant background feel from 'outer space' to
'space-themed indoor pool'. Keep the planet, stars, and cosmic accents — but
make the base environment read as deep pool water you're floating in.

Changes:
1. Body base color: #040f24 (deep space) -> #0c2858 (deep pool blue). Still
   dark enough for stars to pop, but immediately reads as water.
2. body::before backdrop: reduce starfield, INCREASE caustic-light and add a
   visible top->bottom 'underwater perspective' gradient (lighter cyan glow up
   top fading to deeper blue at the bottom — like looking up at the surface).
3. body::after bubbles: bigger and bluer, more variety.
4. Caustic shimmer: stronger opacity + faster + more frequent.
5. Add a wide animated horizontal water-ripple layer across the page
   (subtle drifting wave lines, like light on water surface).
6. Add a subtle pool-tile grid as a background pattern overlay (very faint
   square grid that says 'we're in a pool').
7. Add an underwater swimmer silhouette SVG decoration in the Events section
   (gives the page a literal swim school identity).
"""
import os

B_PATH = r"F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home-b.html"

def patch(path, find, repl, label, required=True):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if find not in content:
        if required:
            print(f"  MISSING anchor: {label}")
        return False
    if repl == find:
        return False
    content = content.replace(find, repl, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  patched: {label}")
    return True

# ============================================================
# 1. Shift the base color from dark space to deep pool blue
# ============================================================
print("\n=== 1. Base color: dark space -> deep pool ===")

# Update --space token to deep pool blue
patch(
    B_PATH,
    """:root {
  --space: #040f24;
  --space-2: #081a3a;
  --space-3: #0c2553;""",
    """:root {
  --space: #0a2548;
  --space-2: #0e2f5f;
  --space-3: #143a73;
  --pool-deep: #0a2548;
  --pool-mid: #154480;
  --pool-light: #1e6bb5;""",
    "Token shift: deep pool blue base"
)

# Update html base color
patch(
    B_PATH,
    "html { background: #040f24; }",
    "html { background: #0a2548; }",
    "html bg -> deep pool"
)

# ============================================================
# 2. Rebuild body::before with stronger underwater feel
# ============================================================
print("\n=== 2. body::before: underwater perspective ===")

# Replace the whole body::before block with a new layered version
OLD_BEFORE = """/* Layered space + water atmosphere — starfield up top, deep ocean glow toward bottom */
body::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    /* Starfield — top half of viewport */
    radial-gradient(2px 2px at 12% 8%, rgba(255,255,255,0.7), transparent 50%),
    radial-gradient(1px 1px at 68% 4%, rgba(255,255,255,0.55), transparent 50%),
    radial-gradient(1.5px 1.5px at 24% 18%, rgba(255,255,255,0.6), transparent 50%),
    radial-gradient(1px 1px at 82% 16%, rgba(255,255,255,0.5), transparent 50%),
    radial-gradient(2px 2px at 56% 24%, rgba(255,255,255,0.55), transparent 50%),
    radial-gradient(1px 1px at 42% 12%, rgba(255,255,255,0.4), transparent 50%),
    radial-gradient(1px 1px at 88% 28%, rgba(255,255,255,0.45), transparent 50%),
    radial-gradient(1.5px 1.5px at 32% 36%, rgba(255,255,255,0.4), transparent 50%),
    /* Caustic water-light ripple — mid viewport */
    radial-gradient(ellipse 60% 30% at 30% 55%, rgba(91,231,255,0.06) 0%, transparent 60%),
    radial-gradient(ellipse 55% 28% at 75% 65%, rgba(58,216,212,0.05) 0%, transparent 60%),
    /* Aurora cyan glow up top */
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91,231,255,0.12) 0%, transparent 60%),
    /* Deep ocean gradient at the bottom */
    linear-gradient(180deg, transparent 0%, transparent 55%, rgba(8,26,73,0.45) 80%, rgba(4,15,55,0.65) 100%),
    var(--space);
}"""

NEW_BEFORE = """/* Underwater pool atmosphere with space accents floating in it */
body::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    /* Light-from-above surface glow — strong at top, like looking up from underwater */
    radial-gradient(ellipse 120% 50% at 50% -10%, rgba(91,231,255,0.30) 0%, rgba(91,231,255,0.10) 30%, transparent 60%),
    /* A few stars (much fewer than before — these now read as 'tiny lights') */
    radial-gradient(1.5px 1.5px at 16% 12%, rgba(255,255,255,0.55), transparent 50%),
    radial-gradient(1px 1px at 78% 8%, rgba(255,255,255,0.45), transparent 50%),
    radial-gradient(1px 1px at 38% 22%, rgba(255,255,255,0.4), transparent 50%),
    radial-gradient(1px 1px at 92% 30%, rgba(255,255,255,0.35), transparent 50%),
    /* Caustic patches — sunlight refracting through water (visible) */
    radial-gradient(ellipse 45% 22% at 22% 38%, rgba(91,231,255,0.20) 0%, transparent 65%),
    radial-gradient(ellipse 38% 18% at 78% 52%, rgba(58,216,212,0.16) 0%, transparent 65%),
    radial-gradient(ellipse 30% 16% at 50% 70%, rgba(91,231,255,0.14) 0%, transparent 65%),
    radial-gradient(ellipse 26% 14% at 12% 78%, rgba(45,200,232,0.13) 0%, transparent 65%),
    /* Mid pool blue belt */
    linear-gradient(180deg, transparent 0%, rgba(21,68,128,0.35) 35%, rgba(10,37,72,0.6) 65%, rgba(8,26,73,0.85) 100%),
    var(--space);
}"""

patch(B_PATH, OLD_BEFORE, NEW_BEFORE, "body::before -> underwater pool perspective")

# ============================================================
# 3. body::after bubbles — bigger, more aqua, more variety
# ============================================================
print("\n=== 3. Bubbles -> bigger + more aqua ===")

OLD_AFTER = """/* Floating water bubbles drifting upward across the whole page — visible */
body::after { content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.85;
  background-image:
    radial-gradient(circle 8px at 6% 110%,  rgba(91,231,255,0.9), rgba(91,231,255,0.3) 50%, transparent 70%),
    radial-gradient(circle 12px at 22% 110%, rgba(91,231,255,0.85), rgba(91,231,255,0.25) 50%, transparent 70%),
    radial-gradient(circle 6px at 38% 110%,  rgba(58,216,212,0.95), rgba(58,216,212,0.3) 50%, transparent 70%),
    radial-gradient(circle 14px at 56% 110%, rgba(91,231,255,0.8), rgba(91,231,255,0.25) 50%, transparent 70%),
    radial-gradient(circle 9px at 72% 110%,  rgba(58,216,212,0.9), rgba(58,216,212,0.3) 50%, transparent 70%),
    radial-gradient(circle 11px at 88% 110%, rgba(91,231,255,0.85), rgba(91,231,255,0.25) 50%, transparent 70%);
  background-size: 100% 200%;
  animation: bubblesRise 14s linear infinite;
}"""

NEW_AFTER = """/* Pool bubbles streaming up the page — looks like a swimmer just exhaled */
body::after { content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.9;
  background-image:
    radial-gradient(circle 14px at 5% 110%,  rgba(255,255,255,0.85), rgba(91,231,255,0.4) 45%, transparent 75%),
    radial-gradient(circle 8px at 14% 110%,  rgba(91,231,255,0.9), rgba(91,231,255,0.3) 50%, transparent 75%),
    radial-gradient(circle 18px at 26% 110%, rgba(255,255,255,0.75), rgba(58,216,212,0.4) 45%, transparent 75%),
    radial-gradient(circle 6px at 36% 110%,  rgba(58,216,212,0.95), rgba(58,216,212,0.3) 50%, transparent 75%),
    radial-gradient(circle 22px at 48% 110%, rgba(255,255,255,0.7), rgba(91,231,255,0.4) 45%, transparent 75%),
    radial-gradient(circle 10px at 58% 110%, rgba(91,231,255,0.9), rgba(91,231,255,0.3) 50%, transparent 75%),
    radial-gradient(circle 16px at 70% 110%, rgba(255,255,255,0.8), rgba(58,216,212,0.4) 45%, transparent 75%),
    radial-gradient(circle 9px at 82% 110%,  rgba(58,216,212,0.9), rgba(58,216,212,0.3) 50%, transparent 75%),
    radial-gradient(circle 13px at 92% 110%, rgba(91,231,255,0.85), rgba(91,231,255,0.3) 50%, transparent 75%);
  background-size: 100% 220%;
  animation: bubblesRise 12s linear infinite;
}"""

patch(B_PATH, OLD_AFTER, NEW_AFTER, "Bubbles -> pool-style")

# ============================================================
# 4. Add a subtle pool-tile grid texture overlay
#    + a horizontal water-ripple drift layer
# ============================================================
print("\n=== 4. Pool tile grid + water ripple drift ===")

POOL_TEXTURE_CSS = """
/* Subtle square grid that reads as 'pool tiles' — extremely faint, mostly felt */
.pool-tiles {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.18;
  background-image:
    linear-gradient(rgba(91,231,255,0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(91,231,255,0.15) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 0%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 0%, transparent 80%);
}
/* Drifting horizontal water-ripple bands — slow, continuous, like the surface of a pool */
.water-ripples {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.45;
  background-image:
    repeating-linear-gradient(0deg,
      transparent 0,
      transparent 80px,
      rgba(91,231,255,0.05) 80px,
      rgba(91,231,255,0.10) 84px,
      transparent 88px,
      transparent 160px);
  animation: ripplesDrift 18s linear infinite;
}
@keyframes ripplesDrift {
  0%   { background-position: 0 0; }
  100% { background-position: 0 320px; }
}
"""

patch(
    B_PATH,
    "/* Caustic-light shimmer — slow underwater sunlight refraction overlay */",
    POOL_TEXTURE_CSS + "\n/* Caustic-light shimmer — slow underwater sunlight refraction overlay */",
    "Inject pool-tiles + water-ripples CSS"
)

# Add the two new layers right after .caustic-shimmer in the DOM
patch(
    B_PATH,
    """<body>
<div class="caustic-shimmer" aria-hidden="true"></div>""",
    """<body>
<div class="pool-tiles" aria-hidden="true"></div>
<div class="water-ripples" aria-hidden="true"></div>
<div class="caustic-shimmer" aria-hidden="true"></div>""",
    "Inject pool-tiles + water-ripples DOM"
)

# ============================================================
# 5. Beef up the caustic-shimmer (was opacity 0.55, push to 0.9)
# ============================================================
print("\n=== 5. Caustic shimmer intensity ===")
patch(
    B_PATH,
    """.caustic-shimmer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.55;
  background:
    radial-gradient(ellipse 320px 180px at 20% 30%, rgba(91,231,255,0.18), transparent 60%),
    radial-gradient(ellipse 280px 160px at 70% 60%, rgba(58,216,212,0.16), transparent 60%),
    radial-gradient(ellipse 220px 140px at 40% 80%, rgba(91,231,255,0.14), transparent 60%),
    radial-gradient(ellipse 260px 150px at 85% 20%, rgba(45,200,232,0.13), transparent 60%);""",
    """.caustic-shimmer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.9;
  background:
    radial-gradient(ellipse 380px 200px at 20% 30%, rgba(91,231,255,0.30), transparent 65%),
    radial-gradient(ellipse 320px 180px at 70% 60%, rgba(58,216,212,0.28), transparent 65%),
    radial-gradient(ellipse 260px 160px at 40% 80%, rgba(91,231,255,0.25), transparent 65%),
    radial-gradient(ellipse 300px 170px at 85% 20%, rgba(45,200,232,0.22), transparent 65%);""",
    "Caustic shimmer: stronger glow"
)

# Slow the caustic drift down for smoother feel
patch(
    B_PATH,
    "animation: causticDrift 20s ease-in-out infinite alternate;",
    "animation: causticDrift 16s ease-in-out infinite alternate;",
    "Caustic drift speed"
)

print("\nDONE.")
