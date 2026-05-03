const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await new Promise((r) => setTimeout(r, 1000));

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });

  await new Promise((r) => setTimeout(r, 500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Promise section with new quote + button
  const closing = await page.$('.diff-closing');
  if (closing) {
    await closing.scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await closing.screenshot({ path: path.join(outDir, 'promise-quote.png') });
    console.log('SAVED: promise-quote.png');
  }

  // 2. Modal open state — click the button then capture
  await page.evaluate(() => {
    if (typeof openVideoModal === 'function') openVideoModal();
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({
    path: path.join(outDir, 'video-modal-open.png'),
    fullPage: false,
  });
  console.log('SAVED: video-modal-open.png');

  await browser.close();
})();
