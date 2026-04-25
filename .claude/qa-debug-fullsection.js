const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 1400, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const e = document.getElementById('entry'); if(e) e.style.display='none';
    const home = document.getElementById('page-home'); if(home) home.classList.add('active');
  });
  await new Promise(r => setTimeout(r, 400));
  // Full page screenshot, no extract
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/debug-fullpage.png', fullPage: true });
  const dims = await page.evaluate(() => ({ docH: document.body.scrollHeight, vpH: window.innerHeight }));
  console.log('docH', dims.docH, 'vpH', dims.vpH);
  await browser.close();
})();
