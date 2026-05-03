const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.addStyleTag({ content: `.fu,.velus-v{opacity:1!important;transform:none!important;transition:none!important}#entry{display:none!important}` });
  await new Promise(r => setTimeout(r, 300));

  const data = await page.evaluate(() => {
    const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }; })() : null;
    const el = (s) => document.querySelector(s);
    return {
      finalcta: rect(el('section.finalcta')),
      ctaWrap: rect(el('section.finalcta .cta-wrap')),
      cta: rect(el('section.finalcta .cta')),
      finalctaParent: rect(el('section.finalcta').parentElement),
      pageHome: rect(el('#page-home')),
      main: rect(el('main')),
      footer: rect(el('footer')),
      allAfterFinalcta: (() => {
        const fc = el('section.finalcta');
        let node = fc.nextElementSibling;
        const arr = [];
        while (node && node !== el('footer')) {
          const r = node.getBoundingClientRect();
          arr.push({ tag: node.tagName, id: node.id, className: node.className, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), display: getComputedStyle(node).display });
          node = node.nextElementSibling;
        }
        return arr;
      })()
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
