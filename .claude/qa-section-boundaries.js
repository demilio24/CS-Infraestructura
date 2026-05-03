const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => document.querySelectorAll('.fu').forEach(e => e.classList.add('in')));

  const data = await page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const info = (sel) => {
      const el = q(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        marginTop: s.marginTop,
        marginBottom: s.marginBottom
      };
    };
    return {
      workSection: info('section.work-section'),
      lastWorkImg: info('.work-section .work-img:last-of-type'),
      sectionFoot: info('.work-section .section-foot'),
      editorial: info('section.editorial'),
      editorialImg: info('section.editorial .img'),
      testimonies: info('section.testimonies-section'),
      finalcta: info('section.finalcta'),
      footer: info('footer')
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
