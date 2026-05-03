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
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/featured-review-variations.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));

  const outDir = path.resolve(
    'f:/GitHub/Websites/.claude/screenshots/featured-variations'
  );
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    { sel: '.v1', name: 'v1-polaroid-refined' },
    { sel: '.v2', name: 'v2-flat-card' },
    { sel: '.v3', name: 'v3-mirror-editorial' },
    { sel: '.v4', name: 'v4-asymmetric-magazine' },
  ];

  const MAX = 2000;
  for (const t of targets) {
    const el = await page.$(t.sel);
    if (!el) {
      console.log(`MISS ${t.name}: selector not found`);
      continue;
    }
    const box = await el.boundingBox();
    if (!box) {
      console.log(`MISS ${t.name}: no bounding box`);
      continue;
    }
    await el.scrollIntoView();
    await new Promise((r) => setTimeout(r, 300));
    if (box.width > MAX || box.height > MAX) {
      console.log(
        `WARN ${t.name}: ${Math.round(box.width)}x${Math.round(box.height)} exceeds ${MAX}, splitting`
      );
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
