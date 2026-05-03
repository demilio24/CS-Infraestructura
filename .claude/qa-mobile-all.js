const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PAGES = ['home.html', 'after-school.html', 'camps.html', 'spirit-dance.html'];
const OUT = path.resolve(__dirname, 'qa-screenshots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const report = [];
  for (const p of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 414, height: 820, isMobile: true, hasTouch: true });
    const url = 'file:///' + path.resolve(__dirname, '..', 'Tom_Systema_Floyd', 'funnel', p).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));
    // Scroll fully to trigger lazy loads
    await page.evaluate(async () => {
      await new Promise((r) => {
        let total = 0; const dist = 400;
        const t = setInterval(() => { window.scrollBy(0, dist); total += dist; if (total >= document.body.scrollHeight) { clearInterval(t); r(); } }, 120);
      });
    });
    await new Promise(r => setTimeout(r, 800));
    // Back to top for hero screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));

    // Check viewport overflow
    const data = await page.evaluate(() => {
      const vw = window.innerWidth;
      const overflows = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && r.width < vw * 1.5 && getComputedStyle(el).position !== 'fixed') {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0,2).join('.') : '';
          overflows.push({ sel: `${tag}${cls ? '.'+cls : ''}`, right: Math.round(r.right), w: Math.round(r.width) });
        }
      });
      return {
        scrollW: document.documentElement.scrollWidth,
        vw,
        overflowCount: overflows.length,
        topOverflow: overflows.slice(0, 5),
        heroH: document.querySelector('.hero,.page-hero')?.getBoundingClientRect().height,
        navCollides: (() => {
          const nav = document.querySelector('.sf-nav-wrap');
          const hero = document.querySelector('.hero,.page-hero');
          if (!nav || !hero) return false;
          const navB = nav.getBoundingClientRect().bottom;
          const firstHeading = hero.querySelector('h1');
          if (!firstHeading) return false;
          const headTop = firstHeading.getBoundingClientRect().top;
          return { navBottom: navB, headingTop: headTop, gap: headTop - navB };
        })(),
      };
    });
    await page.screenshot({ path: path.join(OUT, `m-${p.replace('.html','')}-top.png`), fullPage: false });
    // Full page
    await page.screenshot({ path: path.join(OUT, `m-${p.replace('.html','')}-full.png`), fullPage: true });
    report.push({ page: p, ...data });
    await page.close();
  }
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
