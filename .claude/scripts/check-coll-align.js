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
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-collections').classList.add('active');
    document.querySelectorAll('.fu').forEach(el => { el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; });
    if (typeof window.buildColl === 'function') window.buildColl();
    // Force ttl visible to measure
    document.querySelectorAll('.coll-item .ttl').forEach(el => { el.style.opacity='1'; el.style.transform='translateY(0)'; });
  });
  await new Promise(r => setTimeout(r, 1500));

  const m = await page.evaluate(() => {
    const item = document.querySelector('.coll-item');
    const ttl = item.querySelector('.ttl');
    const name = item.querySelector('.ttl .name');
    const loc = item.querySelector('.ttl .loc');
    const num = item.querySelector('.coll-num');
    const r = el => el.getBoundingClientRect();
    return {
      item: { bottom: Math.round(r(item).bottom + window.scrollY) },
      ttl: { top: Math.round(r(ttl).top + window.scrollY), bottom: Math.round(r(ttl).bottom + window.scrollY), height: Math.round(r(ttl).height) },
      name: { top: Math.round(r(name).top + window.scrollY), bottom: Math.round(r(name).bottom + window.scrollY) },
      loc: { top: Math.round(r(loc).top + window.scrollY), bottom: Math.round(r(loc).bottom + window.scrollY) },
      num: { top: Math.round(r(num).top + window.scrollY), bottom: Math.round(r(num).bottom + window.scrollY), height: Math.round(r(num).height) },
    };
  });

  console.log(JSON.stringify(m, null, 2));
  console.log('\n--- Alignment check ---');
  console.log('ttl box bottom:', m.ttl.bottom, '| num box bottom:', m.num.bottom, '→ delta:', m.num.bottom - m.ttl.bottom);
  console.log('ttl box top:   ', m.ttl.top,    '| num box top:   ', m.num.top,    '→ delta:', m.num.top - m.ttl.top);
  console.log('Title (name) baseline-ish bottom:', m.name.bottom, '| Number baseline-ish bottom:', m.num.bottom, '→ delta:', m.num.bottom - m.name.bottom);
  console.log('Loc bottom:', m.loc.bottom, '| Number bottom:', m.num.bottom, '→ delta:', m.num.bottom - m.loc.bottom);

  await browser.close();
})();
