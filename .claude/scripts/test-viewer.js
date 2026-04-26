// End-to-end tests for the image viewer:
// 1. Counter alignment (mobile inline with arrows, desktop centered)
// 2. × close button aligned with .meta headline
// 3. × close is instant (no opacity fade animates)
// 4. Swipe works on desktop (mouse drag) and mobile (touch)
const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

let pass = 0, fail = 0;
function check(name, ok, info) {
  const icon = ok ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}` + (info ? ` — ${info}` : ''));
  if (ok) pass++; else fail++;
}

async function setup(browser, w, h) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-collections').classList.add('active');
    document.querySelectorAll('.fu').forEach(el => { el.classList.add('in'); el.style.opacity='1'; el.style.transform='none'; });
    if (typeof window.buildColl === 'function') window.buildColl();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { window.openViewer(0); });
  await new Promise(r => setTimeout(r, 1000));
  return page;
}

async function rect(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, cx: r.left + r.width/2, cy: r.top + r.height/2 };
  }, sel);
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  // ---------- DESKTOP ----------
  console.log('\n=== DESKTOP (1440 × 900) ===');
  let page = await setup(browser, 1440, 900);

  const dCounter = await rect(page, '#viewer .counter');
  const dArrowL  = await rect(page, '#viewer .arrow.prev');
  const dArrowR  = await rect(page, '#viewer .arrow.next');
  const dClose   = await rect(page, '#viewer .close');
  const dMeta    = await rect(page, '#viewer .meta .n');
  const dViewer  = await rect(page, '#viewer');

  // 1. Counter centered horizontally on desktop
  const dCounterCenterDelta = Math.abs(dCounter.cx - dViewer.width/2);
  check('Desktop counter horizontally centered', dCounterCenterDelta < 2, `cx=${dCounter.cx.toFixed(1)} viewport center=${(dViewer.width/2).toFixed(1)} delta=${dCounterCenterDelta.toFixed(1)}`);

  // 2. Close button vertically centered on headline text middle (line-box center)
  const dMetaCY = dMeta.top + dMeta.height / 2;
  const dCloseCenterDelta = Math.abs(dClose.cy - dMetaCY);
  check('Desktop × center-aligned with headline middle', dCloseCenterDelta < 4, `× cy=${dClose.cy.toFixed(1)} headline cy=${dMetaCY.toFixed(1)} delta=${dCloseCenterDelta.toFixed(1)}`);

  // Verify counter is at H2 font size (≈31px desktop)
  const dCounterFont = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#viewer .counter')).fontSize));
  const dH2Font = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-h2')));
  check('Desktop counter uses --fs-h2 size', Math.abs(dCounterFont - dH2Font) < 1, `counter=${dCounterFont}px h2=${dH2Font}px`);

  // 3. Counter is BELOW the image area (bottom region)
  check('Desktop counter is in bottom region (below image)', dCounter.top > dViewer.height * 0.85, `counter top=${dCounter.top.toFixed(1)} viewport=${dViewer.height}`);

  // 4. Test desktop mouse-drag swipe to next image
  const beforeIdx = await page.evaluate(() => document.getElementById('vCount').textContent);
  // Drag from center-left to far-left (drag left = next image)
  await page.mouse.move(800, 400);
  await page.mouse.down();
  await page.mouse.move(700, 400, { steps: 5 });
  await page.mouse.move(600, 400, { steps: 5 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 800));
  const afterIdx = await page.evaluate(() => document.getElementById('vCount').textContent);
  check('Desktop mouse-drag advances to next image', beforeIdx !== afterIdx, `before="${beforeIdx}" after="${afterIdx}"`);

  // 5. × close is instant (transition style applied at close time)
  await page.evaluate(() => { window.closeViewer(); });
  // Right after closeViewer, the opacity should already be 0 (no fade pending)
  await new Promise(r => setTimeout(r, 50));
  const dCloseState = await page.evaluate(() => {
    const v = document.getElementById('viewer');
    return { hasOn: v.classList.contains('on'), opacity: getComputedStyle(v).opacity, display: getComputedStyle(v).display };
  });
  check('Desktop × close is instant (no .on class, opacity 0 immediately)', !dCloseState.hasOn && parseFloat(dCloseState.opacity) === 0, JSON.stringify(dCloseState));

  await page.close();

  // ---------- MOBILE ----------
  console.log('\n=== MOBILE (390 × 844) ===');
  page = await setup(browser, 390, 844);

  const mCounter = await rect(page, '#viewer .counter');
  const mArrowL  = await rect(page, '#viewer .arrow.prev');
  const mArrowR  = await rect(page, '#viewer .arrow.next');
  const mClose   = await rect(page, '#viewer .close');
  const mMeta    = await rect(page, '#viewer .meta .n');
  const mViewer  = await rect(page, '#viewer');

  // 1. Counter on the same horizontal line as arrows (vertical centers ≈ equal)
  const mLineDelta = Math.max(Math.abs(mCounter.cy - mArrowL.cy), Math.abs(mCounter.cy - mArrowR.cy));
  check('Mobile counter inline with arrows', mLineDelta < 6, `counter cy=${mCounter.cy.toFixed(1)} arrowL cy=${mArrowL.cy.toFixed(1)} arrowR cy=${mArrowR.cy.toFixed(1)}`);

  // 2. Counter centered horizontally
  const mCenterDelta = Math.abs(mCounter.cx - mViewer.width/2);
  check('Mobile counter horizontally centered between arrows', mCenterDelta < 2, `delta=${mCenterDelta.toFixed(1)}`);

  // 3. × center-aligned with headline middle
  const mMetaCY = mMeta.top + mMeta.height / 2;
  const mCloseCenterDelta = Math.abs(mClose.cy - mMetaCY);
  check('Mobile × center-aligned with headline middle', mCloseCenterDelta < 4, `× cy=${mClose.cy.toFixed(1)} headline cy=${mMetaCY.toFixed(1)} delta=${mCloseCenterDelta.toFixed(1)}`);

  // 4. Touch swipe advances next image
  const mBefore = await page.evaluate(() => document.getElementById('vCount').textContent);
  // Simulate touch swipe (swipe left = next)
  await page.evaluate(() => {
    const v = document.getElementById('viewer');
    function fireTouch(type, x, y) {
      const t = new Touch({ identifier: 0, target: v, clientX: x, clientY: y });
      const evt = new TouchEvent(type, { cancelable: true, bubbles: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] });
      v.dispatchEvent(evt);
    }
    fireTouch('touchstart', 300, 400);
    fireTouch('touchend', 100, 400);
  });
  await new Promise(r => setTimeout(r, 800));
  const mAfter = await page.evaluate(() => document.getElementById('vCount').textContent);
  check('Mobile touch swipe advances to next image', mBefore !== mAfter, `before="${mBefore}" after="${mAfter}"`);

  await page.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
