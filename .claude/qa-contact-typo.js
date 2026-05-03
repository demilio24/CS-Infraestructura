const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html#contact';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 1800 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    if (typeof showPage === 'function') showPage('contact');
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 600));

  const cs = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { text: el.textContent.trim().slice(0, 40), fontSize: s.fontSize, lineHeight: s.lineHeight, color: s.color, letterSpacing: s.letterSpacing, fontFamily: s.fontFamily.split(',')[0] };
    };
    const input = document.querySelector('.inq-field input');
    const inputStyle = input ? getComputedStyle(input) : null;
    return {
      h1: read('.c-open h1'),
      lede: read('.c-open .lede'),
      label: read('.inq-label'),
      input: input ? { fontSize: inputStyle.fontSize, color: inputStyle.color, fontFamily: inputStyle.fontFamily.split(',')[0] } : null,
      submit: read('.submit-btn'),
      city: read('footer .city'),
      copyright: read('footer .copyright')
    };
  });
  console.log(JSON.stringify(cs, null, 2));

  await page.screenshot({ path: `${OUT}/contact-mobile.png`, fullPage: false });

  await browser.close();
  console.log('done');
})();
