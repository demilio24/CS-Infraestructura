const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  const data = await page.evaluate(() => {
    const vw = window.innerWidth;
    const offenders = [];
    document.querySelectorAll('a.more-service, a.btn.btn-primary, .more-service-text, .more-service-text h4, .more-service-text p, .btn-primary').forEach((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      offenders.push({
        sel: el.tagName.toLowerCase() + '.' + (el.className || '').split(' ').slice(0,2).join('.'),
        right: Math.round(r.right), w: Math.round(r.width),
        overflows: r.right > vw + 1,
        text: (el.textContent || '').trim().slice(0, 50)
      });
    });
    return { vw, offenders };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
