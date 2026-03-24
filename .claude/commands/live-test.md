Simulate a real user visiting the funnel on both desktop and mobile. Click through every interactive element, scroll the full page, and screenshot each key state. Fix anything that looks or behaves wrong.

---

## WHAT THIS TESTS

You are acting as a first-time visitor. You have never seen this page. Go through it exactly as a real person would.

---

## SETUP

Run all tests using Puppeteer (preferred) or Screenshotone (fallback).

**Option A — Puppeteer (local, preferred — supports interactive tests):**
```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // DESKTOP
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // ... test actions here ...

  // MOBILE
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  // ... test actions here ...

  await browser.close();
})();
"
```

**Option B — Screenshotone (fallback — static screenshots only, no click interactions):**
Push to GitHub Pages first, then use for visual-only tests (Tests 1, 2, 5, 6, 10). For interactive tests (3, 4, 7, 8, 9), verify by reading the HTML/JS code directly instead.
```bash
SCREENSHOTONE_KEY=$(grep SCREENSHOTONE_ACCESS_KEY .env | cut -d '=' -f2)
LIVE_URL="https://demilio24.github.io/Websites/{RELATIVE_FILE_PATH}"
# Replace 'test-01-desktop-load.png' with the appropriate filename per test
curl -s "https://api.screenshotone.com/take?access_key=${SCREENSHOTONE_KEY}&url=${LIVE_URL}&full_page=true&viewport_width=1440&viewport_height=900&format=png&delay=4" -o test-01-desktop-load.png
curl -s "https://api.screenshotone.com/take?access_key=${SCREENSHOTONE_KEY}&url=${LIVE_URL}&full_page=true&viewport_width=390&viewport_height=844&format=png&delay=3" -o test-02-mobile-load.png
```

---

## TEST SEQUENCE

Run each test, screenshot the result, read the screenshot, note pass/fail.

---

### TEST 1: Initial Page Load — Desktop (1440px)
```js
await page.screenshot({ path: 'test-01-desktop-load.png' });
```
Check:
- [ ] Page loads without errors
- [ ] Hero fills the viewport (no white gap above or below)
- [ ] Nav is visible at the top, logo on left, links in center, CTA button on right
- [ ] Hero text is in the left column, form is in the right column
- [ ] No layout shift or broken elements visible

---

### TEST 2: Initial Page Load — Mobile (390px)
```js
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.screenshot({ path: 'test-02-mobile-load.png' });
```
Check:
- [ ] No horizontal overflow (nothing spills off screen)
- [ ] Hero text stacks above the form (single column)
- [ ] Nav shows logo + hamburger icon only (no nav links visible)
- [ ] Font sizes are readable (H1 not too large, body not too small)
- [ ] CTA buttons are full-width or close to it
- [ ] No content is clipped or hidden unexpectedly

---

### TEST 3: Mobile Nav — Open Hamburger
```js
await page.click('.hamburger'); // or whatever the hamburger selector is
await page.waitForTimeout(400); // wait for animation
await page.screenshot({ path: 'test-03-mobile-nav-open.png' });
```
Check:
- [ ] Menu opens smoothly (no jump, no flash)
- [ ] All nav links are visible and readable
- [ ] CTA button is visible in the mobile menu
- [ ] Menu does not cover the entire screen awkwardly
- [ ] Background is darkened or menu slides in cleanly

---

### TEST 4: Mobile Nav — Close + Link Click
```js
await page.click('.mobile-menu a:first-child'); // click first nav link
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-04-mobile-nav-scroll.png' });
```
Check:
- [ ] Clicking a nav link closes the menu
- [ ] Page scrolls to the correct section
- [ ] Section is not hidden under the fixed nav (check offset)

---

### TEST 5: Scroll — Desktop, First 3 Sections
```js
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-05-scroll-desktop-top.png' });
```
Check:
- [ ] Scroll-triggered animations have fired for visible elements
- [ ] Nav has shadow (scrolled state)
- [ ] Section connector (wave divider) between hero and next section looks clean — no gap, no color mismatch
- [ ] Social proof bar looks correct

---

### TEST 6: Scroll — Full Page Desktop
```js
// Scroll through the entire page in steps to trigger all animations
for (let y = 0; y <= 15000; y += 600) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(150);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: 'test-06-full-scroll-desktop.png', fullPage: true });
```
Check:
- [ ] All animate-on-scroll elements are now visible (no permanently invisible sections)
- [ ] All stat counters have animated (numbers show final values, not 0)
- [ ] No section has unexpected white space or gap
- [ ] All wave dividers look correct throughout the page
- [ ] Final CTA section and footer look correct

---

### TEST 7: FAQ Accordion
```js
await page.evaluate(() => {
  const faq = document.querySelector('.faq-question, .faq-item button, details summary');
  if (faq) faq.click();
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-07-faq-open.png' });
```
Check:
- [ ] FAQ answer expands smoothly (not a jump)
- [ ] Answer text is readable and not cut off
- [ ] Toggle icon rotates correctly (+ → × or ↓ → ↑)
- [ ] Border changes to primary color when open

```js
// Click same one again to close
await page.evaluate(() => {
  const faq = document.querySelector('.faq-question, .faq-item button, details summary');
  if (faq) faq.click();
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-07-faq-closed.png' });
```
Check:
- [ ] FAQ closes smoothly (collapses back to 0 height)

---

### TEST 8: Service Card Expand (if applicable)
```js
await page.evaluate(() => {
  const toggle = document.querySelector('.service-toggle, .learn-more-btn, .expand-btn');
  if (toggle) toggle.click();
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-08-service-expand.png' });
```
Check:
- [ ] Service detail expands smoothly
- [ ] Content inside is readable and not overflowing
- [ ] Button text changes ("Learn More" → "Show Less")

---

### TEST 9: CTA Button — Form Pulse
```js
// Click a CTA that links to #hero
await page.evaluate(() => {
  const cta = document.querySelector('a[href="#hero"]:not(.btn-primary)');
  if (cta) cta.click();
});
await page.waitForTimeout(1000); // wait for scroll + pulse delay
await page.screenshot({ path: 'test-09-form-pulse.png' });
```
Check:
- [ ] Page scrolls back to hero
- [ ] Form card has a pulse/glow animation
- [ ] Form card gets a colored border briefly

---

### TEST 10: Full Page — Mobile Scroll
```js
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto('http://localhost:8099/PATH/TO/FILE.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let y = 0; y <= 20000; y += 400) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(100);
}
await page.screenshot({ path: 'test-10-mobile-full.png', fullPage: true });
```
Check:
- [ ] No element overflows horizontally at any point
- [ ] All grids are single column
- [ ] All buttons are large enough to tap (min 44px height)
- [ ] No text is too small to read
- [ ] Section padding is reduced but still comfortable
- [ ] Images fill their containers correctly

---

## STEPS

1. Ask the user for the file path if not already provided.

2. Run each test in sequence. After each screenshot, use the Read tool to view it.

3. Note every failure with the test number and what's wrong.

4. Fix all failures directly in the HTML file.

5. Re-run any failed tests to confirm the fix.

6. Report results:
```
LIVE TEST REPORT
=================
Test 01 — Desktop Load:        PASS
Test 02 — Mobile Load:         PASS
Test 03 — Mobile Nav Open:     PASS (fixed: menu animation was instant, added 0.3s transition)
Test 04 — Nav Link Click:      PASS
Test 05 — Scroll Desktop Top:  PASS
Test 06 — Full Scroll Desktop: PASS (fixed: 3 elements stuck at opacity 0)
Test 07 — FAQ Accordion:       PASS
Test 08 — Service Expand:      PASS
Test 09 — CTA Form Pulse:      PASS
Test 10 — Mobile Full Scroll:  PASS (fixed: hero image overflowed at 390px)

FIXES MADE: 3
STATUS: READY ✓
```

7. Commit, push, return GHL embed code.
