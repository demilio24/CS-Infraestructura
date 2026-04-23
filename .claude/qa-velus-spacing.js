const puppeteer = require('puppeteer');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots/velus-spacing';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  async function shot(name, route, vp) {
    await page.setViewport(vp);
    await page.goto(URL, { waitUntil: 'networkidle0' });
    await page.evaluate(r => {
      sessionStorage.setItem('vp', r);
    }, route);
    await page.reload({ waitUntil: 'networkidle0' });
    // Force all fade-up elements visible
    await page.evaluate(() => {
      document.querySelectorAll('.fu').forEach(el => el.classList.add('in'));
      document.querySelectorAll('.velus-v').forEach(el => el.classList.add('visible'));
      const entry = document.getElementById('entry');
      if (entry) entry.style.display = 'none';
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT}-${name}-full.png`, fullPage: true });
  }

  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 390, height: 844 };

  await shot('home', 'home', desktop);
  await shot('collections', 'collections', desktop);
  await shot('about', 'about', desktop);
  await shot('services', 'services', desktop);
  await shot('contact', 'contact', desktop);

  await shot('home-mobile', 'home', mobile);
  await shot('collections-mobile', 'collections', mobile);
  await shot('about-mobile', 'about', mobile);
  await shot('services-mobile', 'services', mobile);
  await shot('contact-mobile', 'contact', mobile);

  await browser.close();
  console.log('done');
})();
