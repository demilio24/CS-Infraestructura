const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelector('.gallery')?.scrollIntoView({block:'start'}));
  await new Promise(r => setTimeout(r, 500));
  const data = await page.evaluate(() => {
    const phone = document.querySelector('.training-demo-phone');
    const side = document.querySelector('.gallery-phone-side');
    const gallery = document.querySelector('.gallery');
    const video = phone?.querySelector('video');
    const r = (el) => el ? (() => { const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; })() : null;
    return {
      phone: r(phone),
      phoneStyle: phone && { padding: getComputedStyle(phone).padding, ar: getComputedStyle(phone).aspectRatio, maxW: getComputedStyle(phone).maxWidth },
      video: r(video),
      side: r(side),
      gallery: r(gallery),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'home-mobile-gallery.png') });
  // Scroll down a bit to see below phone
  await page.evaluate(() => window.scrollBy(0, 300));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'home-mobile-gallery2.png') });
  await browser.close();
})();
