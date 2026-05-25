const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../Tom_Systema_Floyd/funnel/birthday-parties.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const out = [];

  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(file, { waitUntil: 'load', timeout: 30000 });
    await page.addStyleTag({ content: '.anim{opacity:1!important;transform:none!important;}' });
    await page.evaluate(() => document.getElementById('book')?.scrollIntoView({ block: 'start' }));
    await new Promise(r => setTimeout(r, 500));

    const sectionPath = `screenshots/party-book-${name}.png`;
    const el = await page.$('#book');
    await el.screenshot({ path: path.resolve(__dirname, sectionPath) });
    out.push({ name, viewport: `${w}x${h}`, file: sectionPath });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
