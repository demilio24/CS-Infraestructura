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

  const pickAll = await page.evaluate(() => {
    const pick = (sel, label) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { label, sel, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height), display: cs.display, lh: cs.lineHeight, ta: cs.textAlign };
    };
    return [
      pick('section.statement .cta-wrap', 'discover wrap'),
      pick('section.statement .cta', 'discover cta'),
      pick('section.work-section .section-foot', 'view-collections wrap'),
      pick('section.work-section .section-foot .cta', 'view-collections cta'),
      pick('section.finalcta .cta-wrap', 'finalcta wrap'),
      pick('section.finalcta .cta', 'finalcta cta'),
    ];
  });
  console.log(JSON.stringify(pickAll, null, 2));
  console.log('viewport width: 390');
  await browser.close();
})();
