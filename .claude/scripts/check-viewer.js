const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

async function snap(browser, w, h, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-collections').classList.add('active');
    document.querySelectorAll('.fu').forEach(el => { el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; });
    if (typeof window.buildColl === 'function') window.buildColl();
  });
  await new Promise(r => setTimeout(r, 1500));
  // Open the viewer with the first project
  await page.evaluate(() => {
    if (typeof window.openViewer === 'function') window.openViewer(0);
  });
  await new Promise(r => setTimeout(r, 1500));
  const out = path.resolve(__dirname, '..', 'screenshots', `viewer-${tag}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved', out);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  await snap(browser, 1440, 900, 'desktop');
  await snap(browser, 390, 844, 'mobile');
  await browser.close();
})();
