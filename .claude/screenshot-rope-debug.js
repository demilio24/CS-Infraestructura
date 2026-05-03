const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Inspect the first .rope-divider
  const info = await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    if (!d) return { error: 'no .rope-divider found' };
    const cs = getComputedStyle(d);
    const r = d.getBoundingClientRect();
    return {
      box: { width: r.width, height: r.height, top: r.top },
      backgroundColor: cs.backgroundColor,
      maskImage: cs.maskImage,
      webkitMaskImage: cs.webkitMaskImage,
      maskSize: cs.maskSize,
      webkitMaskSize: cs.webkitMaskSize,
      maskRepeat: cs.maskRepeat,
      webkitMaskRepeat: cs.webkitMaskRepeat,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Try fetching the SVG to ensure the URL resolves
  const svgFetch = await page.evaluate(async () => {
    try {
      const r = await fetch('3-lane-rope-tile.svg');
      const txt = await r.text();
      return { ok: r.ok, status: r.status, length: txt.length, first: txt.slice(0, 80) };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('SVG fetch:', JSON.stringify(svgFetch, null, 2));

  // Take a tall close-up screenshot of the first divider with surrounding sections
  const clip = await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    d.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  const c = await page.evaluate(() => {
    const d = document.querySelector('.rope-divider');
    const r = d.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top - 80), width: 1440, height: r.height + 160 };
  });
  await page.screenshot({ path: 'F:/GitHub/Websites/.claude/screenshots/clss-rope-debug-1.png', clip: c });

  await browser.close();
})();
