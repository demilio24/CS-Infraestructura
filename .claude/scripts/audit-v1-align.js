const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v1.html').replace(/\\/g, '/');
const W = 1920, H = 1080;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) e.style.display = 'none';
    document.querySelectorAll('.anim').forEach(el => el.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 800));

  // Chunked full-page shots
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);
  const chunkH = 2400;
  for (let y = 0, i = 0; y < fullHeight; y += chunkH, i++) {
    const h = Math.min(chunkH, fullHeight - y);
    await page.setViewport({ width: W, height: h });
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await new Promise(r => setTimeout(r, 400));
    const out = path.resolve(__dirname, '..', 'screenshots', `v1-fix-${String(i).padStart(2,'0')}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);
  }
  await browser.close();
})();