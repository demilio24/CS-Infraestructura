const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }

  // About bottom → wave → programs top
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-about-programs.png' });

  // Programs bottom → goggles → wave → locations top
  await page.evaluate(() => {
    const el = document.querySelector('#programs');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-programs-locations.png' });

  // Hero form card
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-hero.png' });

  // Locations → steps
  await page.evaluate(() => {
    const el = document.querySelector('#locations');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-locations-steps.png' });

  // Steps → reviews
  await page.evaluate(() => {
    const el = document.querySelector('#steps');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-steps-reviews.png' });

  // Gallery → team
  await page.evaluate(() => {
    const el = document.querySelector('.gallery');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-gallery-team.png' });

  // Why → FAQ
  await page.evaluate(() => {
    const el = document.querySelector('#why');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-why-faq.png' });

  // FAQ → final CTA
  await page.evaluate(() => {
    const el = document.querySelector('#faq');
    window.scrollTo(0, el.offsetTop + el.offsetHeight - 200);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/v-faq-cta.png' });

  await browser.close();
  console.log('Done');
})();
