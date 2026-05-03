const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const resources = [];
  page.on('response', async (res) => {
    try {
      const url = res.url();
      const status = res.status();
      const type = res.request().resourceType();
      const headers = res.headers();
      const size = parseInt(headers['content-length'] || '0', 10);
      resources.push({ url, status, type, size });
    } catch (e) {}
  });

  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8765/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'load', timeout: 60000 });
  const loadT = Date.now() - t0;

  // Wait for network idle to get late-loading resources too
  await new Promise(r => setTimeout(r, 4000));
  const totalT = Date.now() - t0;

  // Performance metrics
  const metrics = await page.evaluate(() => {
    const t = performance.timing;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : 0;
    return {
      domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
      loadEvent: t.loadEventEnd - t.navigationStart,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      imageCount: document.querySelectorAll('img').length,
      iframeCount: document.querySelectorAll('iframe').length,
      scriptCount: document.querySelectorAll('script[src]').length,
    };
  });

  // Summarize resources
  const by = (arr, k) => arr.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
  const sizeByType = resources.reduce((m, r) => { m[r.type] = (m[r.type] || 0) + r.size; return m; }, {});
  const byDomain = resources.reduce((m, r) => {
    try { const d = new URL(r.url).hostname; m[d] = (m[d] || 0) + 1; return m; } catch (e) { return m; }
  }, {});

  console.log('\n=== TIMING ===');
  console.log('goto.load:', loadT, 'ms');
  console.log('networkidle total:', totalT, 'ms');
  console.log('DOMContentLoaded:', metrics.domContentLoaded, 'ms');
  console.log('load event:', metrics.loadEvent, 'ms');
  console.log('First Contentful Paint:', Math.round(metrics.firstContentfulPaint), 'ms');
  console.log('Largest Contentful Paint:', Math.round(metrics.largestContentfulPaint), 'ms');

  console.log('\n=== DOM COUNTS ===');
  console.log('images:', metrics.imageCount);
  console.log('iframes:', metrics.iframeCount);
  console.log('external scripts:', metrics.scriptCount);

  console.log('\n=== RESOURCES BY TYPE ===');
  console.log(by(resources, 'type'));

  console.log('\n=== REQUESTS BY DOMAIN ===');
  console.log(byDomain);

  console.log('\n=== TOP 10 LARGEST RESOURCES ===');
  resources.sort((a, b) => b.size - a.size).slice(0, 10).forEach(r => {
    console.log(`${(r.size/1024).toFixed(1)} KB  [${r.type}]  ${r.url.slice(0, 100)}`);
  });

  console.log('\n=== ALL IFRAMES ===');
  resources.filter(r => r.url.includes('map') || r.type === 'document' || r.url.includes('iframe')).slice(0, 15).forEach(r => {
    console.log(`${r.type} ${r.status} ${r.url.slice(0,110)}`);
  });

  await browser.close();
})();
