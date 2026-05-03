// Generic section screenshot helper for Mandy revisions.
// Usage: node qa-section-mobile.js <selector> <outFolder> <outName>
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const [, , selector, outFolder, outName, activatePage] = process.argv;
if (!selector || !outFolder || !outName) { console.error('usage: <selector> <outFolder> <outName>'); process.exit(1); }

const OUT = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', outFolder);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 439, height: 1100 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  await page.evaluate((pageName) => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const style = document.createElement('style');
    style.textContent = `.velus-v{opacity:0!important;visibility:hidden!important}#entry{display:none!important}`;
    document.head.appendChild(style);
    if (pageName && typeof showPage === 'function') showPage(pageName);
  }, activatePage);
  await new Promise(r => setTimeout(r, 600));

  const fullOut = path.join(OUT, '__full.png');
  await page.screenshot({ path: fullOut, fullPage: true });

  const rect = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  }, selector);
  if (!rect) { console.error('element not found:', selector); process.exit(1); }

  const top = Math.max(0, Math.round(rect.top) - 80);
  const height = Math.ceil(rect.height) + 120;
  const out = path.join(OUT, outName);
  await sharp(fullOut)
    .extract({ left: 0, top, width: 439, height: Math.min(height, (await sharp(fullOut).metadata()).height - top) })
    .toFile(out);
  fs.unlinkSync(fullOut);
  console.log(`saved ${path.basename(out)} (439x${height})`);
  await browser.close();
})();
