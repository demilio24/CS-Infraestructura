const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1400, deviceScaleFactor: 2 });

  const filePath =
    'file:///' +
    path
      .resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/promise-mosaic-variations.html')
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await new Promise((r) => setTimeout(r, 1500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/promise-variations');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Each variation
  const sections = await page.$$('.promise-section');
  for (let i = 0; i < sections.length; i++) {
    const label = String.fromCharCode(65 + i); // A, B, C
    await sections[i].scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await sections[i].screenshot({ path: path.join(outDir, `desktop-${label}.png`) });
    console.log(`SAVED desktop-${label}.png`);
  }

  // Mobile pass
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const mSections = await page.$$('.promise-section');
  for (let i = 0; i < mSections.length; i++) {
    const label = String.fromCharCode(65 + i);
    await mSections[i].scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await mSections[i].screenshot({ path: path.join(outDir, `mobile-${label}.png`) });
    console.log(`SAVED mobile-${label}.png`);
  }

  await browser.close();
})();
