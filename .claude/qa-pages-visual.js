const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';
const pages = ['home','collections','about','services','contact'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.addStyleTag({ content: `#entry{display:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  for (const p of pages) {
    await page.evaluate((n) => { if (typeof showPage === 'function') showPage(n); }, p);
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: `${OUT}/page-${p}-full.png`, fullPage: true });
    console.log(`${p}: total height ${fullH}px`);
  }

  await browser.close();
})();
