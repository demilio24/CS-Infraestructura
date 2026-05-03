const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => document.querySelector('.sf-footer').scrollIntoView());
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.sf-footer-social')).map((a) => {
      const r = a.getBoundingClientRect();
      const svg = a.querySelector('svg');
      const sr = svg.getBoundingClientRect();
      const cs = getComputedStyle(a);
      const svgCS = getComputedStyle(svg);
      return {
        tile: { w: r.width, h: r.height, display: cs.display, placeItems: cs.placeItems, alignItems: cs.alignItems, justifyContent: cs.justifyContent, padding: cs.padding },
        svg: { w: sr.width, h: sr.height, display: svgCS.display, viewBox: svg.getAttribute('viewBox') },
        offsetInTile: { left: sr.left - r.left, top: sr.top - r.top, rightGap: (r.right - sr.right), bottomGap: (r.bottom - sr.bottom) },
      };
    });
  });
  console.log(JSON.stringify(data, null, 2));

  // Crop screenshot around footer socials
  const box = await page.evaluate(() => {
    const el = document.querySelector('.sf-footer-socials');
    const r = el.getBoundingClientRect();
    return { x: r.left - 8, y: r.top - 8, width: r.width + 16, height: r.height + 16 };
  });
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'socials.png'), clip: box });
  await browser.close();
})();
