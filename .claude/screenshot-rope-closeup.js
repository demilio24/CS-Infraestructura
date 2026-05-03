const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  for (let i = 0; i < 3; i++) {
    const has = await page.evaluate((idx) => {
      const dividers = document.querySelectorAll('.rope-divider');
      if (dividers.length <= idx) return false;
      dividers[idx].scrollIntoView({ block: 'center' });
      return true;
    }, i);
    if (!has) break;
    await new Promise(r => setTimeout(r, 500));
    const clip = await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      const r = d.getBoundingClientRect();
      // Capture the divider plus generous padding above/below so the buoy is centered in frame
      return { x: 0, y: Math.max(0, r.top - 100), width: 1440, height: r.height + 200 };
    }, i);
    await page.screenshot({ path: `F:/GitHub/Websites/.claude/screenshots/clss-rope-close-${i}.png`, clip });
  }

  await browser.close();
  console.log('done');
})();
