const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8765/.claude/nav-variations';
const OUT = path.resolve(__dirname, '..', 'screenshots', 'nav-variations');
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { slug: 'nav-1-tactical-dark',   file: 'nav-1-tactical-dark.html' },
  { slug: 'nav-2-floating-glass',  file: 'nav-2-floating-glass.html' },
  { slug: 'nav-3-angular-slash',   file: 'nav-3-angular-slash.html' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    for (const v of VARIANTS) {
      try {
        await page.goto(`${BASE}/${v.file}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({
          path: path.join(OUT, `${v.slug}-${vp.name}.png`),
          fullPage: false,
        });
        console.log(`✓ ${v.slug} (${vp.name})`);
      } catch (err) {
        console.log(`✗ ${v.slug} (${vp.name}): ${err.message}`);
      }
    }
    await page.close();
  }
  await browser.close();
  console.log('\nAll variations captured at', OUT);
})();
