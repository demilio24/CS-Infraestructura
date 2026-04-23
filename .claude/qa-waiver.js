const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file:///F:/GitHub/Websites/Tom_Systema_Floyd/funnel/waiver.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function shot(name) {
    await page.screenshot({ path: `${OUT}/waiver-${name}.png`, fullPage: false });
  }

  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await shot('1-landing');

  // Click Florida and capture frames at multiple points during the transition
  await page.click('.state-row[data-state="florida"]');

  await new Promise(r => setTimeout(r, 100));
  await shot('2-mid-transition');

  await new Promise(r => setTimeout(r, 300));
  await shot('3-panel-open-loader');

  // Wait for iframe load
  await new Promise(r => setTimeout(r, 2500));
  await shot('4-iframe-loaded');

  // Click change-state (back)
  await page.click('#waiverBack');
  await new Promise(r => setTimeout(r, 200));
  await shot('5-returning');

  await new Promise(r => setTimeout(r, 600));
  await shot('6-back-to-landing');

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await shot('7-mobile-landing');

  await page.click('.state-row[data-state="florida"]');
  await new Promise(r => setTimeout(r, 2500));
  await shot('8-mobile-loaded');

  await browser.close();
  console.log('done');
})();
