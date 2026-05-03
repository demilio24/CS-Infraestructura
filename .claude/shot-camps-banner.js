const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'camps.html').replace(/\\/g, '/');

  // Desktop
  const d = await browser.newPage();
  await d.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await d.goto(fileUrl, { waitUntil: 'networkidle0' });
  await d.evaluate(() => { try { localStorage.removeItem('sf-announce-dismissed'); } catch(e) {} location.reload(); });
  await d.waitForNetworkIdle({ idleTime: 500 });
  await d.screenshot({ path: path.join(__dirname, 'screenshots', 'camps-banner-desktop.png') });

  // Mobile
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await m.goto(fileUrl, { waitUntil: 'networkidle0' });
  await m.evaluate(() => { try { localStorage.removeItem('sf-announce-dismissed'); } catch(e) {} location.reload(); });
  await m.waitForNetworkIdle({ idleTime: 500 });
  await m.screenshot({ path: path.join(__dirname, 'screenshots', 'camps-banner-mobile.png') });

  await browser.close();
  console.log('done');
})();