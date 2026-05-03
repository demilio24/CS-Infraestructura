const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });
  await new Promise((r) => setTimeout(r, 400));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/seam');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Find the cost-section top in absolute page coordinates
  const costTop = await page.evaluate(() => {
    const el = document.querySelector('.cost-section');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.top + window.scrollY;
  });

  if (costTop == null) {
    console.log('No .cost-section found');
    return;
  }

  // Make the page tall enough that the seam region is paintable, then clip
  // directly to its document-absolute coordinates
  await page.setViewport({ width: 1440, height: Math.ceil(costTop + 800), deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(outDir, 'seam-tight.png'),
    clip: { x: 0, y: Math.max(0, costTop - 200), width: 1440, height: 400 },
  });
  console.log(`SAVED seam-tight.png  clip.y=${Math.round(costTop - 200)} 1440x400`);

  await page.screenshot({
    path: path.join(outDir, 'seam-context.png'),
    clip: { x: 0, y: Math.max(0, costTop - 400), width: 1440, height: 800 },
  });
  console.log(`SAVED seam-context.png clip.y=${Math.round(costTop - 400)} 1440x800`);

  await browser.close();
})();
