const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  const filePath =
    'file:///' +
    path
      .resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/featured-review-variations.html')
      .replace(/\\/g, '/');

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/featured-review');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Desktop pass
  let page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));

  const desktopSelectors = ['.v1', '.v2', '.v3'];
  for (let i = 0; i < desktopSelectors.length; i++) {
    const label = String.fromCharCode(49 + i); // 1, 2, 3
    const el = await page.$(desktopSelectors[i]);
    if (el) {
      await el.scrollIntoView();
      await new Promise((r) => setTimeout(r, 400));
      await el.screenshot({ path: path.join(outDir, `desktop-${label}.png`) });
      console.log(`SAVED desktop-${label}.png`);
    }
  }
  await page.close();

  // Mobile pass
  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 1400, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  );
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));

  for (let i = 0; i < desktopSelectors.length; i++) {
    const label = String.fromCharCode(49 + i);
    const el = await page.$(desktopSelectors[i]);
    if (el) {
      await el.scrollIntoView();
      await new Promise((r) => setTimeout(r, 400));
      await el.screenshot({ path: path.join(outDir, `mobile-${label}.png`) });
      console.log(`SAVED mobile-${label}.png`);
    }
  }

  await browser.close();
})();
