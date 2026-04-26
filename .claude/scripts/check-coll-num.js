const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-collections').classList.add('active');
    document.querySelectorAll('.fu').forEach(el => { el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; });
    if (typeof window.buildColl === 'function') window.buildColl();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to first item
  const out = path.resolve(__dirname, '..', 'screenshots', 'coll-num-desktop.png');
  await page.screenshot({ path: out, clip: { x: 0, y: 200, width: 1440, height: 900 } });
  console.log('Saved', out);
  await browser.close();
})();
