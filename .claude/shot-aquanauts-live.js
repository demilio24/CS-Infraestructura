const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const dir = 'F:/GitHub/Websites/.claude/screenshots/aquanauts';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const targets = [
  ['A-live', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html'],
  ['B-live', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home-b.html'],
];

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const [label, url] of targets) {
    const errs = [];
    const p = await b.newPage();
    p.on('pageerror', e => errs.push('JS: ' + e.message));
    p.on('requestfailed', r => errs.push('NET: ' + r.url() + ' (' + (r.failure() || {}).errorText + ')'));
    p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ': ' + r.url()); });

    // Mobile viewport (most leads will be mobile)
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await p.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
    await new Promise(r => setTimeout(r, 800));
    await p.screenshot({ path: path.join(dir, `${label}-mobile-hero.png`) });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.22));
    await new Promise(r => setTimeout(r, 600));
    await p.screenshot({ path: path.join(dir, `${label}-mobile-programs.png`) });

    // Count successful image loads
    const imgStats = await p.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return {
        total: imgs.length,
        loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
        failed: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
      };
    });

    console.log(`\n=== ${label} (${url}) ===`);
    console.log(`Images: ${imgStats.loaded}/${imgStats.total} loaded`);
    if (imgStats.failed.length) {
      console.log(`Failed images:`);
      imgStats.failed.forEach(s => console.log('  ' + s));
    }
    if (errs.length) {
      console.log(`Other errors (${errs.length}):`);
      errs.slice(0, 8).forEach(e => console.log('  ' + e));
    } else {
      console.log('No JS/network errors.');
    }
    await p.close();
  }
  await b.close();
  console.log('\nDONE');
})().catch(e => { console.error(e); process.exit(1); });
