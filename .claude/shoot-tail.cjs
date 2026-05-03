const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  for (const y of [9700, 10000, 10300, 10600, 10900]) {
    await page.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/desktop-tail-${y}.png` });
    console.log('shot tail', y);
  }
  // Mobile matrix
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await mobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  const mh = await mobile.evaluate(() => document.getElementById('ghl-breakout').scrollHeight);
  console.log('mobile height', mh);
  for (const y of [0, 800, 1500, 2200, 2900, 3600, 4300, 5000, 5700, mh - 1700, mh - 800]) {
    await mobile.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 500));
    await mobile.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/mob-${y}.png` });
    console.log('shot mob', y);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
