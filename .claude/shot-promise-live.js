const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const filePath =
    'file:///' +
    path
      .resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html')
      .replace(/\\/g, '/');

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/promise-live');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Desktop
  let page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });
  await new Promise((r) => setTimeout(r, 1500));
  // Scroll-paint
  await page.evaluate(async () => {
    const t = document.documentElement.scrollHeight;
    for (let y = 0; y <= t; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const about = await page.$('.about');
  if (about) {
    await about.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));
    const diffBottom = await page.$('.diff-bottom');
    if (diffBottom) {
      await diffBottom.scrollIntoView();
      await new Promise((r) => setTimeout(r, 400));
      await diffBottom.screenshot({ path: path.join(outDir, 'desktop.png') });
      console.log('SAVED desktop.png');
    }
  }
  await page.close();

  // Mobile — taller viewport so element.screenshot captures the whole .diff-bottom
  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 1600, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  );
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    let m = document.querySelector('meta[name=viewport]');
    if (!m) { m = document.createElement('meta'); m.name='viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(async () => {
    const t = document.documentElement.scrollHeight;
    for (let y = 0; y <= t; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const diffM = await page.$('.diff-bottom');
  if (diffM) {
    await diffM.scrollIntoView();
    await new Promise((r) => setTimeout(r, 600));
    await diffM.screenshot({ path: path.join(outDir, 'mobile.png') });
    console.log('SAVED mobile.png');
  }

  await browser.close();
})();
