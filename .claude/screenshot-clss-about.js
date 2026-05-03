const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.querySelector('#about').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '.claude/screenshots/clss-about-desktop.png', fullPage: false });
  await browser.close();
  console.log('done');
})();
