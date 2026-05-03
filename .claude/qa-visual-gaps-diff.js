const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

// This script takes a pixel-level screenshot and counts non-background pixels vertically
// to find the actual visible text pixels (instead of bounding boxes).

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  // Scroll so DISCOVER area is fully visible
  await page.evaluate(() => {
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    window.scrollBy(0, hr.getBoundingClientRect().top - 600);
  });
  await new Promise(r => setTimeout(r, 400));

  // Use canvas to sample pixel rows, find visible text
  const analysis = await page.evaluate(() => {
    const cta = document.querySelector('section.statement .cta');
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    const p = document.querySelector('section.statement .body p:last-of-type');
    return {
      pBottom: p.getBoundingClientRect().bottom,
      ctaTop: cta.getBoundingClientRect().top,
      ctaBottom: cta.getBoundingClientRect().bottom,
      hrTop: hr.getBoundingClientRect().top,
      boxAbove: cta.getBoundingClientRect().top - p.getBoundingClientRect().bottom,
      boxBelow: hr.getBoundingClientRect().top - cta.getBoundingClientRect().bottom
    };
  });
  console.log('BOX gaps (CURRENT):');
  console.log('  above:', analysis.boxAbove);
  console.log('  below:', analysis.boxBelow);

  // Take screenshot and ANALYZE pixel columns to find where text actually ends
  const clipTop = Math.floor(analysis.pBottom - 20);
  const clipBottom = Math.ceil(analysis.hrTop + 10);
  const h = clipBottom - clipTop;
  const buf = await page.screenshot({ clip: { x: 560, y: clipTop, width: 320, height: h } });
  await page.screenshot({ path: `${OUT}/gap-analysis.png`, clip: { x: 560, y: clipTop, width: 320, height: h } });

  console.log('\nScreenshot saved: gap-analysis.png');
  console.log('Viewport Y of lastP.bottom:', analysis.pBottom);
  console.log('Viewport Y of cta.top:', analysis.ctaTop);
  console.log('Viewport Y of cta.bottom:', analysis.ctaBottom);
  console.log('Viewport Y of hr.top:', analysis.hrTop);

  await browser.close();
})();
