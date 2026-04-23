const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Tom_Systema_Floyd/funnel/waiver.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  await page.click('.state-row[data-state="florida"]');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/waiver-visual-mid.png`, fullPage: false });

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: `${OUT}/waiver-visual-done.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
