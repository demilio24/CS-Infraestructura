const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const filePath = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-quiz-variations.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const sections = [
    { id: 'sec-hero', name: 'quiz-01-hero' },
    { id: 'sec-q1', name: 'quiz-02-q1-revenue' },
    { id: 'sec-q2', name: 'quiz-03-q2-leak' },
    { id: 'sec-q3', name: 'quiz-04-q3-team' },
    { id: 'sec-q4', name: 'quiz-05-q4-stack' },
    { id: 'sec-q5', name: 'quiz-06-q5-urgency' },
    { id: 'sec-result', name: 'quiz-07-result' },
    { id: 'sec-cta', name: 'quiz-08-cta' },
  ];

  for (const s of sections) {
    const el = await page.$('#' + s.id);
    if (!el) { console.log('✗ missing', s.id); continue; }
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    await el.screenshot({ path: path.join(outDir, s.name + '.png') });
    console.log('✓', s.name);
  }

  // Full-page mobile
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, 'quiz-mobile-full.png'), fullPage: true });
  console.log('✓ quiz-mobile-full');

  await browser.close();
})();
