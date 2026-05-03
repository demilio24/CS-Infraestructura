const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
    if (typeof openVideoModal === 'function') openVideoModal();
  });

  await new Promise((r) => setTimeout(r, 2500));

  // Read the actual currentTime so we can verify
  const t = await page.evaluate(() => {
    const v = document.getElementById('vp-modal-video');
    return v ? { currentTime: v.currentTime, duration: v.duration } : null;
  });
  console.log('Video state:', JSON.stringify(t));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  await page.screenshot({ path: path.join(outDir, 'video-modal-25s.png') });
  console.log('SAVED: video-modal-25s.png');

  await browser.close();
})();
