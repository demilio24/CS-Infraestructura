const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');

  const filePath = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.evaluate(() => {
    let m = document.querySelector('meta[name=viewport]');
    if (!m) { m = document.createElement('meta'); m.name='viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
    // Force eager loading on every img to avoid lazy-loading screenshot artifacts
    document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
  });

  // Scroll the entire page to trigger any remaining lazy load + IntersectionObservers
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y <= total; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });

  // Wait for all images to actually finish loading
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalHeight > 0) return Promise.resolve();
      return new Promise(res => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      });
    }));
  });

  await new Promise(r => setTimeout(r, 800));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/mobile-real-v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Diagnostic on the same elements
  const data = await page.evaluate(() => {
    const grid = document.querySelector('.proof-reviews-grid');
    const gridInfo = grid ? {
      h: Math.round(grid.getBoundingClientRect().height),
      childImgsLoaded: Array.from(grid.querySelectorAll('img')).map(i => ({
        nat: `${i.naturalWidth}x${i.naturalHeight}`,
        h: Math.round(i.getBoundingClientRect().height),
      })),
    } : null;
    const about = document.querySelector('.about');
    const aboutH = about ? Math.round(about.getBoundingClientRect().height) : null;
    const proof = document.querySelector('.proof-section');
    const proofH = proof ? Math.round(proof.getBoundingClientRect().height) : null;
    return { gridInfo, aboutH, proofH };
  });
  console.log(JSON.stringify(data, null, 2));

  // Now screenshot proof + about with proper sizes
  for (const [sel, name] of [
    ['.about', 'about'],
    ['.proof-section', 'proof'],
  ]) {
    const el = await page.$(sel);
    if (el) {
      await el.scrollIntoView();
      await new Promise(r => setTimeout(r, 600));
      await el.screenshot({ path: path.join(outDir, `${name}.png`) });
      console.log(`SAVED: ${name}.png`);
    }
  }

  await browser.close();
})();
