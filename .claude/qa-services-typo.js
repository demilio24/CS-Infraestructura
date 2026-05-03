const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html#services';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // DESKTOP
  await page.setViewport({ width: 1440, height: 1800 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    if (typeof showPage === 'function') showPage('services');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 600));

  const cs = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { text: el.textContent.trim().slice(0, 36), fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, textAlign: s.textAlign, fontFamily: s.fontFamily.split(',')[0] };
    };
    return {
      h1: read('.svc-head h1'),
      p: read('.svc-statement p'),
      num: read('.svc-num'),
      trig: read('.svc-trigger')
    };
  });
  console.log(JSON.stringify(cs, null, 2));

  await page.screenshot({ path: `${OUT}/services-desktop.png`, fullPage: false });

  // MOBILE
  await page.setViewport({ width: 390, height: 1800 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/services-mobile.png`, fullPage: false });

  // scroll to list
  await page.evaluate(() => document.querySelector('.svc-list').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/services-mobile-list.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
