const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.type(), m.text()));
  page.on('pageerror', e => console.log('[ERROR]', e.message));

  const url = 'http://localhost:8765/Tom_Systema_Floyd/dashboard/index.html';
  const tasks = [
    { name: 'desktop-all',    w: 1440, h: 900, filter: null },
    { name: 'desktop-summer', w: 1440, h: 900, filter: 'summer' },
    { name: 'desktop-free',   w: 1440, h: 900, filter: 'free' },
    { name: 'mobile-all',     w: 390,  h: 844, filter: null },
  ];

  for (const t of tasks) {
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 800)); // animations

    if (t.filter) {
      await page.evaluate((f) => {
        const btn = document.querySelector(`.filter button[data-filter="${f}"]`);
        if (btn) btn.click();
      }, t.filter);
      await new Promise(r => setTimeout(r, 700));
    }

    const out = path.join(__dirname, '..', 'screenshots', `dash-${t.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('saved:', out);
  }

  // Try goal-input persistence
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const input = document.querySelector('.kpi[data-kpi="total"] [data-goal]');
    input.value = '120';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));
  const goalSaved = await page.evaluate(() => localStorage.getItem('sf-dash-goals'));
  console.log('saved goals:', goalSaved);
  const out2 = path.join(__dirname, '..', 'screenshots', 'dash-with-goal.png');
  await page.screenshot({ path: out2, fullPage: true });
  console.log('saved:', out2);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });