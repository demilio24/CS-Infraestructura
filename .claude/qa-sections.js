const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const sects = [
    ['nav-hero','#hero'],['about','#about'],['programs','#programs'],
    ['locations','#locations'],['steps','#steps'],['reviews','#reviews'],
    ['gallery','.gallery'],['team','#team'],['why','#why'],['faq','#faq'],
    ['final-cta','.final-cta'],['footer','.footer']
  ];

  // Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }
  await page.evaluate(() => window.scrollTo(0,0));
  await new Promise(r => setTimeout(r, 1000));

  for (const [name, sel] of sects) {
    try {
      const el = await page.$(sel);
      if (el) { await el.screenshot({path: '.claude/screenshots/d-' + name + '.png'}); console.log('D:' + name); }
    } catch(e) { console.log('ERR:' + name + ' ' + e.message); }
  }

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h2 = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h2; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }
  await new Promise(r => setTimeout(r, 1000));

  for (const [name, sel] of sects) {
    try {
      const el = await page.$(sel);
      if (el) { await el.screenshot({path: '.claude/screenshots/m-' + name + '.png'}); console.log('M:' + name); }
    } catch(e) { console.log('MERR:' + name + ' ' + e.message); }
  }

  await browser.close();
  console.log('Done');
})();
