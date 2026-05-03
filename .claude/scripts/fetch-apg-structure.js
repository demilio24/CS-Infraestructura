const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  page.on('console', msg => console.log('[browser]', msg.text()));

  await page.goto('https://audit.apgsoftware.com/', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));

  // Slow scroll to trigger lazy loads
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0;
      const step = 600;
      const max = document.body.scrollHeight;
      const t = setInterval(() => {
        window.scrollTo(0, y);
        y += step;
        if (y >= max) { clearInterval(t); resolve(); }
      }, 200);
    });
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  const outDir = path.resolve(__dirname, '..', 'screenshots', 'apg-source');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Full page desktop
  await page.screenshot({ path: path.join(outDir, 'apg-desktop-fullpage.png'), fullPage: true });

  // Mobile too
  const mp = await browser.newPage();
  await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mp.goto('https://audit.apgsoftware.com/', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  await mp.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0; const step = 600; const max = document.body.scrollHeight;
      const t = setInterval(() => { window.scrollTo(0, y); y += step; if (y >= max) { clearInterval(t); resolve(); } }, 200);
    });
  });
  await new Promise(r => setTimeout(r, 2000));
  await mp.evaluate(() => window.scrollTo(0, 0));
  await mp.screenshot({ path: path.join(outDir, 'apg-mobile-fullpage.png'), fullPage: true });

  // Also dump section headings + hierarchy for reference
  const outline = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section, header, footer, [class*="section"], [class*="hero"]'));
    return sections.slice(0, 60).map((s, i) => {
      const rect = s.getBoundingClientRect();
      return {
        i,
        tag: s.tagName.toLowerCase(),
        cls: (s.className || '').toString().slice(0, 200),
        h: Math.round(rect.height),
        text: (s.innerText || '').replace(/\s+/g, ' ').slice(0, 220)
      };
    });
  });
  fs.writeFileSync(path.join(outDir, 'apg-outline.json'), JSON.stringify(outline, null, 2));

  await browser.close();
  console.log('Done. Outline length:', outline.length);
})().catch(e => { console.error(e); process.exit(1); });
