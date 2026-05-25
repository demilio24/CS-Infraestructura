const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const [label, url] of [
    ['A', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html'],
    ['B', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home-b.html'],
  ]) {
    const p = await b.newPage();
    const wixFailures = [];
    p.on('response', async r => {
      if (r.url().includes('wixstatic.com') && r.status() >= 400) {
        wixFailures.push(`HTTP ${r.status()}: ${r.url()}`);
      }
    });
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll through entire page to trigger lazy-load
    await p.evaluate(async () => {
      const h = document.body.scrollHeight;
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < h; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 250));
      }
      window.scrollTo(0, h);
      await new Promise(r => setTimeout(r, 1000));
    });
    await new Promise(r => setTimeout(r, 1500));

    const stats = await p.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return {
        total: imgs.length,
        loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
        failed: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => ({ src: i.src, alt: i.alt })),
        unfinished: imgs.filter(i => !i.complete).length,
      };
    });
    console.log(`\n=== ${label} (live, mobile, full-scroll) ===`);
    console.log(`Images: ${stats.loaded}/${stats.total} loaded, ${stats.unfinished} still loading, ${stats.failed.length} failed`);
    if (stats.failed.length) {
      console.log('Failed:');
      stats.failed.forEach(f => console.log(`  - ${f.alt || '(no alt)'} :: ${f.src}`));
    }
    if (wixFailures.length) {
      console.log(`Wix CDN HTTP errors: ${wixFailures.length}`);
      wixFailures.slice(0, 5).forEach(e => console.log('  ' + e));
    } else {
      console.log('All Wix CDN responses OK.');
    }
    await p.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
