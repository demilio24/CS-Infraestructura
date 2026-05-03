const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const filePath = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));

  const t0 = Date.now();
  await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const tDOM = Date.now() - t0;
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
  const tLoad = Date.now() - t0;

  const heroText = await page.evaluate(() => {
    const h = document.querySelector('.hero h1');
    return h ? h.textContent.trim() : '(no hero)';
  });

  const mapsLoaded = await page.evaluate(() =>
    Array.from(document.querySelectorAll('iframe.loc-map-iframe')).map(f => ({
      hasDataSrc: !!f.getAttribute('data-src'),
      src: f.src.slice(0, 60)
    }))
  );

  console.log('DOMContentLoaded:', tDOM, 'ms');
  console.log('window.load:', tLoad, 'ms');
  console.log('hero text:', heroText.replace(/\s+/g, ' '));
  console.log('maps lazy state:', JSON.stringify(mapsLoaded, null, 2));
  console.log('errors:', errors.length === 0 ? 'NONE' : errors);

  await browser.close();
})();
