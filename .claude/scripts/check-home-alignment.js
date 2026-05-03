// Check left-edge alignment on mobile home page across statement / work-section.
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
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(() => {
    const pick = (sel, label) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { label: label || sel, sel, left: Math.round(r.left), right: Math.round(r.right), padL: cs.paddingLeft };
    };
    return [
      pick('section.statement'),
      pick('section.statement h1'),
      pick('section.statement .body'),
      pick('section.statement .body p'),
      pick('section.statement .cta-wrap'),
      pick('section.work-section'),
      pick('.work-section .section-head'),
      pick('.work-section .section-head h2'),
      pick('.work-section .section-head .lede'),
    ];
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
