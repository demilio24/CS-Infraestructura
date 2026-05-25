const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', 'Charles_Notary', 'charles.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, 'screenshots');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    // Snap each tel: CTA in the body, centered with generous padding
    const ctas = await page.$$('a[href="tel:+13056133300"].btn, a[href="tel:+13056133300"].nav-cta, .footer-links a[href="tel:+13056133300"]');
    let i = 1;
    for (const h of ctas) {
      await page.evaluate(el => el.scrollIntoView({ block: 'center' }), h);
      await new Promise(r => setTimeout(r, 400));
      const b = await h.boundingBox();
      if (!b) continue;
      const y = Math.max(0, b.y - 220);
      const height = Math.max(120, Math.min(500, 900 - y));
      if (height <= 0) continue;
      await page.screenshot({ path: path.join(OUT, `charles-rev-v2-${String(i).padStart(2,'0')}.png`), clip: { x: 0, y, width: 1440, height } });
      i++;
    }
    console.log('count', ctas.length);
  } catch (e) {
    console.error('error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
