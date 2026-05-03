const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  // Scroll so the whole discover area is in view
  await page.evaluate(() => {
    const p = document.querySelector('section.statement .body p:last-of-type');
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    const top = p.getBoundingClientRect().top;
    const bottom = hr.getBoundingClientRect().bottom;
    const mid = (top + bottom) / 2;
    window.scrollBy(0, mid - 450);
  });
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(() => {
    const p = document.querySelector('section.statement .body p:last-of-type');
    const cta = document.querySelector('section.statement .cta');
    const hr = document.querySelector('section.work-section .section-head hr.rule');
    return {
      lastPBottom: p.getBoundingClientRect().bottom,
      ctaTop: cta.getBoundingClientRect().top,
      ctaBottom: cta.getBoundingClientRect().bottom,
      hrTop: hr.getBoundingClientRect().top
    };
  });
  const topGap = data.ctaTop - data.lastPBottom;
  const botGap = data.hrTop - data.ctaBottom;
  console.log(`TOP GAP: ${topGap}px`);
  console.log(`BOTTOM GAP: ${botGap}px`);

  // Inject visible measurement overlays
  await page.evaluate((d, t, b) => {
    const mk = (top, h, color) => {
      const el = document.createElement('div');
      el.style = `position:fixed;left:1200px;top:${top}px;width:40px;height:${h}px;background:${color};opacity:.6;z-index:99999`;
      document.body.appendChild(el);
    };
    mk(d.lastPBottom, t, 'red');
    mk(d.ctaBottom, b, 'red');
  }, data, topGap, botGap);

  await page.screenshot({ path: `${OUT}/discover-proof.png`, fullPage: false });
  await browser.close();
})();
