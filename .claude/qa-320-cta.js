const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const b = document.querySelector('.cta-banner .btn-primary');
    if (b) b.scrollIntoView({block:'center'});
  });
  await new Promise(r => setTimeout(r, 500));
  const data = await page.evaluate(() => {
    const btn = document.querySelector('.cta-banner .btn-primary');
    const r = btn.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, right: r.right, vw: window.innerWidth };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'm320-home-cta-v2.png') });
  await browser.close();
})();
