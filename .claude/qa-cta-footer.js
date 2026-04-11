const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }

  // CTA → Footer transition
  await page.evaluate(() => {
    const el = document.querySelector('.final-cta');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 300);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-cta-footer.png' });

  await browser.close();
  console.log('Done');
})();
