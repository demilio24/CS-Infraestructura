const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 900, isMobile: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'after-school.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  const data = await page.evaluate(() => {
    function r(sel) { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, w: b.width }; }
    return {
      inner: r('.page-hero-inner'),
      copy: r('.page-hero-copy'),
      sub: r('.page-hero-sub'),
      form: r('.page-hero-form'),
      extras: r('.page-hero-extras'),
      main: r('.page-hero-main'),
      vp: { w: window.innerWidth }
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
