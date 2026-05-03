const puppeteer = require('puppeteer');
const path = require('path');

const VIEWPORTS = [
  { name: '320-mini', w: 320, h: 568, mobile: true },
  { name: '375-se', w: 375, h: 667, mobile: true },
  { name: '414-pixel', w: 414, h: 896, mobile: true },
  { name: '768-tab', w: 768, h: 1024, mobile: false },
  { name: '1024-lap', w: 1024, h: 700, mobile: false },
  { name: '1440-desk', w: 1440, h: 900, mobile: false },
];
const PAGES = ['home.html', 'after-school.html', 'camps.html', 'spirit-dance.html'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = [];
  for (const p of PAGES) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: v.w, height: v.h, isMobile: v.mobile, hasTouch: v.mobile });
      const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p).replace(/\\/g, '/');
      await page.goto(url, { waitUntil: 'load' });
      await new Promise(r => setTimeout(r, 1200));

      const data = await page.evaluate(() => {
        const vw = window.innerWidth;
        const overflows = [];
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 5) return;
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'absolute') return;
          if (r.right > vw + 2) {
            const tag = el.tagName.toLowerCase();
            const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0,2).join('.');
            overflows.push({ sel: `${tag}${cls?'.'+cls:''}`, right: Math.round(r.right), w: Math.round(r.width) });
          }
        });
        // Check for horizontal scroll on body
        const bodyScrollW = document.body.scrollWidth;
        const docScrollW = document.documentElement.scrollWidth;
        // Check if interactive elements are accessible (not too small)
        const smallTargets = [];
        document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0) return;
          if (r.height < 36 && r.width > 20) {
            const tag = el.tagName.toLowerCase();
            const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0,2).join('.');
            smallTargets.push({ sel: `${tag}${cls?'.'+cls:''}`, h: Math.round(r.height), w: Math.round(r.width), text: (el.textContent||'').trim().slice(0,30) });
          }
        });
        // Count overflows by selector
        const overflowSet = new Set(overflows.map(o => o.sel));
        return {
          docScrollW, bodyScrollW,
          hasHOverflow: docScrollW > vw,
          overflowCount: overflows.length,
          uniqueOverflow: [...overflowSet].slice(0, 6),
          smallTargetCount: smallTargets.length,
          topSmall: smallTargets.slice(0, 3),
          h1Size: (() => { const h = document.querySelector('h1'); return h ? getComputedStyle(h).fontSize : null; })(),
        };
      });
      results.push({ page: p, vp: v.name, ...data });
      await page.close();
    }
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
