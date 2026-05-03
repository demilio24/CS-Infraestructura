const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    if (typeof openVideoModal === 'function') openVideoModal();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const state = await page.evaluate(() => {
    const v = document.getElementById('vp-modal-video');
    const btn = document.querySelector('#vp-modal .vp-speed-btn');
    return v
      ? {
          rate: v.playbackRate,
          time: v.currentTime,
          btnText: btn ? btn.textContent.trim() : '?',
        }
      : null;
  });
  console.log(JSON.stringify(state));
  await browser.close();
})();