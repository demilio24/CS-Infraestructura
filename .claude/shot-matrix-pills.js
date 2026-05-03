const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await new Promise((r) => setTimeout(r, 1000));

  // Force-show all .anim elements
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });

  await new Promise((r) => setTimeout(r, 500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const matrix = await page.$('.matrix-section');
  if (matrix) {
    await matrix.scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await matrix.screenshot({ path: path.join(outDir, 'matrix-pills.png') });
    console.log('SAVED: matrix-pills.png');
  } else {
    console.log('ERROR: .matrix-section not found');
  }

  // Also a tighter shot just of the two cards
  const cards = await page.$('.matrix-cards');
  if (cards) {
    await cards.scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await cards.screenshot({ path: path.join(outDir, 'matrix-cards.png') });
    console.log('SAVED: matrix-cards.png');
  }

  await browser.close();
})();
