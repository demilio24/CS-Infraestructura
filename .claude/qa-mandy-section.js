// Capture a clean section screenshot for Mandy comparisons.
// Usage: node qa-mandy-section.js <selector> <out-path>
// Captures the section element at viewport 390x900 mobile.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const SELECTOR = process.argv[2];
const OUT_PATH = process.argv[3];

if (!SELECTOR || !OUT_PATH) {
  console.error('Usage: node qa-mandy-section.js <selector> <absolute-out-path>');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const VW = parseInt(process.env.VW || '430', 10);
  await page.setViewport({ width: VW, height: 1400, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  // Allow optional 4th arg: page id to activate (e.g. "page-about")
  const PAGE_ID = process.argv[4];
  await page.evaluate((pageId) => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const style = document.createElement('style');
    style.textContent = `
      .velus-v { opacity: 0 !important; visibility: hidden !important; }
      section.monogram { display: none !important; }
      #entry { display: none !important; }
      section.page { display: none !important; }
      section.page.active { display: block !important; }
    `;
    document.head.appendChild(style);
    if (pageId) {
      document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(pageId);
      if (target) target.classList.add('active');
    } else {
      // Default: activate home page (or first page)
      const home = document.getElementById('page-home') || document.querySelector('section.page');
      if (home) home.classList.add('active');
    }
  }, PAGE_ID);
  await new Promise(r => setTimeout(r, 400));

  const rect = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  }, SELECTOR);

  if (!rect) {
    console.error(`Selector not found: ${SELECTOR}`);
    process.exit(1);
  }

  console.log(`  ${SELECTOR} at doc y=${Math.round(rect.top)} h=${Math.round(rect.height)}`);

  const fullPath = OUT_PATH + '.tmp.png';
  await page.screenshot({ path: fullPath, fullPage: true });

  // Account for deviceScaleFactor=2 (full-page is 2x pixels)
  await sharp(fullPath)
    .extract({
      left: 0,
      top: Math.round(rect.top * 2),
      width: VW * 2,
      height: Math.ceil(rect.height * 2)
    })
    .resize({ width: VW })
    .toFile(OUT_PATH);
  fs.unlinkSync(fullPath);

  console.log(`saved ${path.basename(OUT_PATH)} (${VW} x ${Math.ceil(rect.height)})`);
  await browser.close();
})();
