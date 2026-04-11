const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Desktop full page
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }
  await page.evaluate(() => window.scrollTo(0,0));
  await new Promise(r => setTimeout(r, 500));

  // Take scrolling viewport screenshots to catch every transition
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  let i = 0;
  for (let y = 0; y < totalHeight; y += 700) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: '.claude/screenshots/final-d-' + i + '.png' });
    i++;
  }
  console.log('Desktop: ' + i + ' viewport screenshots');

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h2 = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h2; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }
  await page.evaluate(() => window.scrollTo(0,0));
  await new Promise(r => setTimeout(r, 500));

  const totalH2 = await page.evaluate(() => document.body.scrollHeight);
  let j = 0;
  for (let y = 0; y < totalH2; y += 650) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: '.claude/screenshots/final-m-' + j + '.png' });
    j++;
  }
  console.log('Mobile: ' + j + ' viewport screenshots');

  await browser.close();
  console.log('Done');
})();
