const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
  });
  // Use absolute Y from page coordinates
  const targetY = await page.evaluate(() => {
    const el = document.querySelector('.communities-section');
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  });
  await page.evaluate(y => window.scrollTo(0, y - 80), targetY);
  await new Promise(r => setTimeout(r, 1500));
  const box = await page.evaluate(() => {
    const el = document.querySelector('.communities-section');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  // Just screenshot the viewport — we already scrolled the section to top
  await page.screenshot({ path: '.claude/screenshots/clss-communities-desktop.png' });
  console.log('done');
  await browser.close();
})();
