const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

const pages = ['home', 'collections', 'about', 'services', 'contact'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => document.querySelectorAll('.fu').forEach(e => e.classList.add('in')));

  const all = {};
  for (const p of pages) {
    await page.evaluate((name) => { if (typeof showPage === 'function') showPage(name); }, p);
    await new Promise(r => setTimeout(r, 300));

    const data = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const rect = (el) => el ? el.getBoundingClientRect() : null;
      const gap = (a, b) => a && b ? Math.round((rect(b).top - rect(a).bottom) * 10) / 10 : null;

      // Home
      const lastStatementP = q('section.statement .body p:last-child');
      const discoverCta = q('section.statement .cta');
      const workHr = q('section.work-section hr.rule');
      const editorialStart = q('section.editorial');
      const testiHead = q('.testimonies-head');
      const finalctaEyebrow = q('section.finalcta .eyebrow');
      const finalctaInquiry = q('section.finalcta .cta');
      const footerTop = q('footer');

      // Services
      const svcStatementLastP = q('.svc-statement p:last-child');
      const svcMonogram = q('#page-services section.monogram');
      const svcList = q('.svc-list');
      const visualBreak = q('section.visual-break');
      const processWrap = q('.process-wrap');

      // About
      const aboutLastP = q('.about-bio p:last-child');
      const aboutAnchor = q('.about-anchor');
      const aboutExit = q('.about-exit');

      // Contact
      const contactLastField = q('.inq-field:last-of-type');
      const submitBtn = q('.submit-btn');

      return {
        home: {
          lastParaBottom_to_discoverTop: gap(lastStatementP, discoverCta),
          discoverBottom_to_workHr: gap(discoverCta, workHr),
          testimoniesHead_to_finalctaEyebrow: gap(testiHead, finalctaEyebrow),
          finalctaInquiry_to_footer: gap(finalctaInquiry, footerTop)
        },
        services: {
          svcStatementLastP_to_monogram: gap(svcStatementLastP, svcMonogram),
          monogram_to_svcList: gap(svcMonogram, svcList),
          visualBreak_to_processWrap: gap(visualBreak, processWrap)
        },
        about: {
          aboutLastP_to_anchor: gap(aboutLastP, aboutAnchor),
          aboutAnchor_to_exit: gap(aboutAnchor, aboutExit)
        },
        contact: {
          contactLastField_to_submit: gap(contactLastField, submitBtn)
        }
      };
    });
    all[p] = data[p] || {};
  }

  console.log(JSON.stringify(all, null, 2));
  await browser.close();
})();
