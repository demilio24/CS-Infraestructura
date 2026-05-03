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
    const ph = document.getElementById('page-home');
    const s = getComputedStyle(ph);
    const info = {
      marginTop: s.marginTop, marginBottom: s.marginBottom,
      paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
      minHeight: s.minHeight, height: s.height,
      boxSizing: s.boxSizing, display: s.display
    };
    const children = [];
    for (const c of ph.children) {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      children.push({ tag: c.tagName, class: c.className, top: Math.round(r.top), bottom: Math.round(r.bottom), marginTop: cs.marginTop, marginBottom: cs.marginBottom });
    }
    const lastChild = ph.lastChild;
    const lastChildType = lastChild ? (lastChild.nodeType === 3 ? 'TEXT' : lastChild.tagName) : null;
    const lastChildText = lastChild && lastChild.nodeType === 3 ? JSON.stringify(lastChild.textContent) : null;
    return { pageHomeStyle: info, children, lastChildType, lastChildText };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
