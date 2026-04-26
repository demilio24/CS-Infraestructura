const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    document.querySelectorAll('.fu').forEach(el => { el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; });
  });
  await new Promise(r => setTimeout(r, 2000));

  const m = await page.evaluate(() => {
    const r = el => el ? el.getBoundingClientRect() : null;
    const ed = document.querySelector('section.editorial');
    const wrap = document.querySelector('section.editorial .wrap');
    const img = document.querySelector('section.editorial img.img');
    const txt = document.querySelector('section.editorial .wrap > div');
    const cs = el => getComputedStyle(el);
    return {
      editorial: { top: r(ed).top + window.scrollY, bottom: r(ed).bottom + window.scrollY, height: r(ed).height, padTop: parseInt(cs(ed).paddingTop), padBot: parseInt(cs(ed).paddingBottom) },
      wrap: { top: r(wrap).top + window.scrollY, bottom: r(wrap).bottom + window.scrollY, height: r(wrap).height },
      img: { top: r(img).top + window.scrollY, bottom: r(img).bottom + window.scrollY, height: r(img).height, naturalW: img.naturalWidth, naturalH: img.naturalHeight, marTop: parseInt(cs(img).marginTop), marBot: parseInt(cs(img).marginBottom), alignSelf: cs(img).alignSelf, objectFit: cs(img).objectFit },
      text: { top: r(txt).top + window.scrollY, bottom: r(txt).bottom + window.scrollY, height: r(txt).height },
    };
  });

  console.log(JSON.stringify(m, null, 2));
  console.log('\n---');
  console.log('Image top vs editorial top:', m.img.top - m.editorial.top, '(want ≈0 for full bleed top)');
  console.log('Image bottom vs editorial bottom:', m.img.bottom - m.editorial.bottom, '(want ≈0 for full bleed bottom)');
  console.log('Image height:', m.img.height);
  console.log('Editorial section height:', m.editorial.height);
  console.log('Text column height:', m.text.height);

  await page.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'editorial-detail.png'), clip: { x: 0, y: m.editorial.top - 40, width: 1440, height: m.editorial.height + 80 } });
  await browser.close();
})();
