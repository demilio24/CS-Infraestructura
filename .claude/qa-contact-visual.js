const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html#contact';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 1600 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-contact').classList.add('active');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: `${OUT}/contact-final-mobile.png`, fullPage: true });

  await browser.close();
  console.log('done');
})();
