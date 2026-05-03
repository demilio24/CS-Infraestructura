const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Test 4 dividers at production size, capture a zoomed-in 300px-tall strip showing the seam
  for (let i = 0; i < 4; i++) {
    await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      d.scrollIntoView({ block: 'center' });
    }, i);
    await new Promise(r => setTimeout(r, 400));
    const clip = await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      const r = d.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      // Capture a 300x600 strip around the seam, only the leftmost portion to zoom in
      return { x: 0, y: Math.max(0, cy - 100), width: 600, height: 200 };
    }, i);
    await page.screenshot({ path: `F:/GitHub/Websites/.claude/screenshots/rope-direct-${i}.png`, clip });
  }
  await browser.close();
})();
