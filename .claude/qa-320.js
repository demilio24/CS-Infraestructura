const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const p of ['home.html']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
    const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));
    // scroll to more-services
    await page.evaluate(() => document.querySelector('.more-services')?.scrollIntoView({block:'start'}));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', `m320-${p.replace('.html','')}-services.png`) });
    // scroll to cta
    await page.evaluate(() => document.querySelector('.cta-banner')?.scrollIntoView({block:'start'}));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', `m320-${p.replace('.html','')}-cta.png`) });
    await page.close();
  }
  await browser.close();
})();
