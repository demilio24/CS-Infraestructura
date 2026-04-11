const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  // Open menu
  const hamburger = await page.$('#hamburgerBtn');
  await hamburger.click();
  await new Promise(r => setTimeout(r, 500));
  console.log('Menu opened');

  // Close via hamburger again
  await hamburger.click();
  await new Promise(r => setTimeout(r, 500));
  const afterClose = await page.evaluate(() => {
    const menu = document.querySelector('.mobile-menu');
    return {
      hasOpen: menu.classList.contains('open'),
      visibility: window.getComputedStyle(menu).visibility
    };
  });
  console.log('HAMBURGER CLOSE:', JSON.stringify(afterClose));

  // Test CTA scroll
  await page.evaluate(() => window.scrollTo(0, 2000));
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const link = document.querySelector('.final-cta a[href="#hero-form"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const formVisible = await page.evaluate(() => {
    const form = document.getElementById('hero-form');
    if (!form) return 'not found';
    const rect = form.getBoundingClientRect();
    return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), inView: rect.top >= 0 && rect.top < window.innerHeight };
  });
  console.log('FORM AFTER CTA CLICK:', JSON.stringify(formVisible));

  // Check splash animation triggered
  const hasHighlight = await page.evaluate(() => {
    const form = document.getElementById('hero-form');
    return form ? form.classList.contains('form-highlight') : false;
  });
  console.log('SPLASH ANIMATION ACTIVE:', hasHighlight);

  await browser.close();
  console.log('Done');
})();
