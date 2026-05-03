const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  // State 1: Top of page - dark gradient over hero
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/nav-01-dark-over-hero.png`, clip: { x: 0, y: 0, width: 1440, height: 150 } });
  await page.screenshot({ path: `${OUT}/nav-01-hero-full.png`, clip: { x: 0, y: 0, width: 1440, height: 600 } });

  // State 2: Scrolled - solid white
  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/nav-02-solid-scrolled.png`, clip: { x: 0, y: 0, width: 1440, height: 150 } });

  const info = await page.evaluate(() => {
    const nav = document.querySelector('nav.top');
    const trigger = document.querySelector('.nav-trigger');
    const logo = document.querySelector('.nav-logo');
    const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; })() : null;
    return { navClass: nav.className, nav: rect(nav), logo: rect(logo), trigger: rect(trigger), distFromRight: window.innerWidth - rect(trigger).right };
  });
  console.log('scrolled state:', JSON.stringify(info, null, 2));

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/nav-03-mobile-dark.png`, clip: { x: 0, y: 0, width: 390, height: 120 } });

  await browser.close();
})();
