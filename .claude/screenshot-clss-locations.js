const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.querySelector('#locations').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 2500));
  // capture each card's bounding box for verification
  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.loc-card')).map(c => {
      const r = c.getBoundingClientRect();
      const img = c.querySelector('.loc-card-img').getBoundingClientRect();
      const btn = c.querySelector('.btn');
      const btnR = btn ? btn.getBoundingClientRect() : null;
      const map = c.querySelector('.loc-card-map');
      const mapR = map ? map.getBoundingClientRect() : null;
      return { name: c.querySelector('h3').textContent.trim(), top: r.top, height: r.height, bottom: r.bottom, imgTop: img.top, btnTop: btnR ? btnR.top : null, mapTop: mapR ? mapR.top : null };
    });
  });
  console.log('cards:', JSON.stringify(cards, null, 2));
  await page.screenshot({ path: '.claude/screenshots/clss-locations-desktop.png', fullPage: false });
  await browser.close();
  console.log('done');
})();
