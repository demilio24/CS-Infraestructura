const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 439, height: 1100 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const data = await page.evaluate(() => {
    const h2 = document.querySelector('section.work-section .section-head h2');
    const p = document.querySelector('section.work-section .section-head .lede');
    const read = (el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, lineHeight: s.lineHeight, textAlign: s.textAlign, fontFamily: s.fontFamily.split(',')[0] };
    };
    return { h2: read(h2), p: read(p) };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
