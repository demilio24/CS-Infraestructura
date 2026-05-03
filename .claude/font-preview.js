const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  // Give web fonts time to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Hero shot
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/font-hero.png', clip: { x: 0, y: 60, width: 1440, height: 740 } });

  // H2 sample shot — find a section title and capture it
  const has = await page.$('.section-title, h2');
  if (has) {
    await page.evaluate(() => {
      const h = document.querySelector('h2');
      if (h) h.scrollIntoView({ block: 'center' });
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/font-h2.png', clip: { x: 0, y: 200, width: 1440, height: 500 } });
  }

  await browser.close();
  console.log('done');
})();
