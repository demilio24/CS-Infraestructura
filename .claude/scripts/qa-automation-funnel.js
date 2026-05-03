const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const abs = path.resolve(__dirname, '..', '..', 'Nils', 'funnel', 'automation-vsl-funnel-direct.html');
  const file = 'file:///' + abs.split(path.sep).join('/');
  const browser = await puppeteer.launch({ headless: 'new' });

  const dp = await browser.newPage();
  await dp.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await dp.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3500));
  await dp.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'automation-desktop-fullpage.png'), fullPage: true });

  const mp = await browser.newPage();
  await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mp.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3500));
  await mp.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'automation-mobile-fullpage.png'), fullPage: true });

  await browser.close();
  console.log('Done');
})().catch(e => { console.error(e); process.exit(1); });
