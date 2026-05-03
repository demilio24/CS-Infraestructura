const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { const e = document.getElementById('entry'); if (e) e.style.display='none'; });
  await new Promise(r => setTimeout(r, 300));

  // Click the nav trigger (+ sign) to open menu
  await page.evaluate(() => document.getElementById('menuTrigger').click());
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/menu-open-desktop.png`, clip: { x: 0, y: 0, width: 1440, height: 300 } });

  // Count X-like elements near top-right
  const info = await page.evaluate(() => {
    const trigger = document.querySelector('.nav-trigger');
    const menuClose = document.querySelector('.menu-close');
    return {
      triggerVisible: trigger ? getComputedStyle(trigger).display !== 'none' : false,
      triggerRotate: trigger ? getComputedStyle(trigger).transform : null,
      triggerText: trigger ? trigger.textContent.trim() : null,
      menuCloseExists: !!menuClose,
      bodyLocked: document.body.classList.contains('locked')
    };
  });
  console.log(info);

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { const e = document.getElementById('entry'); if (e) e.style.display='none'; });
  await page.evaluate(() => document.getElementById('menuTrigger').click());
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/menu-open-mobile.png`, clip: { x: 0, y: 0, width: 390, height: 300 } });

  await browser.close();
})();
