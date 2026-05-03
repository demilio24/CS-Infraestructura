/**
 * Verifies card clicks now just scroll to the lead form (no iframe rewrites).
 */
const puppeteer = require('puppeteer');
const path = require('path');

const PAGE_URL = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);

  const initialSrc = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
  const formY = await page.$eval('#hero-form', (el) => el.getBoundingClientRect().top + window.pageYOffset);
  console.log('Initial iframe src:', initialSrc);
  console.log('Form Y position:', formY);

  const tests = [
    { sel: '[data-location="Edgewater"] .loc-card-img', name: 'Edgewater card' },
    { sel: '[data-location="Calvert"] .loc-card-img', name: 'Calvert card' },
    { sel: '[data-location="Flat Iron"] .loc-card-img', name: 'Flat Iron card' },
    { sel: '[data-location="Severna Park"] .loc-card-img', name: 'Severna Park card' },
    { sel: '[data-prefill-location="Severna Park"]', name: 'SP "Join Waitlist" btn' },
  ];

  for (const { sel, name } of tests) {
    // Scroll target into view first (so we know we're starting away from form)
    await page.evaluate((s) => {
      document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' });
    }, sel);
    await wait(400);
    const yBefore = await page.evaluate(() => window.pageYOffset);

    await page.click(sel);
    // Allow smooth scroll to complete
    await wait(1500);

    const yAfter = await page.evaluate(() => window.pageYOffset);
    const src = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
    const scrolledTowardForm = Math.abs(yAfter - (formY - 80)) < 80;
    const iframeUntouched = src === initialSrc;
    const flashing = await page.$eval('#hero-form', (el) =>
      el.classList.contains('form-highlight')
    );

    console.log(`\n${name}:`);
    console.log(`  yBefore=${yBefore.toFixed(0)} → yAfter=${yAfter.toFixed(0)} (form at ${formY.toFixed(0)})`);
    console.log(`  scrolled to form: ${scrolledTowardForm ? '✓' : '✗'}`);
    console.log(`  iframe unchanged: ${iframeUntouched ? '✓' : '✗'}  (src=${src.endsWith('giAMs7ax6rJPENTGe40M') ? 'base' : 'modified!'})`);
    console.log(`  form pulse class active: ${flashing ? '✓' : '(may have already faded)'}`);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'clss-scroll-final.png'),
    fullPage: false,
  });
  await browser.close();
  console.log('\nDone. Final screenshot: clss-scroll-final.png');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
