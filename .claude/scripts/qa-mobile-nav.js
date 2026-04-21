const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8765/Tom_Systema_Floyd/funnel/home.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => {
    const cta = document.querySelector('.sf-nav-cta');
    const toggle = document.querySelector('.sf-nav-toggle');
    const right = document.querySelector('.sf-nav-side-right');
    return {
      ctaDisplay: getComputedStyle(cta).display,
      ctaText: cta.textContent.trim(),
      ctaRect: cta.getBoundingClientRect(),
      toggleRect: toggle.getBoundingClientRect(),
      rightDisplay: getComputedStyle(right).display,
      rightRect: right.getBoundingClientRect(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'systema-qa', 'home-mobile-nav-zoom.png'), clip: { x: 0, y: 0, width: 390, height: 160 } });
  await browser.close();
})();
