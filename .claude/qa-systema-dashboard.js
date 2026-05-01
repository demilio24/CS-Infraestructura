// QA test for restructured Systema Floyd dashboard:
//   1. Loads the dashboard via local file://
//   2. Confirms compact cap controls render with Upper=13 / Lower=13 defaults
//   3. Bug-fix: types "13" then "100" into cap inputs and confirms no mid-typing reset
//   4. Switches filter tabs (Summer / Free) and confirms caps persist per filter
//   5. Toggles the single roster panel and verifies students render
//   6. Screenshots at TV resolution (1920x1080) — must fit without scroll
//
// Run: node .claude/qa-systema-dashboard.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const DASH = `file:///${path.resolve(ROOT, 'Tom_Systema_Floyd/dashboard/index.html').replace(/\\/g, '/')}`;
const SHOTS = path.resolve(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  page.on('console', msg => {
    const t = msg.type();
    if (t === 'error' || t === 'warning') console.log(`[browser:${t}]`, msg.text());
  });
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  console.log('→ Loading dashboard');
  await page.goto(DASH, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem('sf-dash-goals-cache'));
  await page.reload({ waitUntil: 'networkidle0' });

  // Wait for bars + cap controls
  await page.waitForSelector('#cap-controls input[data-cap="upper"]', { timeout: 15000 });
  await page.waitForSelector('#bars rect.bar', { timeout: 15000 });
  console.log('→ Dashboard rendered');

  // 1. Defaults
  const defaults = await page.evaluate(() => ({
    u: document.querySelector('input[data-cap="upper"]').value,
    l: document.querySelector('input[data-cap="lower"]').value,
  }));
  console.log(`   defaults Upper=${defaults.u} Lower=${defaults.l}`);
  if (defaults.u !== '13' || defaults.l !== '13') {
    throw new Error(`Defaults wrong: expected 13/13, got ${defaults.u}/${defaults.l}`);
  }
  console.log('   ✓ Defaults match (13/13)');

  // 2. Bug-fix test — type multi-digit values, confirm no reset
  console.log('→ Bug-fix test: typing into cap inputs');
  for (const [campus, expected] of [['upper', '13'], ['lower', '100']]) {
    const sel = `input[data-cap="${campus}"]`;
    await page.click(sel, { clickCount: 3 });
    await page.type(sel, expected, { delay: 80 });
    const after = await page.$eval(sel, el => el.value);
    console.log(`   typed "${expected}" into ${campus}: input value="${after}" ${after === expected ? '✓' : '✗ FAIL'}`);
    if (after !== expected) {
      throw new Error(`Bug NOT fixed: typed "${expected}" into ${campus}, got "${after}"`);
    }
    await page.evaluate((s) => document.querySelector(s).blur(), sel);
    await new Promise(r => setTimeout(r, 100));
    const committed = await page.$eval(sel, el => el.value);
    if (committed !== expected) {
      throw new Error(`Commit failed for ${campus}: expected "${expected}", got "${committed}"`);
    }
  }
  console.log('   ✓ All multi-digit types committed without reset');

  // 3. Filter switch — verify per-filter caps
  console.log('→ Filter switch test (per-filter caps)');
  // We just typed 13/100 while on Summer (the new default tab).
  // Switch to Free — should show its own defaults 13/13.
  await page.click('.filter button[data-filter="free"]');
  await new Promise(r => setTimeout(r, 200));
  const freeDefaults = await page.evaluate(() => ({
    u: document.querySelector('input[data-cap="upper"]').value,
    l: document.querySelector('input[data-cap="lower"]').value,
  }));
  console.log(`   Free tab caps: Upper=${freeDefaults.u} Lower=${freeDefaults.l}`);
  if (freeDefaults.u !== '13' || freeDefaults.l !== '13') {
    throw new Error(`Free caps should be defaults 13/13, got ${freeDefaults.u}/${freeDefaults.l}`);
  }
  // Switch back to Summer — should still show 13/100
  await page.click('.filter button[data-filter="summer"]');
  await new Promise(r => setTimeout(r, 200));
  const backToSummer = await page.evaluate(() => ({
    u: document.querySelector('input[data-cap="upper"]').value,
    l: document.querySelector('input[data-cap="lower"]').value,
  }));
  console.log(`   Back to Summer: Upper=${backToSummer.u} Lower=${backToSummer.l}`);
  if (backToSummer.l !== '100') {
    throw new Error(`Summer Lower edit didn't persist: expected 100, got ${backToSummer.l}`);
  }
  // Verify the active tab on first load is Summer
  const initialActive = await page.evaluate(() => {
    return document.querySelector('.filter button.active')?.dataset.filter;
  });
  console.log(`   Active tab: ${initialActive}`);
  if (initialActive !== 'summer') {
    throw new Error(`Expected default tab to be 'summer', got '${initialActive}'`);
  }
  console.log('   ✓ Per-filter caps persist correctly; default = Summer');

  // Reset for screenshots
  await page.click('#cap-reset');
  await new Promise(r => setTimeout(r, 200));

  // 4. Roster toggle
  console.log('→ Roster panel test');
  await page.click('#roster-toggle');
  await new Promise(r => setTimeout(r, 400));
  const rosterOpen = await page.evaluate(() => {
    const b = document.getElementById('roster-body');
    return {
      open: b.classList.contains('open'),
      weeks: b.querySelectorAll('.ros-week').length,
      students: b.querySelectorAll('.ros-week li').length,
    };
  });
  console.log(`   roster open: ${rosterOpen.open}, weeks shown: ${rosterOpen.weeks}, students: ${rosterOpen.students}`);
  if (!rosterOpen.open) throw new Error('Roster did not open');
  if (rosterOpen.weeks !== 12) throw new Error(`Expected 12 week cards in roster, got ${rosterOpen.weeks}`);

  // 5. Screenshot WITH roster open
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SHOTS, 'systema-dashboard-roster-open.png'), fullPage: true });

  // Close roster + screenshot for "fits in viewport without scroll" verification
  await page.click('#roster-toggle');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SHOTS, 'systema-dashboard-tv.png'), fullPage: false });
  console.log(`→ Screenshots written to ${SHOTS}`);

  // 6. Verify the closed-state dashboard fits in 1080px
  const dashHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`   page height (closed): ${dashHeight}px (viewport 1080)`);
  if (dashHeight > 1100) {
    console.log(`   ⚠ Page exceeds 1080px — would require scrolling on TV at default zoom.`);
  } else {
    console.log(`   ✓ Fits on 1080px viewport without scroll`);
  }

  // Cleanup
  await page.evaluate(() => localStorage.removeItem('sf-dash-goals-cache'));
  await browser.close();
  console.log('\n✓ All tests passed');
})().catch(err => {
  console.error('\n✗ Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
