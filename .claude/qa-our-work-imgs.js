const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));
  const d = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.work-img img')];
    return imgs.map(i => ({ src: i.currentSrc, w: i.naturalWidth, h: i.naturalHeight, displayedW: Math.round(i.getBoundingClientRect().width), displayedH: Math.round(i.getBoundingClientRect().height) }));
  });
  console.log('DESKTOP 1440:'); console.log(JSON.stringify(d, null, 2));
  await page.evaluate(() => document.querySelector('.work-img').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/ourwork-desktop.png`, fullPage: false });

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 400));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));
  const m = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.work-img img')];
    return imgs.map(i => ({ src: i.currentSrc, w: i.naturalWidth, h: i.naturalHeight, displayedW: Math.round(i.getBoundingClientRect().width), displayedH: Math.round(i.getBoundingClientRect().height) }));
  });
  console.log('MOBILE 390:'); console.log(JSON.stringify(m, null, 2));
  await page.evaluate(() => document.querySelector('.work-img').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/ourwork-mobile.png`, fullPage: false });

  await browser.close();
})();
