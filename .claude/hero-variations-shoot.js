const puppeteer = require('puppeteer');
const path = require('path');

const FILES = [
  'v1-editorial-bold',
  'v2-dark-glass',
  'v3-magazine-serif',
  'v4-vibrant-gradient',
  'v5-apple-minimal',
];

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  for (const f of FILES) {
    const filePath = path.join(__dirname, '..', 'Nils', 'funnel', 'hero-variations', `${f}.html`);
    const url = 'file:///' + filePath.replace(/\\/g, '/');

    // Desktop
    const dpage = await browser.newPage();
    await dpage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await dpage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));
    await dpage.screenshot({ path: path.join(__dirname, 'screenshots', `hero-${f}-desktop.png`), fullPage: false });
    await dpage.close();

    // Mobile
    const mpage = await browser.newPage();
    await mpage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await mpage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 800));
    await mpage.screenshot({ path: path.join(__dirname, 'screenshots', `hero-${f}-mobile.png`), fullPage: false });
    await mpage.close();

    console.log(`done ${f}`);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
