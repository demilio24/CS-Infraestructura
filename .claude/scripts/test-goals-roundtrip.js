// Verify the dashboard's goal-edit round-trips through getpantry.cloud and
// that a second "device" (a fresh browser context, separate localStorage)
// sees the goal that was set on device A.
const puppeteer = require('puppeteer');
const PANTRY = 'https://getpantry.cloud/apiv1/pantry/758bb1b9-1318-4ff6-896b-34102045bf16/basket/systema-floyd-goals';

(async () => {
  const url = 'http://localhost:8765/Tom_Systema_Floyd/dashboard/index.html';
  const browser = await puppeteer.launch({ headless: 'new' });

  // Reset basket before the test runs
  await fetch(PANTRY, {
    method: 'POST',
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

  // Read pantry directly to confirm write
  const blobRes = await fetch(PANTRY + '?_=' + Date.now());
  const blob = await blobRes.json();
  console.log('Pantry after device A wrote 95:', JSON.stringify(blob));

  // Device B: fresh context (separate localStorage) — should pick up 95 from pantry
  const ctxB = browser.createBrowserContext
    ? await browser.createBrowserContext()
    : (browser.createIncognitoBrowserContext ? await browser.createIncognitoBrowserContext() : null);
  const b = ctxB ? await ctxB.newPage() : await browser.newPage();
  b.on('console', m => console.log('[B]', m.type(), m.text()));
  b.on('pageerror', e => console.log('[B err]', e.message));
  await b.setViewport({ width: 1440, height: 900 });
  await b.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // let goals fetch + render

  const seenByB = await b.evaluate(() => {
    const input = document.querySelector('.kpi[data-kpi="total"] [data-goal]');
    return input.value;
  });
  console.log('Device B sees goal value:', seenByB);

  // Independently confirm via pantry that the write actually happened
  const sawGoal = blob.goals && blob.goals['combined.total'] === 95;
  if (seenByB === '95' && sawGoal) console.log('✅ PASS: cross-device goal sync works');
  else console.log('❌ FAIL — pantry has goal:', sawGoal, '· device B input:', seenByB);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });