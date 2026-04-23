const puppeteer = require('puppeteer');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots/velus-coll-hover.png';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('vp', 'collections');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(el => el.classList.add('in'));
    const entry = document.getElementById('entry');
    if (entry) entry.style.display = 'none';
    // Force first coll-item's ttl visible via tap class (same as hover)
    // Force all coll-item titles visible
    document.querySelectorAll('.coll-item .ttl').forEach(t => {
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
    });
  });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: OUT, fullPage: true });
  await browser.close();
  console.log('done');
})();
