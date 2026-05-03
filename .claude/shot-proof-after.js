const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1.5 });

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await new Promise((r) => setTimeout(r, 1000));

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });

  await new Promise((r) => setTimeout(r, 500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const proof = await page.$('.proof-section');
  if (proof) {
    await proof.scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await proof.screenshot({ path: path.join(outDir, 'proof-after.png') });
    console.log('SAVED: proof-after.png');
  }

  await browser.close();
})();
