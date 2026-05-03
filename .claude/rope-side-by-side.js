const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Production height (no boost) — verify the bug is fixed at the actual deployed size

  // Scroll so divider 0 is at viewport y=400, then capture a big window around it
  await page.evaluate(() => {
    const d = document.querySelectorAll('.rope-divider')[0];
    const pageY = d.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, pageY - 400);
  });
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => {
    const d = document.querySelectorAll('.rope-divider')[0];
    const r = d.getBoundingClientRect();
    return { top: r.top, height: r.height, width: r.width };
  });
  console.log('Divider after scroll:', JSON.stringify(info));
  // Full viewport capture — easier to see where the divider actually renders
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/rope-production-fv.png' });

  await browser.close();
  console.log('done');
})();
