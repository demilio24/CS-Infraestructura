const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const abs = path.resolve(__dirname, '..', '..', 'Nils', 'funnel', 'automation-vsl-funnel-direct.html');
  const file = 'file:///' + abs.split(path.sep).join('/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.addStyleTag({ content: '.anim{opacity:1!important;transform:none!important;}' });

  const card = await page.$('.step-02 .leads-anim-card');
  await card.scrollIntoView();
  await new Promise(r => setTimeout(r, 600));
  await card.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'automation-pmatrix-only.png') });

  const debug = await page.evaluate(() => {
    const grid = document.querySelector('.pmatrix-grid');
    const dot = document.querySelector('.pmatrix-dot');
    const cs = grid ? getComputedStyle(grid) : null;
    const dotCs = dot ? getComputedStyle(dot) : null;
    return {
      gridRect: grid ? grid.getBoundingClientRect() : null,
      gridDisplay: cs ? cs.display : null,
      gridAspectRatio: cs ? cs.aspectRatio : null,
      gridHeight: cs ? cs.height : null,
      dotCount: document.querySelectorAll('.pmatrix-dot').length,
      dotBg: dotCs ? dotCs.backgroundColor : null,
      dotPos: dot ? { left: dot.style.left, top: dot.style.top, w: dotCs.width, h: dotCs.height } : null,
    };
  });
  console.log(JSON.stringify(debug, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
