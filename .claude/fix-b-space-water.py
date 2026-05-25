"""Fix the three reported B issues + crank up the space/water visuals.

1. Add .review-card.hidden { display: none; } to BOTH A and B  (filter bug)
2. B logo: remove the filter that's killing the original colored PNG on dark nav
3. B body bg: let body::before show by routing the base color to html instead
4. B: make the wave divider, drifting bubbles, hero bubbles, and ring orbits actually visible
5. B: add a prominent CSS planet in the hero corner so the theme reads instantly
"""
import os

A_PATH = r"F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home.html"
B_PATH = r"F:\GitHub\Websites\Tristan_AquanautsAcademy\funnel\home-b.html"

def patch(path, find, repl, label, required=True):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if find not in content:
        if required:
            print(f"  [{path}] MISSING anchor: {label}")
        return False
    if repl in content and find != repl:
        # Check if the patch is already applied (by checking a unique substring of repl that isn't in find)
        # Simple heuristic: skip
        pass
    new_content = content.replace(find, repl, 1)
    if new_content == content:
        print(f"  [{path}] no-op: {label}")
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"  [{path}] patched: {label}")
    return True

# ============================================================
# FIX 1: review-card.hidden CSS rule (apply to BOTH variations)
# ============================================================
print("\n=== FIX 1: review filter hidden rule (A + B) ===")
for path in [A_PATH, B_PATH]:
    patch(
        path,
        ".faq-item.hidden { display: none; }",
        ".faq-item.hidden { display: none; }\n.review-card.hidden { display: none; }",
        "add .review-card.hidden"
    )

# ============================================================
# FIX 2: B logo — remove filter so original colored logo shows
# ============================================================
print("\n=== FIX 2: B logo filter removal ===")
patch(
    B_PATH,
    ".nav-logo img { height: 42px; width: auto; filter: brightness(0) invert(1); opacity: 0.92; }",
    ".nav-logo img { height: 42px; width: auto; filter: drop-shadow(0 0 8px rgba(91,231,255,0.4)); }",
    "B logo: glow instead of invert filter"
)

# ============================================================
# FIX 3: B body bg — push base color to html, let body be transparent
#        so body::before (starfield + ocean gradient) actually renders
# ============================================================
print("\n=== FIX 3: B body bg fix ===")
patch(
    B_PATH,
    "body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; font-weight: 400; background: #040f24; color: #e6ecf5; overflow-x: hidden; line-height: 1.65; -webkit-font-smoothing: antialiased; }",
    "html { background: #040f24; }\nbody { margin: 0; padding: 0; font-family: 'Inter', sans-serif; font-weight: 400; background: transparent; color: #e6ecf5; overflow-x: hidden; line-height: 1.65; -webkit-font-smoothing: antialiased; }",
    "B body bg -> transparent, base on html"
)

# ============================================================
# FIX 4a: B body::after bubbles — bigger, brighter, more visible
# ============================================================
print("\n=== FIX 4a: B drifting bubbles intensity ===")
patch(
    B_PATH,
    """/* Floating water bubbles drifting upward across the whole page */
body::after { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: 0.55;
  background-image:
    radial-gradient(circle 3px at 8% 110%, rgba(91,231,255,0.5), transparent 60%),
    radial-gradient(circle 4px at 28% 110%, rgba(91,231,255,0.45), transparent 60%),
    radial-gradient(circle 2px at 48% 110%, rgba(58,216,212,0.5), transparent 60%),
    radial-gradient(circle 5px at 68% 110%, rgba(91,231,255,0.4), transparent 60%),
    radial-gradient(circle 3px at 88% 110%, rgba(58,216,212,0.5), transparent 60%);
  background-size: 100% 200%;
  animation: bubblesRise 22s linear infinite;
}""",
    """/* Floating water bubbles drifting upward across the whole page — visible */
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
}
/* Sections must sit ABOVE the body::after bubble layer */
.nav, .hero, .about, .programs, .events, .locations, .steps, .reviews, .gallery, .team, .why, .faq, .final-cta, .footer { position: relative; z-index: 1; }""",
    "B body::after bubbles -> bigger, brighter, faster"
)

# ============================================================
# FIX 4b: B wave divider — much more visible alpha
# ============================================================
print("\n=== FIX 4b: B wave divider visibility ===")
patch(
    B_PATH,
    """<svg viewBox="0 0 1440 72" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,40 C240,72 480,8 720,32 C960,56 1200,16 1440,40 L1440,72 L0,72 Z" fill="rgba(91,231,255,0.06)"/>
      <path d="M0,52 C240,28 480,68 720,44 C960,20 1200,60 1440,52 L1440,72 L0,72 Z" fill="rgba(58,216,212,0.08)"/>
      <path d="M0,60 C240,76 480,40 720,60 C960,80 1200,44 1440,60 L1440,72 L0,72 Z" fill="rgba(8,26,73,0.45)"/>
    </svg>""",
    """<svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,60 C240,110 480,10 720,50 C960,90 1200,20 1440,60 L1440,120 L0,120 Z" fill="rgba(91,231,255,0.25)"/>
      <path d="M0,80 C240,40 480,100 720,68 C960,28 1200,90 1440,80 L1440,120 L0,120 Z" fill="rgba(58,216,212,0.40)"/>
      <path d="M0,95 C240,115 480,60 720,90 C960,118 1200,68 1440,95 L1440,120 L0,120 Z" fill="rgba(45,200,232,0.65)"/>
      <path d="M0,108 C240,124 480,90 720,108 C960,124 1200,92 1440,108 L1440,120 L0,120 Z" fill="rgba(91,231,255,0.55)"/>
    </svg>""",
    "B wave divider: 4 layers, taller, much more visible"
)

# Bump wave-divider height too
patch(
    B_PATH,
    ".wave-divider { position: absolute; bottom: -1px; left: 0; right: 0; height: 72px; pointer-events: none; z-index: 2; line-height: 0; }",
    ".wave-divider { position: absolute; bottom: -1px; left: 0; right: 0; height: 110px; pointer-events: none; z-index: 3; line-height: 0; }",
    "B wave-divider height 72 -> 110"
)

# ============================================================
# FIX 4c: B hero bubbles — bigger and more
# ============================================================
print("\n=== FIX 4c: B hero bubbles intensity ===")
patch(
    B_PATH,
    """.hero-bubble {
  position: absolute; bottom: -40px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), rgba(91,231,255,0.25) 40%, rgba(91,231,255,0.05) 70%);
  box-shadow: inset 0 0 8px rgba(255,255,255,0.25), 0 0 16px rgba(91,231,255,0.18);
  animation: bubbleFloat linear infinite;
  opacity: 0;
}""",
    """.hero-bubble {
  position: absolute; bottom: -40px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(91,231,255,0.5) 40%, rgba(91,231,255,0.1) 70%);
  box-shadow: inset 0 0 12px rgba(255,255,255,0.5), 0 0 24px rgba(91,231,255,0.45);
  animation: bubbleFloat linear infinite;
  opacity: 0;
}""",
    "B hero bubbles brighter"
)

# ============================================================
# FIX 5: B — add a prominent Saturn-style planet in the hero
# ============================================================
print("\n=== FIX 5: B prominent planet in hero ===")
# Add the planet HTML inside the hero, right after the bubbles container
patch(
    B_PATH,
    """  <div class="hero-bubbles" aria-hidden="true">
    <span class="hero-bubble" style="left:6%;  width:14px; height:14px; animation-duration:18s; animation-delay:0s;"></span>""",
    """  <div class="hero-planet" aria-hidden="true">
    <div class="hero-planet-ring"></div>
    <div class="hero-planet-body"></div>
  </div>
  <div class="hero-bubbles" aria-hidden="true">
    <span class="hero-bubble" style="left:6%;  width:14px; height:14px; animation-duration:18s; animation-delay:0s;"></span>""",
    "B hero: inject Saturn planet HTML"
)

# Add the planet CSS — insert it after the wave-divider rules
patch(
    B_PATH,
    """.wave-divider-flip svg { transform: rotateX(180deg); }""",
    """.wave-divider-flip svg { transform: rotateX(180deg); }
/* Hero Saturn-style planet — visible in top right corner */
.hero-planet { position: absolute; top: -60px; right: -80px; width: 360px; height: 360px; z-index: 1; pointer-events: none; }
.hero-planet-body {
  position: absolute; inset: 60px; border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(91,231,255,0.95) 0%, rgba(58,216,212,0.55) 35%, rgba(30,77,146,0.65) 65%, rgba(8,26,73,0.85) 100%),
    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.18), transparent 50%);
  box-shadow:
    0 0 80px rgba(91,231,255,0.5),
    inset -30px -40px 60px rgba(0,0,0,0.5),
    inset 20px 30px 50px rgba(91,231,255,0.3);
}
.hero-planet-ring {
  position: absolute; top: 50%; left: 50%;
  width: 100%; height: 50px;
  transform: translate(-50%, -50%) rotate(-18deg);
  border-radius: 50%;
  border: 2px solid rgba(91,231,255,0.7);
  box-shadow:
    0 0 24px rgba(91,231,255,0.45),
    inset 0 0 20px rgba(91,231,255,0.25);
}
@media (max-width: 1024px) {
  .hero-planet { top: 20px; right: -120px; width: 260px; height: 260px; }
  .hero-planet-ring { height: 36px; }
}
@media (max-width: 640px) {
  .hero-planet { display: none; }
}""",
    "B hero planet CSS"
)

print("\nDONE.")
