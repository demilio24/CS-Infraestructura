const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.type(), m.text()));
  page.on('pageerror', e => console.log('[ERROR]', e.message));

  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });
  const url = 'http://localhost:8765/Tom_Systema_Floyd/dashboard/index.html';
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  // Set per-week goals on a few weeks to make the gray bars visible
  await page.evaluate(() => {
    const targets = {
      'June 1st-5th':       20,
      'June 8th-12th':      20,
      'June 15th-19th':     20,
      'June 22nd-26th':     12,
      'June 29th-July 3rd': 15,
      'July 6th-10th':      18,
      'July 13th-17th':     20,
      'July 20th-24th':     16,
      'July 27th-31st':     15,
      'August 3rd-7th':     14,
      'August 10th-14th':   12,
      'August 17th-21st':   12,
    };
    for (const [w, v] of Object.entries(targets)) {
      const inp = document.querySelector(`input[data-week="${w}"]`);
      if (inp) {
        inp.value = String(v);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // KPI goals too
    const total = document.querySelector('.kpi[data-kpi="total"] [data-goal]');
    total.value = '120'; total.dispatchEvent(new Event('input', { bubbles: true }));
    const upper = document.querySelector('.kpi[data-kpi="upper"] [data-goal]');
    upper.value = '40'; upper.dispatchEvent(new Event('input', { bubbles: true }));
    const lower = document.querySelector('.kpi[data-kpi="lower"] [data-goal]');
    lower.value = '90'; lower.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 700));

  const out = path.join(__dirname, '..', 'screenshots', 'dash-with-week-goals.png');
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved:', out);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
