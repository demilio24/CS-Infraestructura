const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Add a temporary outline so we can see the divider's bounding box
  await page.addStyleTag({ content: '.rope-divider { outline: 2px dashed magenta !important; }' });

  // Scroll to divider 1
  await page.evaluate(() => {
    const d = document.querySelectorAll('.rope-divider')[1];
    const r = d.getBoundingClientRect();
    window.scrollTo(0, r.top + window.scrollY - 400);
  });
  await new Promise(r => setTimeout(r, 400));

  const clip = await page.evaluate(() => {
    const d = document.querySelectorAll('.rope-divider')[1];
    const r = d.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top - 80), width: 1440, height: r.height + 160 };
  });
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/rope-debug.png', clip });
  await browser.close();
})();
