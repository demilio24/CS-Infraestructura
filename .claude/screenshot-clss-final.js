const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  // Hero (top of page)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '.claude/screenshots/clss-final-hero.png' });

  // Quiz section
  await page.evaluate(() => {
    const el = document.getElementById('quiz');
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '.claude/screenshots/clss-final-quiz-q1.png' });

  // Click YES → q_swim
  await page.evaluate(() => document.querySelector('[data-answer="yes"]').click());
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: '.claude/screenshots/clss-final-quiz-q2.png' });

  // Click NO → r_beginner
  await page.evaluate(() => document.querySelector('[data-answer="no"]').click());
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: '.claude/screenshots/clss-final-quiz-result.png' });

  // Locations
  await page.evaluate(() => {
    document.getElementById('locations').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '.claude/screenshots/clss-final-locations.png' });

  // Lane rope divider visual
  await page.evaluate(() => {
    const rd = document.querySelectorAll('.rope-divider')[1];
    if (rd) rd.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: '.claude/screenshots/clss-final-rope-divider.png' });

  await browser.close();
  console.log('done');
})();
