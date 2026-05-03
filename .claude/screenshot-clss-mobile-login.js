const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const filePath = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));

  // Closed state
  await page.screenshot({ path: '.claude/screenshots/clss-mobile-nav-closed.png', clip: { x: 0, y: 0, width: 390, height: 200 } });

  // Debug bounding box
  const box = await page.evaluate(() => {
    const el = document.getElementById('mobileLoginBtn');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, vis: getComputedStyle(el).display };
  });
  console.log('btn box:', JSON.stringify(box));

  // Open the login dropdown via DOM click
  await page.evaluate(() => document.getElementById('mobileLoginBtn').click());
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: '.claude/screenshots/clss-mobile-nav-login-open.png', clip: { x: 0, y: 0, width: 390, height: 480 } });

  await browser.close();
  console.log('done');
})();
