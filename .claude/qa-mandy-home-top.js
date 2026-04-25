// Capture top + bottom of home hero for HOME/LOGO/SCROLL revision.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT_DIR = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'home-logo-scroll-2026-04-24');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) { e.style.display = 'none'; }
    document.querySelectorAll('.fu').forEach(el => el.classList.add('in'));
    const home = document.getElementById('page-home');
    if (home) home.classList.add('active');
  });
  await new Promise(r => setTimeout(r, 400));

  const out = path.join(OUT_DIR, 'image-nine-real-mobile.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${path.basename(out)}`);
  await browser.close();
})();
