const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

const checks = {
  home: [
    { name: 'Home: lastP → DISCOVER', a: 'section.statement .body p:last-of-type', b: 'section.statement .cta' },
    { name: 'Home: DISCOVER → OurWork hr', a: 'section.statement .cta', b: 'section.work-section .section-head hr.rule' },
    { name: 'Home: lastOurWorkLede → hr (above images)', a: 'section.work-section .section-head p.lede:last-of-type', b: 'section.work-section .work-img:first-of-type' },
    { name: 'Home: lastTile → ViewCollections', a: 'section.work-section .work-stack .work-img:last-of-type', b: 'section.work-section .section-foot' },
    { name: 'Home: ViewCollections → editorial top', a: 'section.work-section .section-foot', b: 'section.editorial' },
    { name: 'Home: editorial last p → testimonies hr', a: 'section.editorial p:last-of-type', b: 'section.testimonies-section .testimonies-head hr.rule' },
    { name: 'Home: testimonies last cite → finalcta eyebrow', a: '.testimonies .t:last-child cite', b: 'section.finalcta .eyebrow' },
    { name: 'Home: finalcta p → INQUIRY', a: 'section.finalcta p', b: 'section.finalcta .cta' },
    { name: 'Home: INQUIRY → footer', a: 'section.finalcta .cta', b: 'footer' }
  ],
  services: [
    { name: 'Services: svc-statement lastP → monogram', a: '.svc-statement p:last-of-type', b: '#page-services section.monogram' },
    { name: 'Services: svc-list lastItem → visual-break', a: '.svc-list .svc-item:last-child', b: 'section.visual-break' },
    { name: 'Services: OUR PROCESS last step → INQUIRY cta', a: '.process-wrap .process-step:last-child', b: '.process-wrap .cta-wrap' }
  ],
  about: [
    { name: 'About: identity h1 → first bio p', a: '.about-identity h1', b: '.about-bio p:first-of-type' },
    { name: 'About: bio lastP → about-anchor', a: '.about-bio p:last-of-type', b: '.about-anchor' }
  ],
  contact: [
    { name: 'Contact: lede → slide-progress', a: '.c-open .lede', b: '.slide-progress' },
    { name: 'Contact: slide-progress → first inq-field', a: '.slide-progress', b: '.slide.active .inq-field:first-of-type' },
    { name: 'Contact: last inq-field → SUBMIT', a: '.slide.active .inq-field:last-of-type', b: '.slide.active .slide-actions' }
  ]
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.addStyleTag({ content: `#entry{display:none!important}.velus-v{opacity:1!important;transform:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  for (const [pageName, pairs] of Object.entries(checks)) {
    await page.evaluate((name) => { if (typeof showPage === 'function') showPage(name); }, pageName);
    await new Promise(r => setTimeout(r, 500));

    console.log(`\n=== ${pageName.toUpperCase()} ===`);
    const rows = await page.evaluate((pairs) => pairs.map(p => {
      const a = document.querySelector(p.a);
      const b = document.querySelector(p.b);
      if (!a || !b) return { name: p.name, gap: null, miss: { a: !!a, b: !!b } };
      const gap = Math.round((b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) * 10) / 10;
      return { name: p.name, gap };
    }), pairs);
    rows.forEach(r => {
      const tag = r.gap === null ? `(missing ${r.miss.a ? 'b' : 'a'})` : `${r.gap}px`;
      console.log(`  ${tag.padEnd(14)} ${r.name}`);
    });
  }

  await browser.close();
})();
