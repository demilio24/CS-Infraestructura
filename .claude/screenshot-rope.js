const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Hero+rope
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/clss-rope-hero.png' });

  // Bottom of programs/quiz boundary (zoom into divider)
  const y = await page.evaluate(() => {
    const dividers = document.querySelectorAll('.rope-divider');
    if (dividers.length < 2) return 0;
    return dividers[1].getBoundingClientRect().top + window.scrollY;
  });
  await page.evaluate((Y) => window.scrollTo(0, Math.max(0, Y - 200)), y);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/clss-rope-mid.png' });

  await browser.close();
  console.log('done');
})();
