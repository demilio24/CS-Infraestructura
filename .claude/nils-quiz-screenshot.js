const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRAGMENT = fs.readFileSync(path.join(__dirname, '..', 'Nils', 'funnel', 'nils-quiz-fast-direct.html'), 'utf8');
const WRAPPER = fs.readFileSync(path.join(__dirname, 'nils-quiz-audit-wrap.html'), 'utf8');
const tmpPath = path.join(__dirname, 'nils-quiz-audit-tmp.html');
fs.writeFileSync(tmpPath, WRAPPER.replace('<!--FRAGMENT-->', FRAGMENT));

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 320px (iPhone SE)
  await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 });
  await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-320-hero.png'), clip: { x: 0, y: 0, width: 320, height: 1500 } });

  // Scroll down to where the HVP video is
  await page.evaluate(() => {
    document.getElementById('ghl-breakout').scrollTop = 1100;
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-320-hvp.png'), fullPage: false });

  // 390px (iPhone 14)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => { document.getElementById('ghl-breakout').scrollTop = 0; });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-390-hero.png'), fullPage: false });

  // Test the calendar reveal
  await page.evaluate(() => window.showCalendar && window.showCalendar());
  await new Promise(r => setTimeout(r, 3500));
  await page.evaluate(() => { document.getElementById('quiz-card').scrollIntoView({ block: 'start' }); });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-390-calendar.png'), fullPage: false });

  await browser.close();
  console.log('Done — screenshots in .claude/screenshots/audit-*.png');
})().catch(e => { console.error(e); process.exit(1); });
