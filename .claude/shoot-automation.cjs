const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const url = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct.html').replace(/\\/g, '/');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));

  const fullHeight = await page.evaluate(() => document.getElementById('ghl-breakout').scrollHeight);
  console.log('Total page height (inner):', fullHeight);

  // Slice the page into sections — scroll the inner #ghl-breakout
  const slices = [
    { name: 'desktop-01-hero', y: 0 },
    { name: 'desktop-02-cost', y: 900 },
    { name: 'desktop-03-cost-anim', y: 1500 },
    { name: 'desktop-04-step01', y: 2400 },
    { name: 'desktop-05-step02', y: 3300 },
    { name: 'desktop-06-poc', y: 4200 },
    { name: 'desktop-07-diff', y: 5100 },
    { name: 'desktop-08-diff-photos', y: 6000 },
    { name: 'desktop-09-results', y: 6900 },
    { name: 'desktop-10-winwin', y: 7800 },
    { name: 'desktop-11-faq', y: 8700 },
    { name: 'desktop-12-matrix', y: 9600 },
    { name: 'desktop-13-footer', y: Math.max(0, fullHeight - 700) },
  ];

  for (const s of slices) {
    await page.evaluate(y => { document.getElementById('ghl-breakout').scrollTop = y; }, s.y);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/${s.name}.png`, fullPage: false });
    console.log('shot', s.name, 'at y=', s.y);
  }

  // Mobile
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await mobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4500));
  const mobileHeight = await mobile.evaluate(() => document.getElementById('ghl-breakout').scrollHeight);
  console.log('Mobile height (inner):', mobileHeight);

  const mSlices = [
    { name: 'mobile-01-hero', y: 0 },
    { name: 'mobile-02-cost', y: 1000 },
    { name: 'mobile-03-cost-anim', y: 1900 },
    { name: 'mobile-04-step01', y: 3200 },
    { name: 'mobile-05-step02', y: 4400 },
    { name: 'mobile-06-poc', y: 5600 },
    { name: 'mobile-07-diff', y: 6800 },
    { name: 'mobile-08-results', y: 8500 },
    { name: 'mobile-09-winwin', y: 10000 },
    { name: 'mobile-10-faq', y: 11200 },
    { name: 'mobile-11-matrix', y: 12500 },
    { name: 'mobile-12-footer', y: Math.max(0, mobileHeight - 800) },
  ];
  for (const s of mSlices) {
    await mobile.evaluate(y => { document.getElementById('ghl-breakout').scrollTop = y; }, s.y);
    await new Promise(r => setTimeout(r, 500));
    await mobile.screenshot({ path: `f:/GitHub/Websites/.claude/screenshots/${s.name}.png`, fullPage: false });
    console.log('shot', s.name, 'at y=', s.y);
  }

  // Console errors
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await new Promise(r => setTimeout(r, 800));
  if (errors.length) console.log('Console errors:\n', errors.join('\n'));
  else console.log('No console errors');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
