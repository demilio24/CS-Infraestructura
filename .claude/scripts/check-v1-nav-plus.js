const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v1.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Desktop closed
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) e.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 600));
  let out = path.resolve(__dirname, '..', 'screenshots', 'v1-nav-plus-desktop-closed.png');
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1920, height: 200 } });
  console.log('Saved', out);

  // Desktop open (click trigger)
  await page.evaluate(() => document.getElementById('hamburger').click());
  await new Promise(r => setTimeout(r, 800));
  out = path.resolve(__dirname, '..', 'screenshots', 'v1-nav-plus-desktop-open.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved', out);

  // Mobile closed
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) e.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 600));
  out = path.resolve(__dirname, '..', 'screenshots', 'v1-nav-plus-mobile-closed.png');
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 390, height: 200 } });
  console.log('Saved', out);

  // Mobile open
  await page.evaluate(() => document.getElementById('hamburger').click());
  await new Promise(r => setTimeout(r, 800));
  out = path.resolve(__dirname, '..', 'screenshots', 'v1-nav-plus-mobile-open.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved', out);

  await browser.close();
})();