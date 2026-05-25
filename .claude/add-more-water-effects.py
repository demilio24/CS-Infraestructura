"""Variation B only: add more water effects on top of the existing space theme.

1. Animated caustic-light shimmer overlay (drifts slowly across the page like
   sunlight refracting through water).
2. Three more SVG wave dividers between major sections (after Programs, after
   Locations, after Team) so the ocean motif repeats through the page.
3. Concentric water-ripple rings around the hero planet (looks like the planet
   is reflecting off water).
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
# 1. Animated caustic-light shimmer overlay
# ============================================================
print("\n=== 1. Caustic-light shimmer overlay ===")

CAUSTIC_CSS = """
/* Caustic-light shimmer — slow underwater sunlight refraction overlay */
.caustic-shimmer {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.55;
  background:
    radial-gradient(ellipse 320px 180px at 20% 30%, rgba(91,231,255,0.18), transparent 60%),
    radial-gradient(ellipse 280px 160px at 70% 60%, rgba(58,216,212,0.16), transparent 60%),
    radial-gradient(ellipse 220px 140px at 40% 80%, rgba(91,231,255,0.14), transparent 60%),
    radial-gradient(ellipse 260px 150px at 85% 20%, rgba(45,200,232,0.13), transparent 60%);
  background-size: 100% 200%;
  animation: causticDrift 20s ease-in-out infinite alternate;
  mix-blend-mode: screen;
}
@keyframes causticDrift {
  0%   { background-position: 0%   0%,  100% 30%, 30% 100%, 70%  10%; transform: translate3d(0, 0, 0); }
  50%  { background-position: 30%  40%, 60% 70%,  80% 50%,  20%  60%; transform: translate3d(-8px, 6px, 0); }
  100% { background-position: 60%  20%, 20% 50%,  50% 80%,  90%  40%; transform: translate3d(6px, -4px, 0); }
}
"""

# Insert into the body::after CSS area (right after the bubblesRise keyframe)
patch(
    B_PATH,
    "@keyframes bubblesRise {\n  0%   { background-position: 0% 0%; }\n  100% { background-position: 0% -200%; }\n}",
    "@keyframes bubblesRise {\n  0%   { background-position: 0% 0%; }\n  100% { background-position: 0% -200%; }\n}\n" + CAUSTIC_CSS,
    "Inject caustic-shimmer CSS"
)

# Add the .caustic-shimmer div right after <body>
patch(
    B_PATH,
    "</head>\n<body>\n\n<!-- NAV -->",
    """</head>
<body>
<div class="caustic-shimmer" aria-hidden="true"></div>

<!-- NAV -->""",
    "Inject caustic-shimmer DOM element"
)

# ============================================================
# 2. Three more wave dividers between sections
# ============================================================
print("\n=== 2. Extra wave dividers ===")

WAVE_SVG = """  <div class="wave-divider" aria-hidden="true">
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,60 C240,110 480,10 720,50 C960,90 1200,20 1440,60 L1440,120 L0,120 Z" fill="rgba(91,231,255,0.18)"/>
      <path d="M0,80 C240,40 480,100 720,68 C960,28 1200,90 1440,80 L1440,120 L0,120 Z" fill="rgba(58,216,212,0.30)"/>
      <path d="M0,95 C240,115 480,60 720,90 C960,118 1200,68 1440,95 L1440,120 L0,120 Z" fill="rgba(45,200,232,0.48)"/>
      <path d="M0,108 C240,124 480,90 720,108 C960,124 1200,92 1440,108 L1440,120 L0,120 Z" fill="rgba(91,231,255,0.42)"/>
    </svg>
  </div>
"""

# 2a. After Programs section (right before </section> of #programs)
patch(
    B_PATH,
    """    <div class="programs-cta-row anim">
      <a href="#hero-form" class="btn btn-primary">See All Programs""",
    """    <div class="programs-cta-row anim">
      <a href="#hero-form" class="btn btn-primary">See All Programs""",
    "Programs CTA marker (no-op)",
    required=False,
)
# Better anchor: the closing of programs section
patch(
    B_PATH,
    """      <span class="cta-subtext">Call 250-327-3212 if you are not sure which fits.</span>
    </div>
  </div>
</section>

<!-- EVENTS -->""",
    """      <span class="cta-subtext">Call 250-327-3212 if you are not sure which fits.</span>
    </div>
  </div>
""" + WAVE_SVG + """</section>

<!-- EVENTS -->""",
    "Wave divider after Programs"
)

# 2b. After Locations section (before Steps)
patch(
    B_PATH,
    """      <span class="cta-subtext">Not sure which works for you? We will help you pick.</span>
    </div>
  </div>
</section>

<!-- STEPS -->""",
    """      <span class="cta-subtext">Not sure which works for you? We will help you pick.</span>
    </div>
  </div>
""" + WAVE_SVG + """</section>

<!-- STEPS -->""",
    "Wave divider after Locations"
)

# 2c. After Team section (before Why)
patch(
    B_PATH,
    """      <span class="cta-subtext">Tell us your location and we will introduce you.</span>
    </div>
  </div>
</section>

<!-- WHY -->""",
    """      <span class="cta-subtext">Tell us your location and we will introduce you.</span>
    </div>
  </div>
""" + WAVE_SVG + """</section>

<!-- WHY -->""",
    "Wave divider after Team"
)

# Each section that hosts a wave-divider needs overflow:hidden + position:relative.
# Already true for hero. We added section z-index 1 earlier. Just need overflow:hidden.
patch(
    B_PATH,
    ".programs { padding: 110px 0; position: relative; }",
    ".programs { padding: 110px 0; position: relative; overflow: hidden; }",
    "Programs: overflow hidden"
)
patch(
    B_PATH,
    ".locations { padding: 110px 0; position: relative; }",
    ".locations { padding: 110px 0; position: relative; overflow: hidden; }",
    "Locations: overflow hidden"
)
patch(
    B_PATH,
    ".team { padding: 110px 0; position: relative; }",
    ".team { padding: 110px 0; position: relative; overflow: hidden; }",
    "Team: overflow hidden"
)

# ============================================================
# 3. Water-ripple rings around the hero planet
# ============================================================
print("\n=== 3. Planet water-ripples ===")

RIPPLE_CSS = """
/* Concentric water-ripple rings emanating outward from the planet */
.hero-planet-body::before,
.hero-planet-body::after {
  content: ''; position: absolute; inset: -20px; border-radius: 50%;
  border: 2px solid rgba(91,231,255,0.5);
  animation: planetRipple 4s ease-out infinite;
  pointer-events: none;
}
.hero-planet-body::after { animation-delay: 2s; }
@keyframes planetRipple {
  0%   { transform: scale(1);   opacity: 0.6; border-width: 2px; }
  100% { transform: scale(1.55); opacity: 0;   border-width: 0.5px; }
}
"""

patch(
    B_PATH,
    "@media (max-width: 1024px) {\n  .hero-planet { top: 20px; right: -120px; width: 260px; height: 260px; }",
    RIPPLE_CSS + "\n@media (max-width: 1024px) {\n  .hero-planet { top: 20px; right: -120px; width: 260px; height: 260px; }",
    "Planet ripple CSS"
)

print("\nDONE.")
