const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const url = 'https://demilio24.github.io/Websites/Charles_Notary/charles.html';
  const browser = await puppeteer.launch({ headless: 'new' });
  const out = [];

  for (const [name, w, h] of [['live-iphone-14-pro', 390, 844], ['live-tablet', 768, 1024], ['live-laptop', 1440, 900]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.addStyleTag({ content: '.animate-on-scroll{opacity:1!important;transform:none!important;} header, .site-header, nav.fixed, [class*="sticky"]{ display:none !important; }' });
    await page.evaluate(() => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
      const img = document.querySelector('.pain-photo');
      if (img) { img.loading = 'eager'; img.scrollIntoView({ block: 'center' }); }
    });
    await page.waitForFunction(() => {
      const img = document.querySelector('.pain-photo');
      return img && img.complete && img.naturalWidth > 0;
    }, { timeout: 30000 });
    // Wait for any CSS transitions to settle
    await new Promise(r => setTimeout(r, 1000));
    const sectionFile = `screenshots/charles-${name}-section.png`;
    const tightFile = `screenshots/charles-${name}-tight.png`;
    const problemEl = await page.$('#problem');
    const imgColEl = await page.$('.pain-image-col');
    await problemEl.screenshot({ path: path.resolve(__dirname, sectionFile) });
    await imgColEl.screenshot({ path: path.resolve(__dirname, tightFile) });
    const box = await page.evaluate(() => {
      const el = document.querySelector('.pain-image-col');
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    out.push({ name, viewport: `${w}x${h}`, imgSize: `${box.w}x${box.h}`, section: sectionFile, tight: tightFile });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
