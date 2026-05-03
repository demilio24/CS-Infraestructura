const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  const y = await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    return d.getBoundingClientRect().top + window.scrollY;
  });
  await page.evaluate((Y) => window.scrollTo(0, Math.max(0, Y - 100)), y);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/clss-rope-mobile.png' });

  await browser.close();
  console.log('done');
})();
