const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    document.querySelector('.testimonies-head').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -100);
  });
  await new Promise(r => setTimeout(r, 500));

  const cs = await page.evaluate(() => {
    const h = document.querySelector('.testimonies-head h2');
    const bq = document.querySelector('.testimonies blockquote');
    const btn = document.querySelector('.t-toggle');
    const cite = document.querySelector('.testimonies cite');
    const read = (el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontFamily: s.fontFamily.split(',')[0], lineHeight: s.lineHeight };
    };
    return { h: read(h), bq: read(bq), btn: read(btn), cite: read(cite) };
  });
  console.log(JSON.stringify(cs, null, 2));

  await page.screenshot({ path: `${OUT}/reflections-desktop.png`, fullPage: false });

  // mobile
  await page.setViewport({ width: 390, height: 1400 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    document.querySelector('.testimonies-head').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/reflections-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
