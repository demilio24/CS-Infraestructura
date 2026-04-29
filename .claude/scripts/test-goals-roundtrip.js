// Verify the dashboard's goal-edit round-trips through jsonblob.com and
// that a second "device" (a fresh page load with localStorage cleared)
// sees the goal that was set elsewhere.
const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:8765/Tom_Systema_Floyd/dashboard/index.html';
  const browser = await puppeteer.launch({ headless: 'new' });

  // Reset blob to empty before the test runs
  await fetch('https://jsonblob.com/api/jsonBlob/019ddb54-4020-7681-a32c-90ace495a4ab', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goals: {} })
  });

  // Device A: set a goal
  const a = await browser.newPage();
  a.on('console', m => console.log('[A]', m.type(), m.text()));
  a.on('pageerror', e => console.log('[A error]', e.message));
  await a.setViewport({ width: 1440, height: 900 });
  await a.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  // Type into the "Registered Students" goal input
  await a.evaluate(() => {
    const input = document.querySelector('.kpi[data-kpi="total"] [data-goal]');
    input.value = '95';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // Wait for debounced write to fire
  await new Promise(r => setTimeout(r, 1200));

  // Read blob directly to confirm write
  const blobRes = await fetch('https://jsonblob.com/api/jsonBlob/019ddb54-4020-7681-a32c-90ace495a4ab?_=' + Date.now());
  const blob = await blobRes.json();
  console.log('Blob after device A wrote 95:', JSON.stringify(blob));

  // Device B: fresh context (no localStorage) — should pick up 95 from blob
  const ctxB = await browser.createIncognitoBrowserContext
    ? await browser.createIncognitoBrowserContext()
    : browser; // fallback if API gone
  const b = (ctxB === browser) ? await browser.newPage() : await ctxB.newPage();
  b.on('console', m => console.log('[B]', m.type(), m.text()));
  await b.setViewport({ width: 1440, height: 900 });
  await b.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500)); // let goals fetch

  const seenByB = await b.evaluate(() => {
    const input = document.querySelector('.kpi[data-kpi="total"] [data-goal]');
    return input.value;
  });
  console.log('Device B sees goal value:', seenByB);

  if (seenByB === '95') console.log('✅ PASS: cross-device goal sync works');
  else console.log('❌ FAIL: device B did not pick up the goal');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });