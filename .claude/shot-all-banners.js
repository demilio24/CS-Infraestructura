const puppeteer = require('puppeteer');
const path = require('path');

const pages = ['home', 'after-school', 'camps'];

(async () => {
  const browser = await puppeteer.launch();
  for (const p of pages) {
    const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p + '.html').replace(/\\/g, '/');

    for (const { label, w, h, m: isMobile } of [
      { label: 'desktop', w: 1440, h: 900, m: false },
      { label: 'mobile', w: 390, h: 844, m: true }
    ]) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: isMobile ? 2 : 1, isMobile });
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));
        await page.evaluate(() => { try { localStorage.removeItem('sf-announce-dismissed'); } catch(e) {} });
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(__dirname, 'screenshots', `banner-${p}-${label}.png`) });
        console.log(`✓ ${p} ${label}`);
      } catch (e) {
        console.log(`✗ ${p} ${label}: ${e.message}`);
      }
      await page.close();
    }
  }
  await browser.close();
  console.log('done');
})();
