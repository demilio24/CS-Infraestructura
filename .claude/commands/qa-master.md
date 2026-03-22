Run a complete quality audit on a funnel HTML file. This is the final check before sending to the client. Go through every category below and fix everything that fails. Do not stop until every category passes.

---

## AUDIT CATEGORIES

### ✅ CATEGORY 1: COPY AUDIT

Read every visible text string in the HTML. Check:

- [ ] Zero em-dashes (—) anywhere in the entire file
- [ ] Zero hyphens used as mid-sentence dashes
- [ ] Zero competitor names mentioned
- [ ] Zero fear-based or doom language ("danger", "risk your life", "don't make this mistake")
- [ ] Hero eyebrow calls out the specific avatar AND location/geography
- [ ] H1 is an outcome (what the customer gets), not a feature or process
- [ ] Every section has: eyebrow + H2 + subtitle (3-part header)
- [ ] Body copy is short: max 2 paragraphs per section, 1-2 sentences each
- [ ] Every CTA button has a reassurance subtext line below it
- [ ] No CTA says "Submit", "Click Here", or "Sign Up Now"
- [ ] Testimonials are exact quotes (no paraphrasing — if you can't verify, flag it)
- [ ] About section is first-person ("Hi, I'm..." not "John is a...")
- [ ] Numbers are specific (not "many years" but "13 years")
- [ ] City/region is named explicitly in the hero eyebrow and at least 2 other sections

---

### ✅ CATEGORY 2: STRUCTURE AUDIT

Verify the page follows the correct section order:

- [ ] Section 1: Hero (2-col: text left, form right)
- [ ] Section 2: Social proof bar (directly after hero)
- [ ] Section 3: Problem / Why Different
- [ ] Section 4: Services
- [ ] Section 5: Process (4 steps)
- [ ] Section 6: Benefits
- [ ] Section 7: Who We Help (checklist + photo)
- [ ] Section 8: Gallery (6 images, 3-col)
- [ ] Section 9: Testimonials (3-col cards)
- [ ] Section 10: About (2-col, first person)
- [ ] Section 11: FAQ (accordion, 8-10 questions)
- [ ] Section 12: Final CTA (primary color background)
- [ ] Section 13: Footer (3-col, credit line)
- [ ] No two identical background colors back-to-back
- [ ] Form is ONLY in the hero right column — nowhere else

---

### ✅ CATEGORY 3: VISUAL / LAYOUT AUDIT

Take screenshots at 1440px and 390px.

**Option A — Puppeteer (local, preferred):**
```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///ABSOLUTE_PATH', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'qa-master-desktop.png', fullPage: true });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: 'qa-master-mobile.png', fullPage: true });
  await browser.close();
})();
"
```

**Option B — Screenshotone (fallback, requires live GitHub Pages URL):**
```bash
SCREENSHOTONE_KEY=$(grep SCREENSHOTONE_ACCESS_KEY .env | cut -d '=' -f2)
LIVE_URL="https://demilio24.github.io/Websites/{RELATIVE_FILE_PATH}"
curl -s "https://api.screenshotone.com/take?access_key=${SCREENSHOTONE_KEY}&url=${LIVE_URL}&full_page=true&viewport_width=1440&viewport_height=900&format=png&delay=4" -o qa-master-desktop.png
curl -s "https://api.screenshotone.com/take?access_key=${SCREENSHOTONE_KEY}&url=${LIVE_URL}&full_page=true&viewport_width=390&viewport_height=844&format=png&delay=3" -o qa-master-mobile.png
```

Read both screenshots. Check:

- [ ] No visible white gaps or hard edges between sections (wave dividers present)
- [ ] All images load and display correctly (no broken image icons)
- [ ] All images have appropriate aspect ratios for their container
- [ ] Text is readable over all background images (contrast is sufficient)
- [ ] No horizontal overflow or scroll at 390px
- [ ] No elements touching the screen edge without padding
- [ ] CTA buttons are prominent and clearly visible on both desktop and mobile
- [ ] Hero form is visible on desktop (right column), stacked below text on mobile
- [ ] Grid layouts collapse correctly on mobile (3-col → 1-col)
- [ ] Font sizes are readable on mobile (minimum 14px for body, 28px for H1)
- [ ] Hero minimum height is correct — content fills the viewport

---

### ✅ CATEGORY 4: SVG & ICONS AUDIT

- [ ] No emojis used in place of icons (all icons are inline SVG or CSS)
- [ ] All icons are the same style (all outline, consistent stroke-width 1.5px)
- [ ] Icon containers are 56x56px with primary-light background and 14px border-radius
- [ ] Wave dividers present between every background color change
- [ ] Wave paths are organic curves (not flat lines)
- [ ] Wave fill color matches the next section's background exactly
- [ ] No broken SVG paths (check the rendered screenshot for blank areas where SVGs should be)

---

### ✅ CATEGORY 5: ANIMATIONS AUDIT

- [ ] `.animate-on-scroll` class on all section content and cards
- [ ] Single IntersectionObserver — not duplicated
- [ ] Stagger delays (`.delay-1` through `.delay-6`) on grid children
- [ ] Counter animation implemented on all stat numbers with `data-target`
- [ ] FAQ accordion toggles work (max-height animation)
- [ ] Service card "Learn More" expand works
- [ ] Mobile hamburger menu works
- [ ] Navbar gets shadow on scroll
- [ ] Hero form pulse on CTA click
- [ ] Hero accent word has animated gradient (ONE word in H1 only)
- [ ] Card hover uses ONLY `translateY(-6px)` — never diagonal
- [ ] All transitions are 0.2s-0.55s — nothing longer
- [ ] NO particle backgrounds, cursor effects, or 3D transforms

---

### ✅ CATEGORY 6: SEO AUDIT

- [ ] `<title>` tag: `[Primary Keyword] | [Business Name] | [City, State]` — 50-60 chars
- [ ] `<meta name="description">` — 150-160 chars, includes keyword + location
- [ ] One `<h1>` only — in the hero
- [ ] `<h2>` used for all section headlines
- [ ] `<h3>` for card titles and sub-sections (no skipped levels)
- [ ] Every `<img>` has a descriptive `alt` attribute (not empty, not "image")
- [ ] All below-fold images have `loading="lazy"`
- [ ] Hero image does NOT have `loading="lazy"`
- [ ] Google Fonts import has `display=swap`
- [ ] JSON-LD structured data present in `<head>`
- [ ] No duplicate `<meta>` tags
- [ ] No render-blocking scripts in `<head>` (use `defer`)

---

### ✅ CATEGORY 7: CODE QUALITY AUDIT

- [ ] Single HTML file — everything inline (no external CSS or JS files)
- [ ] One `<style>` block — no duplicate style blocks
- [ ] One `<script>` block at bottom of body — no duplicate script blocks
- [ ] No hardcoded hex colors in HTML attributes — all colors use CSS variables
- [ ] No inline `style=""` attributes except where absolutely necessary
- [ ] CSS variables defined in `:root` — not redefined per section
- [ ] No duplicate class definitions
- [ ] `@keyframes` defined once only
- [ ] `IntersectionObserver` instantiated once only
- [ ] Footer credit line present: "Website and marketing systems developed by Nilsdigital.com"
- [ ] No `console.log` or debug code left in

---

### ✅ CATEGORY 8: MOBILE AUDIT

- [ ] All CSS is mobile-first (base styles for 375px, `min-width` media queries scale up)
- [ ] No `max-width` media queries (desktop-first approach is wrong)
- [ ] All touch targets are min 44px tall (buttons, nav links, FAQ toggles)
- [ ] No text smaller than 14px on mobile
- [ ] No horizontal overflow at 375px
- [ ] Images have `max-width: 100%`
- [ ] `box-sizing: border-box` on all elements

---

## STEPS

1. Read the HTML file.

2. Go through all 8 categories. For each item:
   - PASS: note it passes
   - FAIL: fix it immediately before moving to the next item

3. Take screenshots before and after fixing visual issues.

4. Re-check any category where you made fixes.

5. Once all categories pass, commit and push.

6. Return a final report:
   ```
   QA MASTER REPORT
   ==================
   Copy: PASS (X issues fixed)
   Structure: PASS (X issues fixed)
   Visual/Layout: PASS (X issues fixed)
   SVG & Icons: PASS (X issues fixed)
   Animations: PASS (X issues fixed)
   SEO: PASS (X issues fixed)
   Code Quality: PASS (X issues fixed)
   Mobile: PASS (X issues fixed)

   TOTAL FIXES: X
   STATUS: READY FOR CLIENT ✓
   ```

7. Return the GHL embed code.
