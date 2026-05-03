const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'camps.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelector('.page-hero-info')?.scrollIntoView({block:'center'}));
  await new Promise(r => setTimeout(r, 400));
  const data = await page.evaluate(() => {
    const info = document.querySelector('.page-hero-info');
    const li = info?.querySelector('li:nth-child(3)');
    const span = li?.querySelector('span');
    return {
      info: info && {
        textAlign: getComputedStyle(info).textAlign,
        w: info.getBoundingClientRect().width,
      },
      li: li && {
        textAlign: getComputedStyle(li).textAlign,
        w: li.getBoundingClientRect().width,
        display: getComputedStyle(li).display,
      },
      span: span && {
        textAlign: getComputedStyle(span).textAlign,
        text: span.textContent,
        w: span.getBoundingClientRect().width,
      },
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', 'camps-mobile-info.png') });
  await browser.close();
})();
