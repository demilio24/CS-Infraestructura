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
  await new Promise((r) => setTimeout(r, 1200));

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });
  await new Promise((r) => setTimeout(r, 400));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/three-changes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const MAX = 2000;
  const targets = [
    { sel: '.proof-section', name: '01-proof-with-featured-review' },
    { sel: '.diff-closing', name: '02-promise-section' },
    { sel: '.step-section.step-01 .step01-copy', name: '03-find-the-constraints' },
  ];

  for (const t of targets) {
    const el = await page.$(t.sel);
    if (!el) {
      console.log(`MISS ${t.name}`);
      continue;
    }
    await el.scrollIntoView();
    await new Promise((r) => setTimeout(r, 350));
    const box = await el.boundingBox();
    if (!box) continue;
    if (box.height > MAX) {
      const parts = Math.ceil(box.height / MAX);
      for (let i = 0; i < parts; i++) {
        const y = box.y + i * MAX;
        const h = Math.min(MAX, box.height - i * MAX);
        await page.screenshot({
          path: path.join(outDir, `${t.name}-part${i + 1}.png`),
          clip: { x: box.x, y, width: Math.min(box.width, MAX), height: h },
        });
        console.log(`SAVED ${t.name}-part${i + 1}.png  ${Math.round(box.width)}x${Math.round(h)}`);
      }
    } else {
      await el.screenshot({ path: path.join(outDir, `${t.name}.png`) });
      console.log(`SAVED ${t.name}.png  ${Math.round(box.width)}x${Math.round(box.height)}`);
    }
  }

  await browser.close();
})();
