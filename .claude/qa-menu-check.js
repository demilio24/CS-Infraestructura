const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // Check if mobile menu is visible
  const menuState = await page.evaluate(() => {
    const menu = document.querySelector('.mobile-menu');
    const backdrop = document.querySelector('.mobile-backdrop');
    const style = window.getComputedStyle(menu);
    return {
      transform: style.transform,
      visibility: style.visibility,
      display: style.display,
      opacity: style.opacity,
      hasOpenClass: menu.classList.contains('open'),
      menuRect: menu.getBoundingClientRect(),
      backdropPointerEvents: backdrop ? window.getComputedStyle(backdrop).pointerEvents : 'N/A'
    };
  });
  console.log('Mobile menu state:', JSON.stringify(menuState, null, 2));

  // Take a viewport-only screenshot (not fullPage) to see what user actually sees
  await page.screenshot({ path: '.claude/screenshots/m-viewport-only.png', fullPage: false });

  // Scroll down and take another viewport screenshot at programs section
  await page.evaluate(() => {
    const el = document.querySelector('#programs');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/m-viewport-programs.png', fullPage: false });

  await browser.close();
  console.log('Done');
})();
