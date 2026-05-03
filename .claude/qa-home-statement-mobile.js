// Capture the home VELUS INTERIORS statement section on mobile
// and save to Mandy_VeLUS_Design/comparisons/statement-2026-04-24/
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'statement-2026-04-24');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 439, height: 907 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const style = document.createElement('style');
    style.textContent = `.velus-v{opacity:0!important;visibility:hidden!important}section.monogram{display:none!important}#entry{display:none!important}`;
    document.head.appendChild(style);
  });
  await new Promise(r => setTimeout(r, 300));

  // Scroll so nav + statement sit in one viewport-ish frame (match Mandy's framing)
  await page.evaluate(() => {
    const section = document.querySelector('#page-home section.statement');
    section.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, -90); // leave room for the fixed nav on top
  });
  await new Promise(r => setTimeout(r, 400));

  // Full-page screenshot + crop the slice that shows nav + statement + cta
  const rect = await page.evaluate(() => {
    const section = document.querySelector('#page-home section.statement');
    const cta = document.querySelector('#page-home section.statement .cta-wrap');
    return {
      sTop: section.getBoundingClientRect().top + window.scrollY,
      cBottom: cta.getBoundingClientRect().bottom + window.scrollY
    };
  });

  const fullOut = path.join(OUT, '__full.png');
  await page.screenshot({ path: fullOut, fullPage: true });

  const top = Math.max(0, Math.round(rect.sTop) - 80);
  const bottom = Math.round(rect.cBottom) + 40;
  const out = path.join(OUT, 'image-two-real-mobile.png');
  await sharp(fullOut)
    .extract({ left: 0, top, width: 439, height: Math.ceil(bottom - top) })
    .toFile(out);
  fs.unlinkSync(fullOut);
  console.log(`saved ${path.basename(out)} (439x${Math.ceil(bottom - top)})`);

  await browser.close();
})();
