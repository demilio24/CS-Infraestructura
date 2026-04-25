const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'reflection-2026-04-23');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function captureAt(viewport, tag) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Make everything visible, kill the scroll-tied V monogram animation
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    // Override the inline style on the .velus-v SVG g that the scroll handler keeps setting
    const style = document.createElement('style');
    style.textContent = `.velus-v { opacity: 0 !important; visibility: hidden !important; } section.monogram { display: none !important; }`;
    document.head.appendChild(style);
  });
  await new Promise(r => setTimeout(r, 300));

  const rect = await page.evaluate(() => {
    const sec = document.querySelector('section.testimonies-section');
    const r = sec.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  });
  console.log(`  ${tag} testimonies-section at doc y=${Math.round(rect.top)} h=${Math.round(rect.height)}`);

  // Take a full-page screenshot and crop the section area from it
  const fullOut = path.join(OUT, `__full-${tag}.png`);
  await page.screenshot({ path: fullOut, fullPage: true });

  const sharp = require('sharp');
  const out = path.join(OUT, `image-one-real-${tag}.png`);
  await sharp(fullOut)
    .extract({ left: 0, top: Math.round(rect.top), width: viewport.width, height: Math.ceil(rect.height) })
    .toFile(out);
  require('fs').unlinkSync(fullOut);
  console.log(`saved ${path.basename(out)} (${viewport.width}x${Math.ceil(rect.height)})`);
  await browser.close();
}

(async () => {
  await captureAt({ width: 390, height: 1400 }, 'mobile');
  await captureAt({ width: 1440, height: 1400 }, 'desktop');
})();
