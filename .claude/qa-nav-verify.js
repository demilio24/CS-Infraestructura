const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Skip entry animation
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) { e.classList.add('out'); e.style.display = 'none'; }
  });
  await new Promise(r => setTimeout(r, 500));

  // 1) At top - nav should be dark
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  const atTop = await page.evaluate(() => ({ scrollY: window.scrollY, navClass: document.querySelector('nav.top').className }));
  console.log('at top:', atTop);
  await page.screenshot({ path: `${OUT}/nav-v-1-top.png`, clip: { x: 0, y: 0, width: 1440, height: 150 } });

  // 2) Scrolled - should be solid
  await page.evaluate(() => window.scrollTo(0, 1500));
  await new Promise(r => setTimeout(r, 500));
  const scrolled = await page.evaluate(() => ({ scrollY: window.scrollY, navClass: document.querySelector('nav.top').className }));
  console.log('scrolled:', scrolled);
  await page.screenshot({ path: `${OUT}/nav-v-2-scrolled.png`, clip: { x: 0, y: 0, width: 1440, height: 150 } });

  await browser.close();
})();
