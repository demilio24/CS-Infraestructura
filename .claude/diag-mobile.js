const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');

  const filePath = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.evaluate(() => {
    let m = document.querySelector('meta[name=viewport]');
    if (!m) { m = document.createElement('meta'); m.name='viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
  });

  await new Promise(r => setTimeout(r, 1500));

  const data = await page.evaluate(() => {
    const result = {};

    const grid = document.querySelector('.proof-reviews-grid');
    if (grid) {
      const cs = getComputedStyle(grid);
      const r = grid.getBoundingClientRect();
      result.reviewsGrid = {
        boundingHeight: Math.round(r.height),
        scrollHeight: grid.scrollHeight,
        cssHeight: cs.height,
        cssMaxHeight: cs.maxHeight,
        cssOverflow: cs.overflow,
        cssOverflowY: cs.overflowY,
        cssDisplay: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        gridTemplateRows: cs.gridTemplateRows,
        childCount: grid.children.length,
        children: Array.from(grid.children).slice(0, 13).map((c, i) => {
          const cr = c.getBoundingClientRect();
          const ccs = getComputedStyle(c);
          return {
            i,
            tag: c.tagName.toLowerCase(),
            cls: (c.className || '').slice(0, 40),
            top: Math.round(cr.top),
            left: Math.round(cr.left),
            w: Math.round(cr.width),
            h: Math.round(cr.height),
            display: ccs.display,
            visibility: ccs.visibility,
            opacity: ccs.opacity,
          };
        }),
      };
    }

    const about = document.querySelector('.about');
    if (about) {
      const r = about.getBoundingClientRect();
      const cs = getComputedStyle(about);
      result.about = {
        height: Math.round(r.height),
        scrollHeight: about.scrollHeight,
        padding: cs.padding,
        cssHeight: cs.height,
        cssMinHeight: cs.minHeight,
      };
      result.aboutChildren = Array.from(about.children).map(c => {
        const cr = c.getBoundingClientRect();
        const ccs = getComputedStyle(c);
        return {
          tag: c.tagName.toLowerCase(),
          cls: (c.className || '').slice(0, 50),
          h: Math.round(cr.height),
          display: ccs.display,
          opacity: ccs.opacity,
          position: ccs.position,
        };
      });
    }

    const proof = document.querySelector('.proof-section');
    if (proof) {
      const r = proof.getBoundingClientRect();
      const cs = getComputedStyle(proof);
      result.proof = {
        height: Math.round(r.height),
        scrollHeight: proof.scrollHeight,
        padding: cs.padding,
        cssHeight: cs.height,
        cssMinHeight: cs.minHeight,
      };
      result.proofChildren = Array.from(proof.children).map(c => {
        const cr = c.getBoundingClientRect();
        const ccs = getComputedStyle(c);
        return {
          tag: c.tagName.toLowerCase(),
          cls: (c.className || '').slice(0, 50),
          h: Math.round(cr.height),
          display: ccs.display,
          opacity: ccs.opacity,
          position: ccs.position,
        };
      });
    }

    return result;
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
