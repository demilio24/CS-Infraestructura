/**
 * Puppeteer QA: screenshot every page of the Systema Floyd funnel desktop + mobile.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8765/Tom_Systema_Floyd/funnel';
const OUT = path.resolve(__dirname, '..', 'screenshots', 'systema-qa');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { slug: 'home',         url: `${BASE}/home.html` },
  { slug: 'after-school', url: `${BASE}/after-school.html` },
  { slug: 'camps',        url: `${BASE}/camps.html` },
  { slug: 'spirit-dance', url: `${BASE}/spirit-dance.html` },
  { slug: 'thankyou-seacrest',   url: `${BASE}/thankyou.html?campus=seacrest` },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

(async () => {
  const errors = [];
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);

    page.on('pageerror', (err) => errors.push({ vp: vp.name, err: err.message }));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push({ vp: vp.name, console: msg.text() }); });

    for (const p of PAGES) {
      try {
        await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 400));
        // Fold capture first (before any scroll)
        const fold = path.join(OUT, `${p.slug}-${vp.name}-fold.png`);
        await page.screenshot({ path: fold, fullPage: false });
        // Force all .anim into 'in' state so full-page screenshot shows everything
        await page.evaluate(() => {
          document.querySelectorAll('.anim').forEach((el) => el.classList.add('in'));
          window.scrollTo(0, 0);
        });
        await new Promise(r => setTimeout(r, 900));
        const full = path.join(OUT, `${p.slug}-${vp.name}-full.png`);
        await page.screenshot({ path: full, fullPage: true });
        console.log(`✓ ${p.slug} (${vp.name})`);
      } catch (err) {
        errors.push({ vp: vp.name, page: p.slug, err: err.message });
        console.log(`✗ ${p.slug} (${vp.name}): ${err.message}`);
      }
    }
    await page.close();
  }

  await browser.close();
  if (errors.length) {
    console.log('\n--- ERRORS ---');
    errors.forEach(e => console.log(JSON.stringify(e)));
    process.exit(1);
  }
  console.log('\nAll pages captured. Output:', OUT);
})();
