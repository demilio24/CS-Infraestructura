// Pixel-perfect audit of all 5 pages on the Mandy VELUS site (v5.html).
// Per page × per viewport: takes a full-page screenshot AND measures key spacing
// gaps so we can verify the spacing-token refactor didn't break anything.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '..', 'screenshots', 'mandy-audit-2026-04-25');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = ['home', 'collections', 'about', 'services', 'contact'];

async function audit(browser, w, h, label, viewportTag) {
  for (const pageId of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });

    // Activate the chosen page and force animations to their "in" state
    await page.evaluate((id) => {
      // Dismiss entry splash
      const entry = document.getElementById('entry');
      if (entry) entry.style.display = 'none';
      // Activate target page
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + id);
      if (target) target.classList.add('active');
      // Force all fade-up elements to settled state (no mid-animation)
      document.querySelectorAll('.fu').forEach(el => {
        el.classList.add('in');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      // Trigger collections feed render if applicable
      if (id === 'collections' && typeof window.buildColl === 'function') {
        window.buildColl();
      }
      window.scrollTo(0, 0);
    }, pageId);

    // Allow images to load and transitions to settle
    await new Promise(r => setTimeout(r, 2500));

    const file = path.join(OUT, `${pageId}-${viewportTag}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved ${file}`);

    // Spot-check spacing for each page
    const measurements = await page.evaluate((pageId) => {
      const r = (el) => el ? el.getBoundingClientRect() : null;
      const top = (el) => el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      const bot = (el) => el ? Math.round(el.getBoundingClientRect().bottom + window.scrollY) : null;
      const cs = (el) => el ? getComputedStyle(el) : null;

      const out = { pageId, sections: [] };

      const root = document.getElementById('page-' + pageId);
      if (!root) return out;

      // Collect all direct-child sections / divs
      const flow = Array.from(root.children).filter(c => c.offsetHeight > 0);
      out.flow = flow.map(c => ({
        tag: c.tagName.toLowerCase(),
        cls: c.className.toString().split(' ').slice(0, 3).join('.'),
        top: top(c),
        bottom: bot(c),
        h: Math.round(c.getBoundingClientRect().height),
        padTop: parseInt(cs(c).paddingTop) || 0,
        padBot: parseInt(cs(c).paddingBottom) || 0,
      }));

      // Footer (shared)
      const footer = document.querySelector('footer');
      if (footer) {
        out.footer = {
          top: top(footer),
          bottom: bot(footer),
          padTop: parseInt(cs(footer).paddingTop) || 0,
          padBot: parseInt(cs(footer).paddingBottom) || 0,
        };
      }

      return out;
    }, pageId);

    console.log(`\n=== ${label} • ${pageId} ===`);
    console.log('Direct children:');
    for (const c of (measurements.flow || [])) {
      console.log(`  ${c.tag}.${c.cls}`.padEnd(46), `pad ${c.padTop}/${c.padBot}`.padEnd(14), `h=${c.h}`);
    }
    if (measurements.footer) {
      console.log(`  footer (shared)`.padEnd(46), `pad ${measurements.footer.padTop}/${measurements.footer.padBot}`);
    }
    // Compute gaps between consecutive children
    const f = measurements.flow || [];
    if (f.length > 1) {
      console.log('\n  Gaps between adjacent children:');
      for (let i = 0; i < f.length - 1; i++) {
        const gap = f[i + 1].top - f[i].bottom;
        console.log(`    ${f[i].cls.padEnd(35)} → ${f[i + 1].cls.padEnd(35)} = ${gap}px`);
      }
    }

    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  await audit(browser, 1440, 900, 'DESKTOP (1440x900)', 'desktop');
  console.log('\n\n');
  await audit(browser, 390, 844, 'MOBILE (390x844)', 'mobile');
  await browser.close();
  console.log('\nDone. Screenshots in:', OUT);
})();
