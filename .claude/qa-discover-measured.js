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
    const info = (el, label) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { label, top: Math.round(r.top), bottom: Math.round(r.bottom), marginTop: s.marginTop, marginBottom: s.marginBottom, paddingTop: s.paddingTop, paddingBottom: s.paddingBottom, lineHeight: s.lineHeight, fontSize: s.fontSize };
    };
    // Draw guide lines on screen
    const make = (y, color, text) => {
      const line = document.createElement('div');
      line.style = `position:absolute;top:${y + window.scrollY}px;left:0;right:0;height:1px;background:${color};z-index:9999;pointer-events:none`;
      line.setAttribute('data-guide','1');
      document.body.appendChild(line);
      const lbl = document.createElement('div');
      lbl.style = `position:absolute;top:${y + window.scrollY - 12}px;right:40px;color:${color};font:bold 12px monospace;z-index:9999;pointer-events:none`;
      lbl.textContent = text;
      lbl.setAttribute('data-guide','1');
      document.body.appendChild(lbl);
    };
    const pBottom = p.getBoundingClientRect().bottom;
    const ctaWrapTop = ctaWrap.getBoundingClientRect().top;
    const ctaTop = cta.getBoundingClientRect().top;
    const ctaBottom = cta.getBoundingClientRect().bottom;
    const hrTop = hr.getBoundingClientRect().top;
    make(pBottom, 'red', 'last p bottom');
    make(ctaWrapTop, 'blue', 'cta-wrap top');
    make(ctaTop, 'green', 'cta top');
    make(ctaBottom, 'purple', 'cta bottom');
    make(hrTop, 'orange', 'hr top');
    return [info(p, 'lastP'), info(ctaWrap, 'ctaWrap'), info(cta, 'cta'), info(hr, 'hr'), { aboveGap: Math.round(ctaTop - pBottom), belowGap: Math.round(hrTop - ctaBottom) }];
  });
  console.log(JSON.stringify(data, null, 2));

  await page.evaluate(() => {
    const el = document.querySelector('section.statement .cta-wrap');
    el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/discover-measured.png`, clip: { x: 200, y: 300, width: 1040, height: 400 } });

  await browser.close();
})();
