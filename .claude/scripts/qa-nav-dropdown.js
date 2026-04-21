const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'screenshots', 'systema-qa');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8765/Tom_Systema_Floyd/funnel/home.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Force dropdown visible via inline style so we capture it reliably
  await page.evaluate(() => {
    const m = document.querySelector('.sf-nav-dropdown-menu');
    m.style.opacity = '1';
    m.style.visibility = 'visible';
    m.style.transform = 'translate(-50%, 0)';
  });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: path.join(OUT, 'nav-dropdown-open.png'), fullPage: false });

  const rect = await page.evaluate(() => {
    const m = document.querySelector('.sf-nav-dropdown-menu');
    const r = m.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, width: r.width };
  });
  console.log('Menu rect:', rect);
  await browser.close();
})();
