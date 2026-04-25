// Capture the photo viewer (lightbox) for Collection - Photo Expansion revision.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT_DIR = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'photo-expansion-2026-04-24');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const VW = parseInt(process.env.VW || '430', 10);
  await page.setViewport({ width: VW, height: 844, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) { e.style.display = 'none'; }
    document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
    const c = document.getElementById('page-collections');
    if (c) c.classList.add('active');
    if (typeof buildColl === 'function') buildColl();
  });
  await new Promise(r => setTimeout(r, 600));

  // Open viewer for Karkalis (project index 0)
  await page.evaluate(() => {
    if (typeof openViewer === 'function') openViewer(0);
  });
  await new Promise(r => setTimeout(r, 800));

  const out = path.join(OUT_DIR, 'image-sixteen-real-mobile.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${path.basename(out)}`);
  await browser.close();
})();
