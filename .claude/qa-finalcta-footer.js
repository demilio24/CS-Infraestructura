const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1800 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    document.querySelector('section.finalcta').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -80);
  });
  await new Promise(r => setTimeout(r, 500));

  const cs = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { text: el.textContent.trim().slice(0, 40), fontSize: s.fontSize, fontFamily: s.fontFamily.split(',')[0], lineHeight: s.lineHeight };
    };
    return {
      eyebrow: read('section.finalcta .eyebrow'),
      h2: read('section.finalcta h2'),
      p: read('section.finalcta p'),
      cta: read('section.finalcta .cta'),
      city: read('footer .city'),
      link: read('footer .links a'),
      copyright: read('footer .copyright')
    };
  });
  console.log(JSON.stringify(cs, null, 2));

  await page.screenshot({ path: `${OUT}/finalcta-desktop.png`, fullPage: false });

  await page.setViewport({ width: 390, height: 1400 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    document.querySelector('section.finalcta').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}/finalcta-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
