const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const vp of [{ w:1440, h:900, label:'desktop' }, { w:390, h:844, label:'mobile' }]) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.getElementById('entry').style.display = 'none';
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-collections').classList.add('active');
      if (typeof window.buildColl === 'function') window.buildColl();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => { window.openViewer && window.openViewer(0); });
    await new Promise(r => setTimeout(r, 700));

    const out = path.resolve(__dirname, '..', 'screenshots', `viewer-current-${vp.label}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);

    const counter = await page.evaluate(() => {
      const c = document.getElementById('vCount');
      if (!c) return null;
      const cs = getComputedStyle(c);
      return { text: c.textContent, fontSize: cs.fontSize, color: cs.color, opacity: cs.opacity, bottom: cs.bottom };
    });
    console.log(`${vp.label} counter:`, counter);
  }

  await browser.close();
})();
