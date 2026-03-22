Visually review a funnel HTML file by screenshotting it, reading the screenshot, identifying issues, fixing them, and looping until the page passes quality standards.

## Quality Standards (what a passing page looks like)

- **Section connectors**: No visible hard edges or gaps between sections. Colors flow or transition cleanly. Use SVG waves, diagonal cuts, or matching background colors.
- **Color consistency**: Max 2-3 accent colors used throughout. No random color clashes.
- **Typography hierarchy**: H1 > H2 > H3 > body is visually obvious. Nothing competes at the same size.
- **Spacing**: Sections have breathing room (min 80px padding top/bottom). No elements touching edges.
- **CTA buttons**: Prominent, high-contrast, clearly clickable. Never blending into the background.
- **Visual balance**: Text and imagery are balanced. No walls of text without visual breaks.
- **Mobile**: Nothing overflows horizontally. Text is readable (min 15px). Buttons are tap-friendly.
- **Premium feel**: Matches the quality level of the references in `references/`. No default browser styles visible.

---

## Steps

1. **Take a screenshot** — Run this Puppeteer script via Bash:

```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///ABSOLUTE_PATH_TO_FILE.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'qa-screenshot-desktop.png', fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: 'qa-screenshot-mobile.png', fullPage: true });
  await browser.close();
  console.log('Screenshots saved.');
})();
"
```

2. **Read both screenshots** — Use the Read tool on `qa-screenshot-desktop.png` and `qa-screenshot-mobile.png`.

3. **Identify all issues** — List every problem found, grouped by severity:
   - 🔴 Critical: broken layout, unreadable text, overflowing elements, invisible CTAs
   - 🟡 Medium: section connector gaps, color inconsistencies, poor spacing
   - 🟢 Minor: small alignment issues, subtle improvements

4. **Fix everything** — Edit the HTML file to resolve all 🔴 and 🟡 issues. Use `/generate-bg` patterns for section connector problems.

5. **Re-screenshot and re-read** — Repeat steps 1-3.

6. **Loop until clean** — Keep fixing and re-checking until there are no 🔴 or 🟡 issues remaining.

7. **Report** — Tell the user the page passed QA, summarize what was fixed, and return the GHL embed code.

---

## Common fixes reference

**Section gap (white/dark strip between sections):**
```css
/* Match the bottom of section A to the top of section B */
.section-a { margin-bottom: -2px; }
.section-b { margin-top: -2px; }
```

**SVG wave connector:**
```html
<div style="line-height:0; margin-bottom:-1px;">
  <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="width:100%;height:60px;display:block;">
    <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="{NEXT_BG_COLOR}"/>
  </svg>
</div>
```

**Text overflow on mobile:**
```css
* { box-sizing: border-box; }
img, video { max-width: 100%; }
.section { padding: 60px 20px; }
```
