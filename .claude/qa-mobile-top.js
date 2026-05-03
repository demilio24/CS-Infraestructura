const puppeteer = require('puppeteer');
const path = require('path');

const PAGES = ['home.html', 'after-school.html', 'camps.html', 'spirit-dance.html'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const p of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 414, height: 820, isMobile: true, hasTouch: true });
    const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', `m-${p.replace('.html','')}-hero.png`) });
    await page.close();
  }
  await browser.close();
})();
