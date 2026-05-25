// Verify Charles's button changes: render charles.html and screenshot key sections.
const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', 'Charles_Notary', 'charles.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, 'screenshots');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    // ---------- Desktop ----------
    const desk = await browser.newPage();
    await desk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await desk.goto(FILE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    // Header (nav CTA)
    await desk.screenshot({ path: path.join(OUT, 'charles-rev-desk-01-nav.png'), clip: { x: 0, y: 0, width: 1440, height: 110 } });

    // Find each CTA we changed and screenshot around it
    const selectors = [
      'a[href="tel:+13056133300"].btn-primary',
      'a[href="tel:+13056133300"].btn-white',
      'a[href="tel:+13056133300"]:not(.btn):not(.nav-cta)'
    ];
    let idx = 2;
    for (const sel of selectors) {
      const handles = await desk.$$(sel);
      for (const h of handles) {
        const box = await h.boundingBox();
        if (!box) continue;
        await desk.evaluate(el => el.scrollIntoView({ block: 'center' }), h);
        await new Promise(r => setTimeout(r, 400));
        const fresh = await h.boundingBox();
        if (!fresh) continue;
        const y = Math.max(0, fresh.y - 80);
        const height = Math.min(280, 900 - 80);
        await desk.screenshot({ path: path.join(OUT, `charles-rev-desk-${String(idx).padStart(2,'0')}.png`), clip: { x: 0, y, width: 1440, height } });
        idx++;
      }
    }
    await desk.close();

    // ---------- Mobile ----------
    const mob = await browser.newPage();
    await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await mob.goto(FILE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));
    await mob.screenshot({ path: path.join(OUT, 'charles-rev-mob-01-nav.png'), clip: { x: 0, y: 0, width: 390, height: 110 } });
    await mob.screenshot({ path: path.join(OUT, 'charles-rev-mob-02-hero.png'), clip: { x: 0, y: 0, width: 390, height: 844 } });

    let i = 3;
    for (const sel of ['a[href="tel:+13056133300"].btn-primary', 'a[href="tel:+13056133300"].btn-white']) {
      const handles = await mob.$$(sel);
      for (const h of handles) {
        await mob.evaluate(el => el.scrollIntoView({ block: 'center' }), h);
        await new Promise(r => setTimeout(r, 350));
        const b = await h.boundingBox();
        if (!b) continue;
        const y = Math.max(0, b.y - 80);
        const height = Math.min(420, 844 - 80);
        await mob.screenshot({ path: path.join(OUT, `charles-rev-mob-${String(i).padStart(2,'0')}.png`), clip: { x: 0, y, width: 390, height } });
        i++;
      }
    }
    await mob.close();

    console.log('done');
  } catch (e) {
    console.error('error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
