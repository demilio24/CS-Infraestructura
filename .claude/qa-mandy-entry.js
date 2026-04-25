// Capture the loading-page V monogram (the #entry overlay) before it fades.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT_DIR = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'v-monogram-2026-04-24');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // Wait for SVG fade-in (.in class added at ~120ms)
  await new Promise(r => setTimeout(r, 800));
  // Make sure entry hasn't dismissed yet
  await page.evaluate(() => {
    const el = document.getElementById('entry');
    if (el) {
      el.classList.remove('out');
      el.style.display = 'flex';
      el.style.opacity = '1';
    }
  });
  await new Promise(r => setTimeout(r, 200));

  const out = path.join(OUT_DIR, 'image-eight-real-mobile.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${path.basename(out)}`);
  await browser.close();
})();
