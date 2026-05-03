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
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-1280-hero.png'), clip: { x: 0, y: 0, width: 1280, height: 800 } });
  await browser.close();
  console.log('done');
})();
