const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v1.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1400));

  const info = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const heroImgs = [...document.querySelectorAll('.hero-bg img')].map(i => ({ src: i.currentSrc, alt: i.alt, loaded: i.complete && i.naturalWidth > 0, w: i.naturalWidth, h: i.naturalHeight }));
    return {
      bodyFontFamily: body.fontFamily,
      h1FontFamily: h1Style ? h1Style.fontFamily : null,
      heroImgs
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: `${OUT}/v1-hero-new.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await browser.close();
})();
