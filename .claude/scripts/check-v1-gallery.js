const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v1.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(FILE_URL + '#gallery', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) e.style.display = 'none';
    // Close any open form modals just in case
    document.querySelectorAll('.modal,.form-modal,[class*="modal"]').forEach(m => { m.style.display = 'none'; });
    document.querySelectorAll('.anim').forEach(el => el.classList.add('in'));
    const g = document.getElementById('galleryGrid');
    if (g) g.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => window.scrollBy(0, -160));
  await new Promise(r => setTimeout(r, 400));
  const out = path.resolve(__dirname, '..', 'screenshots', 'v1-gallery-cooper-first.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved', out);
  await browser.close();
})();