const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 844, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const e = document.getElementById('entry'); if(e) e.style.display='none';
    const home = document.getElementById('page-home'); if(home) home.classList.add('active');
    document.querySelector('section.editorial').scrollIntoView({block:'start'});
    window.scrollBy(0, -100);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/debug-editorial.png', fullPage: false });
  console.log('saved');
  await browser.close();
})();
