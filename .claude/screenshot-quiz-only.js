const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  const y = await page.evaluate(() => {
    const el = document.getElementById('quiz');
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  });
  console.log('quiz absY:', y);
  await page.evaluate((Y) => window.scrollTo(0, Y - 30), y);
  await new Promise(r => setTimeout(r, 1000));

  const after = await page.evaluate(() => ({ scrollY: window.scrollY, quizTop: document.getElementById('quiz').getBoundingClientRect().top }));
  console.log('after scroll:', JSON.stringify(after));

  await page.screenshot({ path: '.claude/screenshots/clss-quiz-q1-only.png' });

  // Click yes
  await page.evaluate(() => document.querySelector('[data-answer="yes"]').click());
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: '.claude/screenshots/clss-quiz-q2-only.png' });

  // NO -> beginner result
  await page.evaluate(() => document.querySelector('[data-answer="no"]').click());
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '.claude/screenshots/clss-quiz-result-only.png' });

  await browser.close();
  console.log('done');
})();
