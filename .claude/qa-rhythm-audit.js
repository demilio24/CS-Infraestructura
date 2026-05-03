const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

const checks = {
  home: [
    // Statement: last paragraph → DISCOVER → first rule of Our Work
    { name: 'Home: last statement p → DISCOVER', a: 'section.statement .body p:last-of-type', b: 'section.statement .cta-wrap' },
    { name: 'Home: DISCOVER → Our Work hr', a: 'section.statement .cta-wrap', b: 'section.work-section .section-head hr.rule' },
    // Work: last tile → View Collections CTA → editorial
    { name: 'Home: last Our Work tile → View Collections CTA', a: 'section.work-section .work-img:last-of-type', b: 'section.work-section .section-foot' },
    { name: 'Home: View Collections CTA → editorial', a: 'section.work-section .section-foot', b: 'section.editorial' },
    // Editorial → testimonies
    { name: 'Home: editorial end → testimonies hr', a: 'section.editorial', b: 'section.testimonies-section .testimonies-head hr.rule' },
    // Last testimonial → finalcta
    { name: 'Home: last testimonial → finalcta eyebrow', a: '.testimonies .t:last-child', b: 'section.finalcta .eyebrow' },
    // INQUIRY → footer
    { name: 'Home: INQUIRY cta → footer', a: 'section.finalcta .cta-wrap', b: 'footer' }
  ]
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.addStyleTag({ content: `.fu, .velus-v { opacity: 1 !important; transform: none !important; transition: none !important; } #entry { display: none !important; }` });
  await new Promise(r => setTimeout(r, 300));

  const measurements = await page.evaluate((checks) => {
    const out = {};
    for (const [pageName, pairs] of Object.entries(checks)) {
      out[pageName] = pairs.map(p => {
        const a = document.querySelector(p.a);
        const b = document.querySelector(p.b);
        if (!a || !b) return { name: p.name, a: !!a, b: !!b, gap: null };
        const gap = Math.round((b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) * 10) / 10;
        return { name: p.name, gap };
      });
    }
    return out;
  }, checks);

  for (const [pageName, rows] of Object.entries(measurements)) {
    console.log(`\n=== ${pageName.toUpperCase()} ===`);
    rows.forEach(r => {
      const tag = r.gap === null ? '(missing)' : (r.gap + 'px');
      console.log(`  ${tag.padEnd(12)} ${r.name}`);
    });
  }

  await browser.close();
})();
