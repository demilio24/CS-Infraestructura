const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html#about';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1800 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const about = document.getElementById('page-about');
    if (about) about.classList.add('active');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 600));

  const cs = await page.evaluate(() => {
    const p = document.querySelector('.about-bio p');
    const s = getComputedStyle(p);
    return { fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, fontFamily: s.fontFamily, marginTop: s.marginTop };
  });
  console.log('about-bio p styles', cs);

  await page.evaluate(() => {
    document.querySelector('.about-identity').scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/about-typo-desktop.png`, fullPage: false });

  // mobile
  await page.setViewport({ width: 390, height: 1800 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('.about-identity').scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/about-typo-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
