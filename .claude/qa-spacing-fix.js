const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // DESKTOP: home final CTA
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    document.querySelector('section.finalcta').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/fix-home-finalcta-desktop.png`, fullPage: false });

  // MOBILE: home final CTA
  await page.setViewport({ width: 390, height: 1000 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    document.querySelector('section.finalcta').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -40);
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/fix-home-finalcta-mobile.png`, fullPage: false });

  // CONTACT page bottom
  await page.setViewport({ width: 390, height: 1000 });
  await page.goto(URL + '#contact', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    if (typeof showPage === 'function') showPage('contact');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    // scroll to bottom of contact
    const sub = document.querySelector('.c-submit');
    if (sub) sub.scrollIntoView({ block: 'end' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/fix-contact-submit-mobile.png`, fullPage: false });

  // DESKTOP contact bottom
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const sub = document.querySelector('.c-submit');
    if (sub) sub.scrollIntoView({ block: 'end' });
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/fix-contact-submit-desktop.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
