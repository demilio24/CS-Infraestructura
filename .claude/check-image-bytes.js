const puppeteer = require('puppeteer');
const path = require('path');

const FILE_PATH =
  'file:///' +
  path
    .resolve(
      'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
    )
    .replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  const imgBytes = [];
  page.on('response', async (res) => {
    const url = res.url();
    const type = res.request().resourceType();
    if (type !== 'image') return;
    try {
      const buf = await res.buffer();
      const ct = res.headers()['content-type'] || '';
      imgBytes.push({
        kb: Math.round(buf.length / 1024),
        ct,
        url,
      });
    } catch (e) {}
  });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  );
  await page.goto(FILE_PATH, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(async () => {
    const t = document.documentElement.scrollHeight;
    for (let y = 0; y <= t; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  imgBytes.sort((a, b) => b.kb - a.kb);
  console.log('Image payloads (sorted by size):');
  let total = 0;
  for (const i of imgBytes) {
    total += i.kb;
    console.log(`  ${String(i.kb).padStart(5)} KB  ${i.ct.padEnd(15)}\n     ${i.url}`);
  }
  console.log(`\n  TOTAL image bytes: ${total} KB (${(total / 1024).toFixed(2)} MB)`);
  console.log(`  Image count: ${imgBytes.length}`);

  await browser.close();
})();
