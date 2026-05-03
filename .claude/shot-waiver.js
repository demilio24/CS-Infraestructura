const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', 'waiver.html').replace(/\\/g, '/');

  for (const { label, w, h, m } of [
    { label: 'desktop', w: 1440, h: 900, m: false },
    { label: 'mobile', w: 390, h: 844, m: true }
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: m ? 2 : 1, isMobile: m });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(__dirname, 'screenshots', `waiver-select-${label}.png`), fullPage: false });
    console.log(`✓ select ${label}`);

    // Track scrollY over a 4-second window after clicking a state
    const scrollLog = [];
    await page.exposeFunction('logScroll', (y, t) => scrollLog.push({ t, y }));
    await page.evaluate(() => {
      const startT = performance.now();
      const id = setInterval(() => {
        window.logScroll(window.scrollY, Math.round(performance.now() - startT));
        if (performance.now() - startT > 4000) clearInterval(id);
      }, 150);
    });

    await page.evaluate(() => document.querySelector('.state-row').click());
    await new Promise(r => setTimeout(r, 4300));

    await page.screenshot({ path: path.join(__dirname, 'screenshots', `waiver-open-${label}.png`) });
    console.log(`✓ open ${label} — scrollY over time:`);
    const samples = scrollLog.filter((_, i) => i % 2 === 0).slice(0, 14);
    console.log(samples.map(s => `   ${String(s.t).padStart(5)}ms → ${s.y}`).join('\n'));

    await page.close();
  }
  await browser.close();
  console.log('done');
})();
