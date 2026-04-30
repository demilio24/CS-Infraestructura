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
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const first = document.querySelector('.coll-item');
    if (first) first.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const stats = await page.evaluate(() => ({
    collNum: document.querySelectorAll('.coll-num').length,
    collCount: document.querySelectorAll('.coll-count').length,
    cards: document.querySelectorAll('.coll-item').length,
  }));
  console.log('Desktop:', JSON.stringify(stats));

  const out = path.resolve(__dirname, '..', 'screenshots', 'coll-clean-desktop.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log('Saved', out);

  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    const first = document.querySelector('.coll-item');
    if (first) first.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const outM = path.resolve(__dirname, '..', 'screenshots', 'coll-clean-mobile.png');
  await page.screenshot({ path: outM, fullPage: false });
  console.log('Saved', outM);

  await browser.close();
})();
