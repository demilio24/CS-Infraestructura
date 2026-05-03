const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const url = 'http://localhost:8080/Becca_AquaSquadSwim/becca.html#gallery';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Force fade-up elements visible
  await page.evaluate(() => {
    document.querySelectorAll('.fade-up').forEach(el => {
      el.classList.add('is-visible', 'visible', 'in-view');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });

  // Wait for image / video layout to settle
  await new Promise(r => setTimeout(r, 4000));

  // Detailed measurement of every gallery item + gap to button
  const measurements = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#gallery .gallery-item')];
    const grid = document.querySelector('#gallery .gallery-grid');
    const btn = document.querySelector('#gallery .gallery-grid + .text-center .btn-primary');
    const r = (el) => { const rr = el.getBoundingClientRect(); return { top: rr.top, bottom: rr.bottom, height: rr.height }; };
    return {
      items: items.map((el, i) => {
        const media = el.querySelector('img, video');
        return {
          index: i + 1,
          ...r(el),
          mediaTag: media && media.tagName.toLowerCase(),
          mediaSrc: media && (media.currentSrc || media.src || (media.querySelector('source') && media.querySelector('source').src)) || null,
          mediaReadyState: media && media.tagName === 'VIDEO' ? media.readyState : null,
        };
      }),
      grid: grid && r(grid),
      btn: btn && r(btn),
    };
  });
  console.log('MEASUREMENTS:', JSON.stringify(measurements, null, 2));

  // Screenshot the gallery section using its element handle
  const sec = await page.$('#gallery');
  const outPath = path.join(__dirname, 'screenshots', 'becca-gallery-full.png');
  await sec.screenshot({ path: outPath });
  console.log('Screenshot saved to:', outPath);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
