const puppeteer = require('puppeteer');
const path = require('path');

const VIEWPORTS = [
  { name: 'iphone-se', w: 375, h: 667 },
  { name: 'iphone-14', w: 390, h: 844 },
  { name: 'pixel', w: 414, h: 896 },
];
const PAGES = ['after-school.html', 'camps.html'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const out = [];
  for (const p of PAGES) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: v.w, height: v.h, isMobile: true, hasTouch: true });
      const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p).replace(/\\/g, '/');
      await page.goto(url, { waitUntil: 'load' });
      await new Promise(r => setTimeout(r, 1500));
      const data = await page.evaluate(() => {
        const nav = document.querySelector('.sf-nav-wrap');
        const hero = document.querySelector('.page-hero');
        const h1 = document.querySelector('.page-hero h1');
        const badge = document.querySelector('.page-hero-copy .badge');
        const form = document.querySelector('.page-hero-form');
        const sub = document.querySelector('.page-hero-sub');
        const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height) }; };
        return {
          vp: { w: window.innerWidth, h: window.innerHeight },
          nav: rect(nav),
          hero: rect(hero),
          h1: rect(h1), badge: rect(badge), sub: rect(sub), form: rect(form),
          h1Hidden: h1 ? (h1.getBoundingClientRect().top >= window.innerHeight || h1.getBoundingClientRect().bottom <= 0) : 'no-h1',
          h1UnderNav: h1 && nav ? h1.getBoundingClientRect().top < nav.getBoundingClientRect().bottom : 'n/a',
          heroPaddingTop: hero ? getComputedStyle(hero).paddingTop : 'n/a',
        };
      });
      await page.screenshot({ path: path.resolve(__dirname, 'qa-screenshots', `mobile-${p.replace('.html','')}-${v.name}.png`) });
      out.push({ page: p, vp: v.name, ...data });
      await page.close();
    }
  }
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
