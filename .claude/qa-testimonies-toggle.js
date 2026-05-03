const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const el = document.querySelector('.testimonies');
    if (el) el.scrollIntoView({ block: 'center' });
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/testi-1-closed.png`, fullPage: false });

  const btn = await page.$('.t-toggle');
  const box = await btn.boundingBox();
  console.log('toggle box', box);

  await page.evaluate(() => document.querySelector('.t-toggle').click());
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: `${OUT}/testi-2-mid.png`, fullPage: false });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `${OUT}/testi-3-open.png`, fullPage: false });

  await page.evaluate(() => document.querySelector('.t-toggle').click());
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: `${OUT}/testi-4-closing.png`, fullPage: false });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `${OUT}/testi-5-closed-again.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
