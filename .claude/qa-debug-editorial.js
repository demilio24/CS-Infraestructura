const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 1400, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const e = document.getElementById('entry'); if(e) e.style.display='none';
  });
  const info = await page.evaluate(() => {
    // Grab every element near doc-y where the duplicate appears (~400-700px in viewport)
    const editorial = document.querySelector('section.editorial');
    const docY = editorial.getBoundingClientRect().top + window.scrollY;
    const sections = Array.from(document.querySelectorAll('section, footer, header, main')).map(s => ({
      tag: s.tagName,
      cls: s.className || '',
      docY: Math.round(s.getBoundingClientRect().top + window.scrollY),
      h: Math.round(s.getBoundingClientRect().height),
      visible: getComputedStyle(s).display !== 'none' && getComputedStyle(s).visibility !== 'hidden'
    })).filter(s => s.visible && s.docY >= 0);
    return { editorialDocY: docY, sections };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
