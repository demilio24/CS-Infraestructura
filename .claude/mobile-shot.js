const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const abs = path.resolve(__dirname, '..', 'Charles_Notary', 'charles.html');
  const file = 'file:///' + abs.split(path.sep).join('/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const out = [];

  for (const [name, w, h] of [['iphone-se', 375, 667], ['iphone-14-pro', 390, 844], ['tablet-portrait', 768, 1024], ['ipad-landscape', 1024, 768], ['laptop', 1440, 900], ['desktop', 1920, 1080]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(file, { waitUntil: 'networkidle0', timeout: 60000 });
    // Force-show animate-on-scroll items so the pain section is visible
    await page.addStyleTag({ content: '.animate-on-scroll{opacity:1!important;transform:none!important;}' });
    await page.evaluate(() => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
    });
    // Promote the pain photo from lazy to eager, scroll it into view, wait for load
    await page.evaluate(() => {
      const img = document.querySelector('.pain-photo');
      if (img) {
        img.loading = 'eager';
        if (img.src) img.src = img.src; // re-trigger load if needed
        img.scrollIntoView({ block: 'center' });
      }
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('.pain-photo');
      return img && img.complete && img.naturalWidth > 0;
    }, { timeout: 30000 });
    // Scroll to the problem section and screenshot the pain-image-col area
    const box = await page.evaluate(() => {
      const el = document.querySelector('.pain-image-col');
      if (!el) return null;
      el.scrollIntoView({block:'center'});
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
    });
    if (!box) { console.error('no .pain-image-col at', name); continue; }
    // Use element.screenshot() — far more reliable than manual clip math
    const sectionFile = `screenshots/charles-mobile-${name}.png`;
    const tightFile = `screenshots/charles-mobile-${name}-tight.png`;
    const problemEl = await page.$('#problem');
    const imgColEl = await page.$('.pain-image-col');
    await problemEl.screenshot({ path: path.resolve(__dirname, sectionFile) });
    await imgColEl.screenshot({ path: path.resolve(__dirname, tightFile) });
    out.push({ name, viewport: `${w}x${h}`, imgSize: `${Math.round(box.w)}x${Math.round(box.h)}`, section: sectionFile, tight: tightFile });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
