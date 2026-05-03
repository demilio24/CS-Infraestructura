const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = 'F:/GitHub/Websites/.claude/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => { const e = document.getElementById('entry'); if (e) { e.classList.add('out'); e.style.display = 'none'; } });
  await new Promise(r => setTimeout(r, 2000));

  const data = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('section.statement .body p')];
    return ps.map((p, i) => ({
      idx: i,
      text: p.textContent.substring(0, 40),
      classes: p.className,
      opacity: getComputedStyle(p).opacity,
      height: p.getBoundingClientRect().height,
      visibility: getComputedStyle(p).visibility,
      hasIn: p.classList.contains('in')
    }));
  });
  console.log(JSON.stringify(data, null, 2));

  await page.evaluate(() => {
    const cta = document.querySelector('section.statement .cta-wrap');
    cta.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${OUT}/4thpara-check.png`, fullPage: false });

  await browser.close();
})();
