const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Desktop full viewport test
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // For each rope-divider, scroll so it's vertically centered, then take a full-viewport screenshot
  const count = await page.evaluate(() => document.querySelectorAll('.rope-divider').length);
  console.log(`Found ${count} dividers`);

  for (let i = 0; i < count; i++) {
    await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      d.scrollIntoView({ block: 'center' });
    }, i);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `F:/GitHub/Websites/.claude/screenshots/rope-fv-desktop-${i}.png`, fullPage: false });
  }

  // Also take one mobile full-viewport screenshot
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
  await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    d.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/rope-fv-mobile-0.png', fullPage: false });

  await browser.close();
  console.log('done');
})();
