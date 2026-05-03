const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'after-school.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  const data = await page.evaluate(() => {
    function rect(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height };
    }
    return {
      heroInner: rect('.page-hero-inner'),
      copy: rect('.page-hero-copy'),
      sub: rect('.page-hero-sub'),
      extras: rect('.page-hero-extras'),
      quick: rect('.page-hero-quick'),
      swipe: rect('.hero-swipe'),
      form: rect('.page-hero-form'),
      gridCS: (() => {
        const el = document.querySelector('.page-hero-inner');
        const cs = getComputedStyle(el);
        return { gap: cs.gap, rowGap: cs.rowGap, columnGap: cs.columnGap, templateAreas: cs.gridTemplateAreas, templateRows: cs.gridTemplateRows, alignItems: cs.alignItems };
      })(),
    };
  });
  console.log(JSON.stringify(data, null, 2));

  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'afterschool-desktop.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await browser.close();
})();
