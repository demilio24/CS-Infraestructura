const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Boost the divider height way up so we can see the buoy clearly
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = '.rope-divider { --rope-tile-height: 120px !important; }';
    document.head.appendChild(style);
  });

  await page.evaluate(() => document.querySelector('.rope-divider').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 500));
  const c = await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    const r = d.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top - 80), width: 1440, height: r.height + 200 };
  });
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/clss-rope-zoom.png', clip: c });

  await browser.close();
  console.log('done');
})();
