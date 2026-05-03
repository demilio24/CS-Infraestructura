const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  // Scroll so DISCOVER is near center of viewport
  await page.evaluate(() => {
    const cta = document.querySelector('section.statement .cta');
    const r = cta.getBoundingClientRect();
    window.scrollBy(0, r.top - 400);
  });
  await new Promise(r => setTimeout(r, 300));

  const px = await page.evaluate(() => {
    const p = document.querySelector('section.statement .body p:last-of-type');
    const cta = document.querySelector('section.statement .cta');
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    return {
      lastPText_bottom_viewport: p.getBoundingClientRect().bottom,
      cta_top_viewport: cta.getBoundingClientRect().top,
      cta_bottom_viewport: cta.getBoundingClientRect().bottom,
      hr_top_viewport: hr.getBoundingClientRect().top
    };
  });
  console.log('viewport coords:', px);
  console.log('top gap (lastP bottom → cta top):', px.cta_top_viewport - px.lastPText_bottom_viewport);
  console.log('bottom gap (cta bottom → hr top):', px.hr_top_viewport - px.cta_bottom_viewport);

  // Full screenshot of the DISCOVER area for visual inspection
  const top = Math.round(px.lastPText_bottom_viewport - 30);
  const height = Math.round(px.hr_top_viewport - px.lastPText_bottom_viewport + 60);
  await page.screenshot({ path: `${OUT}/pixel-discover.png`, clip: { x: 400, y: top, width: 640, height: Math.max(height, 200) } });
  console.log('screenshot y:', top, 'height:', height);

  await browser.close();
})();
