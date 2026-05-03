const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.addStyleTag({ content: `#entry{display:none!important}.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  // Top of page (hero + nav)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/nav-desktop-hero.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } });

  // full hero
  await page.screenshot({ path: `${OUT}/nav-desktop-full-hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // measurements
  const info = await page.evaluate(() => {
    const nav = document.querySelector('nav.top');
    const logo = document.querySelector('.nav-logo');
    const trigger = document.querySelector('.nav-trigger');
    const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) }; })() : null;
    return {
      viewportWidth: window.innerWidth,
      nav: rect(nav),
      logo: rect(logo),
      trigger: rect(trigger),
      navClass: nav.className,
      navBg: getComputedStyle(nav).background.substring(0, 120)
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // mobile
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/nav-mobile-hero.png`, clip: { x: 0, y: 0, width: 390, height: 150 } });

  await browser.close();
})();
