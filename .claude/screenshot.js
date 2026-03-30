const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///f:/GitHub/CS-Infraestructura/Nils/funnel/vsl.html', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
  await new Promise(r => setTimeout(r, 400));

  // Get section positions
  const positions = await page.evaluate(() => {
    const sels = ['.case-study-section', '.about', '.guarantee', '.proof-section'];
    return sels.map(s => {
      const el = document.querySelector(s);
      if (!el) return { sel: s, top: 0, height: 0 };
      const r = el.getBoundingClientRect();
      return { sel: s, top: r.top + window.scrollY, height: r.height };
    });
  });
  console.log('POSITIONS:', JSON.stringify(positions, null, 2));

  for (const pos of positions) {
    await page.evaluate((y) => window.scrollTo(0, y - 50), pos.top);
    await new Promise(r => setTimeout(r, 150));
    const name = pos.sel.replace('.', '').replace('-', '_') + '.png';
    await page.screenshot({ path: name });
    console.log('Saved:', name);
  }
  await browser.close();
})().catch(e => console.error(e));
