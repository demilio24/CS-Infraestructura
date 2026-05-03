const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const d = await browser.newPage();
  await d.setViewport({ width: 1440, height: 900 });
  await d.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  // Find the win-win section's Y by querying its bounding box
  const winY = await d.evaluate(() => {
    const el = document.querySelector('.guarantee');
    const offset = el.getBoundingClientRect();
    const breakout = document.getElementById('ghl-breakout');
    return el.offsetTop - 60;
  });
  console.log('winY', winY);
  await d.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, winY);
  await new Promise(r => setTimeout(r, 800));
  await d.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/spot-winwin.png` });

  // Step 01 / 02
  const stepY = await d.evaluate(() => document.querySelector('.step-section.step-01').offsetTop - 80);
  await d.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, stepY);
  await new Promise(r => setTimeout(r, 600));
  await d.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/spot-step01.png` });

  // Diff closing block
  const diffBottomY = await d.evaluate(() => document.querySelector('.diff-bottom').offsetTop - 60);
  await d.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, diffBottomY);
  await new Promise(r => setTimeout(r, 600));
  await d.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/spot-diff-bottom.png` });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
