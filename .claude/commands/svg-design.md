Design and generate custom inline SVG elements for a funnel page — icons, section dividers, decorative backgrounds, and illustrations. No external libraries. Everything is inline SVG in the HTML.

---

## WHAT THIS SKILL CREATES

### 1. Section Icons (for service cards, benefit cards, process steps)
- Style: outline stroke, stroke-width 1.5-2px, stroke-linecap round, stroke-linejoin round
- Size: 28px inline, 32px in benefit cards, displayed in a 56x56px colored container
- Color: currentColor (inherits from CSS var(--color-primary))
- ViewBox: 0 0 24 24 (standard icon grid)

**Icon categories to generate based on context:**
- Services: tools, documents, locations, people, buildings, shields, clocks
- Benefits: stars, checkmarks, lightning, heart, calendar, trophy, map pin
- Trust: shield with checkmark, verified badge, lock, certificate

### 2. Wave / Section Dividers
- Purpose: smooth transition between sections with different background colors
- Always use 2 overlapping paths (secondary at 35% opacity + main at 100%)
- ViewBox: 0 0 1440 72
- Height on page: 72px desktop, 44px mobile

**Wave styles:**
```html
<!-- Gentle wave (most common) -->
<svg viewBox="0 0 1440 72" preserveAspectRatio="none">
  <path opacity="0.35" d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="{NEXT_COLOR}"/>
  <path d="M0,48 C360,0 720,72 1080,24 C1260,0 1380,48 1440,36 L1440,72 L0,72 Z" fill="{NEXT_COLOR}"/>
</svg>

<!-- Angled cut (modern, premium) -->
<svg viewBox="0 0 1440 72" preserveAspectRatio="none">
  <path d="M0,72 L1440,0 L1440,72 Z" fill="{NEXT_COLOR}"/>
</svg>

<!-- Soft curve (approachable, family businesses) -->
<svg viewBox="0 0 1440 72" preserveAspectRatio="none">
  <path opacity="0.35" d="M0,72 Q720,-36 1440,72 L1440,72 L0,72 Z" fill="{NEXT_COLOR}"/>
  <path d="M0,72 Q720,0 1440,72 L1440,72 L0,72 Z" fill="{NEXT_COLOR}"/>
</svg>
```

### 3. Hero Decorative Elements
- Subtle radial glow behind the form card
- Abstract geometric shapes (circles, blobs) at low opacity
- Grid dot pattern for tech/B2B brands

**Blob pattern (for friendly niches):**
```html
<svg class="hero-blob" viewBox="0 0 400 400" style="position:absolute;opacity:0.06;pointer-events:none;">
  <path d="M200,50 C280,30 370,100 380,200 C390,300 320,390 200,380 C80,370 20,290 30,180 C40,70 120,70 200,50 Z" fill="var(--color-primary)"/>
</svg>
```

### 4. Pain Point Illustration (for problem sections)
Simple inline SVG illustration showing frustration/friction relevant to the business.

**Template for service businesses:**
```html
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Document stack -->
  <rect x="120" y="80" width="160" height="200" rx="8" fill="#f0f4f8" stroke="#d1d5db" stroke-width="2"/>
  <rect x="130" y="70" width="160" height="200" rx="8" fill="#e8edf3" stroke="#d1d5db" stroke-width="2"/>
  <rect x="140" y="60" width="160" height="200" rx="8" fill="#fff" stroke="#d1d5db" stroke-width="2"/>
  <!-- Lines suggesting text -->
  <rect x="160" y="100" width="100" height="8" rx="4" fill="#d1d5db"/>
  <rect x="160" y="120" width="80" height="8" rx="4" fill="#d1d5db"/>
  <!-- X mark overlay -->
  <circle cx="280" cy="80" r="28" fill="#fee2e2"/>
  <line x1="268" y1="68" x2="292" y2="92" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
  <line x1="292" y1="68" x2="268" y2="92" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
</svg>
```

---

## STEPS

1. **Ask the user** (or read the page context) to identify which sections need SVG work:
   - Which icons are missing or using emojis that should be proper SVGs?
   - Are section dividers present and smooth?
   - Does the problem section have a visual?
   - Does the hero have a subtle decorative element?

2. **Generate icons** — for each card/benefit that needs one, create a 24x24 outline SVG path. Use the brand primary color.

3. **Place wave dividers** — between every background color change. Match the wave fill to the next section's background.

4. **Add decorative elements** — subtle blobs or glows in the hero, not in body sections.

5. **Replace emojis with SVGs** — if the page uses emoji icons (🏊, 🎯, 🛡️), replace them with proper inline SVG icons.

6. **Verify SVG renders** — screenshot the page with Puppeteer after applying. Confirm icons are visible, properly sized, and colored.

7. **Edit the HTML file** with all SVG changes inline.
