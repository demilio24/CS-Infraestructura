const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  // Desktop wide
  const d = await browser.newPage();
  await d.setViewport({ width: 1440, height: 900 });
  await d.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  // Capture hero in three viewports' worth
  for (const y of [0, 600, 1100]) {
    await d.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 400));
    await d.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/hero-d-${y}.png` });
  }

  // Mobile
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await m.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  for (const y of [0, 600, 1300]) {
    await m.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 400));
    await m.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/hero-m-${y}.png` });
  }

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
