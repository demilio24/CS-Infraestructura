const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../Tom_Systema_Floyd/funnel/private-lessons.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const out = [];

  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(file, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.addStyleTag({ content: '.anim{opacity:1!important;transform:none!important;}' });
    // scroll the Georgia state group into view
    await page.evaluate(() => {
      const groups = document.querySelectorAll('.state-group');
      const last = groups[groups.length - 1];
      last?.scrollIntoView({ block: 'start' });
    });
    await new Promise(r => setTimeout(r, 800));
    const sectionPath = `screenshots/pl-georgia-${name}.png`;
    const el = await page.evaluateHandle(() => {
      const groups = document.querySelectorAll('.state-group');
      return groups[groups.length - 1];
    });
    await el.asElement().screenshot({ path: path.resolve(__dirname, sectionPath) });
    out.push({ name, viewport: `${w}x${h}`, file: sectionPath });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
