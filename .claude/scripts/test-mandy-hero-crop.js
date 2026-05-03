// Test object-position values for the about-hero photo on desktop.
// Generates screenshots at multiple vertical positions so we can pick the best.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');
const SHOTS = path.resolve(__dirname, '..', 'screenshots', 'about-hero-crop');
fs.mkdirSync(SHOTS, { recursive: true });

const positions = [
  'left top',
  'left 10%',
  'left 20%',
  'left 30%',
  'left 40%',
  'left 50%',
  '20% 10%',
  '20% 20%',
  '20% 30%',
  '30% 20%',
  '30% 30%',
  'center 28%',
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const pos of positions) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate((position) => {
      // dismiss entry animation overlay
      const entry = document.getElementById('entry');
      if (entry) entry.style.display = 'none';
      sessionStorage.setItem('vp', 'about');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-about').classList.add('active');
      const img = document.querySelector('.about-hero img.about-hero-photo');
      if (img) img.style.objectPosition = position;
      window.scrollTo(0, 0);
    }, pos);
    // wait for image to load
    await page.evaluate(() => {
      const img = document.querySelector('.about-hero img.about-hero-photo');
      return img && img.complete ? Promise.resolve() : new Promise(res => img.addEventListener('load', res, { once: true }));
    });
    await new Promise(r => setTimeout(r, 500));
    const safeName = pos.replace(/[^a-z0-9]+/gi, '_');
    await page.screenshot({ path: path.join(SHOTS, `${safeName}.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`captured ${pos} → ${safeName}.png`);
    await page.close();
  }
  await browser.close();
})();
