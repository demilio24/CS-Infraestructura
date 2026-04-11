const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // Test FAQ accordion
  const faqBtn = await page.$('.faq-q');
  if (faqBtn) {
    await page.evaluate(el => el.scrollIntoView({ block: 'center' }), faqBtn);
    await new Promise(r => setTimeout(r, 300));
    await faqBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const afterOpen = await page.evaluate(() => {
      const item = document.querySelector('.faq-item');
      const ans = item ? item.querySelector('.faq-a') : null;
      return {
        hasOpen: item ? item.classList.contains('open') : 'no item',
        ansHeight: ans ? ans.offsetHeight : 0,
        ansMaxH: ans ? window.getComputedStyle(ans).maxHeight : 'N/A'
      };
    });
    console.log('FAQ OPEN:', JSON.stringify(afterOpen));
    await page.screenshot({ path: '.claude/screenshots/qa-faq-open.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

    // Close it
    await faqBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const afterClose = await page.evaluate(() => {
      const item = document.querySelector('.faq-item');
      const ans = item ? item.querySelector('.faq-a') : null;
      return {
        hasOpen: item ? item.classList.contains('open') : 'no item',
        ansHeight: ans ? ans.offsetHeight : 0,
        ansMaxH: ans ? window.getComputedStyle(ans).maxHeight : 'N/A'
      };
    });
    console.log('FAQ CLOSED:', JSON.stringify(afterClose));
  } else {
    console.log('No FAQ button found');
  }

  // Test mobile hamburger menu
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  const hamburger = await page.$('#hamburgerBtn');
  if (hamburger) {
    await hamburger.click();
    await new Promise(r => setTimeout(r, 500));
    const menuOpen = await page.evaluate(() => {
      const menu = document.querySelector('.mobile-menu');
      const backdrop = document.querySelector('.mobile-backdrop');
      return {
        menuHasOpen: menu.classList.contains('open'),
        menuVisible: window.getComputedStyle(menu).visibility,
        backdropOpen: backdrop.classList.contains('open')
      };
    });
    console.log('MOBILE MENU OPEN:', JSON.stringify(menuOpen));
    await page.screenshot({ path: '.claude/screenshots/qa-mobile-menu-open.png' });

    // Close via backdrop
    const backdrop = await page.$('#mobileBackdrop');
    await backdrop.click();
    await new Promise(r => setTimeout(r, 500));
    const menuClosed = await page.evaluate(() => {
      const menu = document.querySelector('.mobile-menu');
      return {
        menuHasOpen: menu.classList.contains('open'),
        menuVisible: window.getComputedStyle(menu).visibility
      };
    });
    console.log('MOBILE MENU CLOSED:', JSON.stringify(menuClosed));
  }

  // Test CTA scroll to form
  const ctaBtn = await page.$('a[href="#hero-form"]');
  if (ctaBtn) {
    await page.evaluate(el => el.scrollIntoView(), ctaBtn);
    await ctaBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    const scrollPos = await page.evaluate(() => window.scrollY);
    const formPos = await page.evaluate(() => {
      const form = document.getElementById('hero-form');
      return form ? form.getBoundingClientRect().top : 'not found';
    });
    console.log('CTA SCROLL: scrollY=' + scrollPos + ', formTopFromViewport=' + formPos);
  }

  await browser.close();
  console.log('Interactive tests done');
})();
