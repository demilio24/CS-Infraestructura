const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  await page.setViewport({ width: 1280, height: 2200, deviceScaleFactor: 2 });
  await page.goto('https://link.nilsdigital.com/widget/form/3Z4E9y7WlWgkZDxViBUW', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 6000));

  // Try to locate each dropdown trigger by text and click via mouse (real coordinates)
  const triggerInfo = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'))
      .filter(el => el.offsetParent && el.children.length === 0
        && el.textContent.trim() === 'Click to Display the Options.');
    return els.map(el => {
      const r = el.getBoundingClientRect();
      // Find nearest label up the tree
      let label = '';
      let p = el.parentElement;
      for (let h = 0; h < 8 && p; h++) {
        const hdr = p.querySelector('label, [class*="label"]');
        if (hdr) { label = hdr.innerText.slice(0,80); break; }
        p = p.parentElement;
      }
      return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height, label };
    });
  });
  console.log('Triggers found:', triggerInfo.length);
  console.log(JSON.stringify(triggerInfo, null, 2));

  for (let i = 0; i < triggerInfo.length; i++) {
    const t = triggerInfo[i];
    // Re-find current position (page scroll may have changed)
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 200)), t.y);
    await new Promise(r => setTimeout(r, 400));
    // Re-measure after scroll
    const fresh = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'))
        .filter(el => el.offsetParent && el.children.length === 0
          && el.textContent.trim() === 'Click to Display the Options.');
      return els.map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      });
    });
    if (!fresh[i]) continue;
    await page.mouse.click(fresh[i].x, fresh[i].y);
    await new Promise(r => setTimeout(r, 1000));

    // Capture all visible text of newly opened menu
    const opened = await page.evaluate(() => {
      // Look for any element that became visible with options-like text
      const candidates = Array.from(document.querySelectorAll('ul, div, [role="listbox"]'))
        .filter(el => {
          if (!el.offsetParent) return false;
          const txt = el.innerText || '';
          // crude heuristic: contains a list-y string
          return txt.length > 4 && txt.length < 600 && el.children.length >= 2 && el.children.length <= 30;
        });
      return candidates.map(el => ({
        cls: (el.className || '').slice(0,80),
        txt: (el.innerText || '').trim().slice(0, 600)
      })).slice(0, 10);
    });
    console.log(`\n=== Dropdown #${i+1} (label: "${t.label}") opened ===`);
    console.log(JSON.stringify(opened, null, 2));

    await page.screenshot({
      path: path.join(__dirname, 'screenshots', `camp-form-dd${i+1}-open.png`),
      fullPage: true
    });

    // Close: press Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // Also save raw HTML for grep
  const html = await page.content();
  fs.writeFileSync(path.join(__dirname, 'screenshots', 'camp-form.html'), html);

  await browser.close();
})();
