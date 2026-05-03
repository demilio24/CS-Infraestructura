const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html#collections';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // MOBILE tile (labels always visible)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    if (typeof showPage === 'function') showPage('collections');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/coll-mobile-tile.png`, fullPage: false });

  const ttlVis = await page.evaluate(() => {
    const t = document.querySelector('.coll-item .ttl');
    if (!t) return null;
    const s = getComputedStyle(t);
    return { opacity: s.opacity, transform: s.transform };
  });
  console.log('mobile tile overlay:', ttlVis);

  // DESKTOP viewer
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const c = document.getElementById('page-collections');
    if (c) c.classList.add('active');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const firstTile = document.querySelector('.coll-item');
    if (firstTile) firstTile.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/viewer-desktop.png`, fullPage: false });

  const cs = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        opacity: s.opacity,
        color: s.color,
        fontFamily: s.fontFamily.split(',')[0]
      };
    };
    const bg = getComputedStyle(document.getElementById('viewer')).backgroundColor;
    return {
      bg,
      title: read('#viewer .meta .n'),
      location: read('#viewer .meta .l'),
      arrow: read('#viewer .arrow'),
      counter: read('#viewer .counter'),
      close: read('#viewer .close')
    };
  });
  console.log(JSON.stringify(cs, null, 2));

  await browser.close();
  console.log('done');
})();
