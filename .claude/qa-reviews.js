const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v1.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach(el => el.classList.add('anim-visible'));
    document.getElementById('reviews').scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/v1-reviews-desktop.png`, fullPage: false });

  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.getElementById('reviews').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/v1-reviews-mobile.png`, fullPage: false });

  await browser.close();
})();
