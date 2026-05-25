const puppeteer = require('puppeteer');
const path = require('path');
const dir = 'F:/GitHub/Websites/.claude/screenshots/aquanauts';
const fs = require('fs');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const targets = [
  ['A', 'file:///F:/GitHub/Websites/Tristan_AquanautsAcademy/funnel/home.html'],
  ['B', 'file:///F:/GitHub/Websites/Tristan_AquanautsAcademy/funnel/home-b.html'],
];
const sections = [['top', 0], ['about', 0.13], ['programs', 0.22], ['events', 0.34], ['locations', 0.44], ['steps', 0.55], ['reviews', 0.65], ['gallery', 0.73], ['team', 0.82], ['why', 0.90], ['faq', 0.95], ['final', 0.99]];

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const [label, url] of targets) {
    // Desktop
    const d = await b.newPage();
    await d.setViewport({ width: 1440, height: 900 });
    await d.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));
    await d.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
    await new Promise(r => setTimeout(r, 700));
    for (const [name, pct] of sections) {
      await d.evaluate(p => window.scrollTo(0, document.body.scrollHeight * p), pct);
      await new Promise(r => setTimeout(r, 500));
      await d.screenshot({ path: path.join(dir, `${label}-desktop-${name}.png`) });
    }
    await d.close();

    // Mobile
    const m = await b.newPage();
    await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await m.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));
    await m.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
    await new Promise(r => setTimeout(r, 700));
    for (const [name, pct] of sections) {
      await m.evaluate(p => window.scrollTo(0, document.body.scrollHeight * p), pct);
      await new Promise(r => setTimeout(r, 500));
      await m.screenshot({ path: path.join(dir, `${label}-mobile-${name}.png`) });
    }
    await m.close();
    console.log(label + ' done');
  }
  await b.close();
  console.log('ALL DONE');
})().catch(e => { console.error(e); process.exit(1); });
