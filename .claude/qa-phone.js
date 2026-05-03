const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 820, isMobile: true, hasTouch: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const g = document.querySelector('.gallery');
    if (g) g.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'm-home-gallery-1.png') });

  // scroll a bit further to see the phone centered
  await page.evaluate(() => window.scrollBy(0, 200));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'm-home-gallery-2.png') });

  const data = await page.evaluate(() => {
    const p = document.querySelector('.training-demo-phone');
    if (!p) return { error: 'no phone' };
    const r = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    const video = p.querySelector('video');
    const vr = video ? video.getBoundingClientRect() : null;
    return { phone: { w: r.width, h: r.height, left: r.left, maxWidth: cs.maxWidth }, video: vr ? { w: vr.width, h: vr.height } : null, vw: window.innerWidth };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
