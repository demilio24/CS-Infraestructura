const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8765/Tom_Systema_Floyd/funnel/home.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => {
    const menu = document.querySelector('.sf-nav-dropdown-menu');
    const dropdown = document.querySelector('.sf-nav-dropdown');
    const inner = document.querySelector('.sf-nav-inner');
    return {
      dropdownPos: getComputedStyle(dropdown).position,
      innerPos: getComputedStyle(inner).position,
      menuPos: getComputedStyle(menu).position,
      menuLeft: getComputedStyle(menu).left,
      menuTransform: getComputedStyle(menu).transform,
      menuMinWidth: getComputedStyle(menu).minWidth,
      innerWidth: inner.getBoundingClientRect().width,
      menuRect: menu.getBoundingClientRect(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
