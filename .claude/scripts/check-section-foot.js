// Measure VIEW COLLECTIONS spacing on mobile.
const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('vp', 'home');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-home').classList.add('active');
  });
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(() => {
    const pick = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { sel, top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), height: Math.round(r.height), pad: `${cs.paddingTop} / ${cs.paddingBottom}`, mar: `${cs.marginTop} / ${cs.marginBottom}` };
    };
    return {
      lastWorkImg: pick('.work-section .work-img:last-child'),
      sectionFoot: pick('.section-foot'),
      foot_cta: pick('.section-foot .cta'),
      workSection: pick('section.work-section'),
      editorial: pick('section.editorial'),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
