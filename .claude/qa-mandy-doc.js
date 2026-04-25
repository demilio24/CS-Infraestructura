const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/comparisons/mandy-revisions-2026-04-24.html';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/mandy-doc-top.png', fullPage: false });
  // Scroll midway to see a comparison block
  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/mandy-doc-mid.png', fullPage: false });
  await browser.close();
})();
