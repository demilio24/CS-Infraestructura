const puppeteer = require('puppeteer');
const path = require('path');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const URL = 'http://localhost:8765/Mandy_VeLUS_Design/mandy.html';
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  console.log('--- DESKTOP TESTS ---');
  const d = await browser.newPage();
  await d.setViewport({ width: 1440, height: 900 });
  await d.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);

  // Force all reveals visible (simulates having scrolled through the page)
  await d.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));

  await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-01-hero.png') });
  console.log('1. Hero screenshot taken');

  const box = await d.$('.hero-cta-btn').then(b => b ? b.boundingBox() : null);
  console.log(`2. Hero CTA: ${box ? 'VISIBLE y=' + Math.round(box.y) : 'MISSING'}`);

  // Test 3: Click hero CTA
  await d.click('.hero-cta-btn');
  await wait(1500);
  await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-02-modal.png') });
  const t3 = await d.$eval('#formModal', e => e.classList.contains('open'));
  console.log(`3. Modal open: ${t3}`);

  // Test 4: iframe src
  const src = await d.$eval('iframe', e => e.src);
  console.log(`4. Iframe src: ${src ? 'SET' : 'EMPTY'}`);

  // Test 5: Close by clicking background
  // Click outside the card area
  await d.mouse.click(50, 50);
  await wait(1200);
  const t5open = await d.$eval('#formModal', e => e.classList.contains('open'));
  const t5visible = await d.$eval('#formModal', e => e.classList.contains('visible'));
  console.log(`5. After bg click: open=${t5open}, visible=${t5visible} ${!t5open ? 'CLOSED OK' : 'BUG'}`);

  // Test 6: Monogram padding
  await d.evaluate(() => document.querySelector('.monogram').scrollIntoView());
  await wait(500);
  await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-03-monogram.png') });
  const mp = await d.$eval('.monogram', e => ({ t: getComputedStyle(e).paddingTop, b: getComputedStyle(e).paddingBottom }));
  console.log(`6. Monogram padding: top=${mp.t} bottom=${mp.b}`);

  // Test 7: Lightbox
  await d.evaluate(() => document.querySelector('.work-gallery').scrollIntoView());
  await wait(1000);
  await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-04-gallery.png') });
  // Click the first visible work item
  const clicked = await d.evaluate(() => {
    const item = document.querySelector('.work-item:not(.hidden)');
    if (item) { item.click(); return true; }
    return false;
  });
  await wait(500);
  const lbOpen = await d.$eval('#lightbox', e => e.classList.contains('open'));
  console.log(`7. Lightbox: clicked=${clicked}, open=${lbOpen} ${lbOpen ? 'OK' : 'BUG'}`);
  if (lbOpen) {
    await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-05-lightbox.png') });
    await d.click('#lightboxClose');
    await wait(500);
  }

  // Test 8: Inline CTA
  const btns = await d.$$('.inline-cta-link');
  console.log(`8. Inline CTAs: ${btns.length} found`);
  if (btns[0]) {
    await btns[0].scrollIntoViewIfNeeded();
    await wait(300);
    await btns[0].click();
    await wait(1500);
    const t8 = await d.$eval('#formModal', e => e.classList.contains('open'));
    console.log(`   Begin a Conversation: ${t8 ? 'OPENED' : 'BUG'}`);
    await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-06-inline-modal.png') });
    await d.click('.modal-close');
    await wait(1000);
  }

  // Test 9: CTA section button
  await d.evaluate(() => document.querySelector('.cta-btn').scrollIntoView());
  await wait(500);
  await d.click('.cta-btn');
  await wait(1500);
  console.log(`9. CTA btn: ${await d.$eval('#formModal', e => e.classList.contains('open')) ? 'OPENED' : 'BUG'}`);
  await d.screenshot({ path: path.join(SCREENSHOT_DIR, 'dt-07-cta-modal.png') });
  await d.click('.modal-close');
  await wait(1000);

  // ===== MOBILE =====
  console.log('\n--- MOBILE TESTS ---');
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await m.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await m.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));

  // M1: Hero CTA visible
  await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-01-hero.png') });
  const mbox = await m.$('.hero-cta-btn').then(b => b ? b.boundingBox() : null);
  console.log(`M1. Hero CTA: ${mbox ? 'y=' + Math.round(mbox.y) + (mbox.y > 844 ? ' BELOW VIEWPORT!' : ' OK') : 'MISSING'}`);

  // M2: Tap hero CTA
  await m.tap('.hero-cta-btn');
  await wait(1500);
  const m2 = await m.$eval('#formModal', e => e.classList.contains('open'));
  console.log(`M2. Modal: ${m2 ? 'OPEN' : 'BUG'}`);
  await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-02-modal.png') });

  // M2b: Close by tapping background
  await m.touchscreen.tap(30, 30);
  await wait(1200);
  const m2b = await m.$eval('#formModal', e => e.classList.contains('open'));
  console.log(`M2b. Close on bg tap: ${!m2b ? 'CLOSED OK' : 'BUG'}`);

  // M3: Hamburger
  await m.tap('.hamburger');
  await wait(500);
  await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-03-menu.png') });
  console.log(`M3. Menu: ${await m.$eval('#mobileMenu', e => e.classList.contains('open')) ? 'OPEN' : 'BUG'}`);

  // M4: Inquiry from menu
  const inquiry = await m.evaluateHandle(() => [...document.querySelectorAll('#mobileMenu a')].find(a => a.textContent.trim() === 'Inquiry'));
  if (inquiry.asElement()) {
    await inquiry.asElement().tap();
    await wait(2000);
    console.log(`M4. Inquiry: ${await m.$eval('#formModal', e => e.classList.contains('open')) ? 'OPENED' : 'BUG'}`);
    await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-04-inquiry.png') });
    await m.tap('.modal-close');
    await wait(1000);
  }

  // M5: Monogram
  await m.evaluate(() => document.querySelector('.monogram').scrollIntoView());
  await wait(500);
  await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-05-monogram.png') });
  const mmp = await m.$eval('.monogram', e => ({ t: getComputedStyle(e).paddingTop, b: getComputedStyle(e).paddingBottom }));
  console.log(`M5. Monogram: top=${mmp.t} bottom=${mmp.b}`);

  // M6: Gallery lightbox
  await m.evaluate(() => document.querySelector('.work-gallery').scrollIntoView());
  await wait(1000);
  await m.evaluate(() => document.querySelector('.work-item').click());
  await wait(500);
  console.log(`M6. Lightbox: ${await m.$eval('#lightbox', e => e.classList.contains('open')) ? 'OPEN' : 'BUG'}`);
  await m.screenshot({ path: path.join(SCREENSHOT_DIR, 'mb-06-lightbox.png') });
  await m.tap('#lightboxClose');
  await wait(500);

  // M7: Inline CTA
  const mInline = await m.$('.inline-cta-link');
  if (mInline) {
    await mInline.scrollIntoViewIfNeeded();
    await wait(300);
    await mInline.tap();
    await wait(1500);
    console.log(`M7. Inline CTA: ${await m.$eval('#formModal', e => e.classList.contains('open')) ? 'OPENED' : 'BUG'}`);
    await m.tap('.modal-close');
    await wait(1000);
  }

  // M8: Modal display when closed
  const disp = await m.$eval('#formModal', e => getComputedStyle(e).display);
  console.log(`M8. Closed modal: display="${disp}" ${disp === 'none' ? 'CORRECT' : 'BUG - keyboard will hijack'}`);

  console.log('\n--- ALL TESTS DONE ---');
  await browser.close();
  process.exit(0);
})();