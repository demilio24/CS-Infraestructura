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
- **Interactive elements**: Accordions open AND close correctly. Animations play at the right speed in both directions.

---

## Steps

1. **Start an HTTP server** — Never use `file://`. CDN images won't load over the file protocol. Always serve via localhost:

```bash
# From the repo root (e.g. f:/GitHub/CS-Infraestructura)
npx http-server -p 8099 --silent &
sleep 3
# Use http://localhost:8099/PATH/TO/FILE.html in all Puppeteer scripts
# If port is in use: netstat -ano | grep 8099 → taskkill //F //PID <pid>
```

2. **Take a screenshot** — Scroll the page first so lazy-loaded images load:

```bash
NODE_PATH=.claude/node_modules node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }
  await page.evaluate(() => window.scrollTo(0,0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/qa-screenshot-desktop.png', fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: '.claude/screenshots/qa-screenshot-mobile.png', fullPage: true });
  await browser.close();
  console.log('Screenshots saved.');
})();
"
```

3. **Read both screenshots** — Use the Read tool on `.claude/screenshots/qa-screenshot-desktop.png` and `.claude/screenshots/qa-screenshot-mobile.png`.

4. **Test interactive elements with Puppeteer** — Don't assume accordions, toggles, or modals work. Click them and verify:

```bash
NODE_PATH=.claude/node_modules node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Test FAQ accordion: click open, wait, check height > 0, click close, check height = 0
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    await page.evaluate(el => el.scrollIntoView(), faqBtn);
    await faqBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const afterOpen = await page.evaluate(() => {
      const ans = document.querySelector('.faq-item .faq-ans');
      const item = document.querySelector('.faq-item');
      return { h: ans.scrollHeight, open: item.classList.contains('open'), style: ans.style.height };
    });
    console.log('FAQ open state:', afterOpen);
    // open: true and scrollHeight > 0 = PASS

    await faqBtn.click();
    await new Promise(r => setTimeout(r, 500));
    const afterClose = await page.evaluate(() => {
      const ans = document.querySelector('.faq-item .faq-ans');
      return { h: ans.style.height, open: document.querySelector('.faq-item').classList.contains('open') };
    });
    console.log('FAQ close state:', afterClose);
    // open: false and height = 0px = PASS
  }

  await browser.close();
})();
"
```

5. **Identify all issues** — List every problem found, grouped by severity:
   - 🔴 Critical: broken layout, unreadable text, overflowing elements, invisible CTAs, broken interactive elements
   - 🟡 Medium: section connector gaps, color inconsistencies, poor spacing
   - 🟢 Minor: small alignment issues, subtle improvements

6. **Fix everything** — Edit the HTML file to resolve all 🔴 and 🟡 issues. Use `/generate-bg` patterns for section connector problems.

7. **Re-screenshot and re-test** — Repeat steps 2-4.

8. **Loop until clean** — Keep fixing and re-checking until there are no 🔴 or 🟡 issues remaining.

9. **Report** — Tell the user the page passed QA, summarize what was fixed, and return the GHL embed code.

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

**FAQ accordion broken (opens then immediately closes):**
The `max-height` trick creates unequal speeds and bugs. See `/animate` skill Section 8 for the correct `height`-based implementation using `scrollHeight` + `offsetHeight` reflow.

**Portrait video in landscape container — wrong crop:**
Use Puppeteer to test `object-position` values until the subject's face is centered. Test 15%, 25%, 35%, 45% and pick the best. See `/new-funnel` skill for the full framing workflow.

---

## Additional mobile fixes reference

**Detect exactly which elements are overflowing horizontally:**
```bash
NODE_PATH=.claude/node_modules node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  const overflowers = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    return Array.from(document.querySelectorAll('*'))
      .filter(el => { const r = el.getBoundingClientRect(); return r.right > docWidth + 2; })
      .map(el => ({ tag: el.tagName, cls: el.className, right: Math.round(el.getBoundingClientRect().right), docWidth }));
  });
  console.log(JSON.stringify(overflowers, null, 2));
  await browser.close();
})();
"
```
Common culprits: fixed-width flex items, absolute-positioned elements, white-space:nowrap. Fix with flex:1 1 0; min-width:0 on children and overflow:hidden on wrapper.

**Flex item causing horizontal overflow:**
```css
/* WRONG */
.item { flex: 0 0 80px; }
/* RIGHT */
.item { flex: 1 1 0; min-width: 0; }
.wrapper { width: 100%; box-sizing: border-box; overflow: hidden; }
```

**Orphan item in 2-col mobile grid:**
```css
.grid-item:last-child:nth-child(odd) {
  grid-column: 1 / -1; max-width: 50%; margin: 0 auto; justify-self: center;
}
```

**Mobile calendar modal — fullscreen scrollable:**
```css
@media (max-width: 680px) {
  .modal-overlay.calendar-mode { padding: 0; align-items: flex-start; }
  .modal-overlay.calendar-mode .modal-box {
    width: 100vw; min-height: 100vh; height: auto; max-height: none;
    border-radius: 0; padding: 16px 16px 48px; overflow-y: auto;
  }
  #scalendar iframe { min-height: 720px; }
}
```

**iOS input zoom prevention (viewport meta):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
```
Stops iOS Safari from zooming on input focus inside iframes (GHL calendars, forms).

**Proof cards on dark mobile hero (no white panel below):**
Override the dark navy glass to white glassmorphism so cards pop against the blue background:
```css
@media (max-width: 680px) {
  .hero-proof-item {
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  .hero-proof-num { color: #fff; }
}
```

**Credential pills on mobile — compact flex, no lines:**
```css
@media (max-width: 680px) {
  .diff-creds-line { display: none; }
  .diff-creds { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .diff-cred-pill { flex-direction: row; padding: 7px 13px; font-size: 12px; border-radius: 40px; flex: 0 0 auto; }
}
```
