const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: false });
  await m.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  const info = await m.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    docW: document.documentElement.clientWidth,
    breakoutW: document.getElementById('ghl-breakout').clientWidth,
    diffComp: getComputedStyle(document.querySelector('.diff-comparison')).gridTemplateColumns,
    step01: getComputedStyle(document.querySelector('.step01-inner')).gridTemplateColumns,
    costAnim: getComputedStyle(document.querySelector('.cost-anim-wrap')).gridTemplateColumns,
    pocGrid: getComputedStyle(document.querySelector('.poc-grid')).gridTemplateColumns,
    matrixCards: getComputedStyle(document.querySelector('.matrix-cards')).gridTemplateColumns,
  }));
  console.log(JSON.stringify(info, null, 2));
  // Sample shots
  for (const y of [1300, 2200, 3500, 5000, 9700]) {
    await m.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 400));
    await m.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/mdebug-${y}.png` });
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
