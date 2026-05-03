const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  // Disable animations/transitions and force visible
  await page.addStyleTag({ content: `
    .fu, .velus-v { opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; }
    #entry { display: none !important; }
  ` });
  await new Promise(r => setTimeout(r, 300));

  async function snap(selector, label) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, selector);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${OUT}/tr-${label}.png` });
  }

  await snap('section.statement .cta-wrap', '1-discover');
  await snap('section.work-section .section-foot', '2-view-collections');
  await snap('.testimonies-head', '3-editorial-testimonies');
  await snap('section.finalcta .eyebrow', '4-finalcta');
  await page.evaluate(() => document.querySelector('footer').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.evaluate(() => window.scrollBy(0, -300));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/tr-5-footer.png` });

  await browser.close();
  console.log('done');
})();
