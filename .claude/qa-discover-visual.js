const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  const data = await page.evaluate(() => {
    const p = document.querySelector('section.statement .body p:last-of-type');
    const cta = document.querySelector('section.statement .cta');
    const ctaWrap = document.querySelector('section.statement .cta-wrap');
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    const info = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
    return {
      lastP: info(p),
      ctaWrap: info(ctaWrap),
      cta: info(cta),
      hr: info(hr),
      aboveMargin_lastPbottom_to_ctaWrapTop: info(ctaWrap).top - info(p).bottom,
      belowMargin_ctaBottom_to_hrTop: info(hr).top - info(cta).bottom,
      belowMargin_ctaWrapBottom_to_hrTop: info(hr).top - info(ctaWrap).bottom
    };
  });
  console.log(JSON.stringify(data, null, 2));

  // Screenshot the area for comparison
  await page.evaluate(() => document.querySelector('section.statement .cta-wrap').scrollIntoView({ block: 'center' }));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/discover-area.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await browser.close();
})();
