const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });
  await new Promise((r) => setTimeout(r, 1000));

  const info = await page.evaluate(() => {
    const out = {};
    out.windowInner = window.innerWidth;
    out.docScroll = document.documentElement.scrollWidth;
    out.docClient = document.documentElement.clientWidth;
    const sels = [
      '#ghl-breakout',
      '.poc-cases',
      '.diff-cmp-table',
      '.step-inner',
      '.step01-inner',
      '.matrix-cards',
      '.cases-2',
    ];
    out.elements = {};
    sels.forEach((s) => {
      const el = document.querySelector(s);
      if (el) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        out.elements[s] = {
          width: Math.round(r.width),
          gridCols: cs.gridTemplateColumns,
          minWidth: cs.minWidth,
        };
      } else {
        out.elements[s] = 'NOT FOUND';
      }
    });
    out.matchesMobile = window.matchMedia('(max-width: 768px)').matches;
    out.matchesSm = window.matchMedia('(max-width: 600px)').matches;
    out.matches900 = window.matchMedia('(max-width: 900px)').matches;
    return out;
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
