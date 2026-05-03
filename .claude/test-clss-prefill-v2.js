/**
 * v2 — Tests prefill end-to-end from the parent page.
 * The direct GHL URL is gated by Cloudflare Turnstile in headless mode,
 * but the form renders fine inside the parent page's iframe (because
 * form_embed.js handshakes with the parent). So we click cards on the
 * parent page and read the multiselect state from the nested frame.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const PAGE_URL = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
const FORM_ORIGIN = 'link.nilsdigital.com';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const section = (t) => log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60));

const findFormFrame = (page) =>
  page.frames().find((f) => f.url().includes(FORM_ORIGIN));

const waitForFormReady = async (page, maxMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const frame = findFormFrame(page);
    if (frame) {
      try {
        const has = await frame.evaluate(() => {
          return !!(
            document.querySelector('.multiselect') ||
            document.querySelector('input[type="text"]')
          );
        });
        if (has) return frame;
      } catch (_) {
        // frame may have been detached — retry
      }
    }
    await wait(750);
  }
  return null;
};

const readFormState = (frame) =>
  frame.evaluate(() => {
    const single = document.querySelector('.multiselect__single')?.textContent?.trim() || null;
    const placeholder =
      document.querySelector('.multiselect__placeholder')?.textContent?.trim() || null;
    const tags = Array.from(document.querySelectorAll('.multiselect__tag')).map((t) =>
      t.textContent.trim()
    );
    // The swim-school field is rendered as a plain text input — read its value too.
    const swimInput = document.querySelector('input[name="QSBsbV7VASUQn8SyoXYY"]');
    const swimInputValue = swimInput ? swimInput.value : null;
    // Also read every input value for overview
    const allInputs = Array.from(document.querySelectorAll('input')).map((i) => ({
      name: i.getAttribute('name'),
      value: i.value,
    }));
    const turnstileLabel =
      document.body.textContent.includes('Verify you are human') ||
      document.body.textContent.includes('Performing security verification');
    return { single, placeholder, tags, swimInputValue, allInputs, blockedByCloudflare: turnstileLabel };
  });

const inspectAllFields = (frame) =>
  frame.evaluate(() => {
    const findLabel = (el) => {
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) return lbl.textContent.trim();
      }
      let p = el.parentElement;
      for (let i = 0; i < 6 && p; i++) {
        const lbl = p.querySelector('label, .form-label');
        if (lbl) return lbl.textContent.trim();
        p = p.parentElement;
      }
      return null;
    };
    return Array.from(document.querySelectorAll('input, select, textarea')).map((el) => ({
      tag: el.tagName,
      type: el.type,
      name: el.getAttribute('name'),
      id: el.id,
      value: el.value,
      label: findLabel(el),
    }));
  });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  section('Loading parent page');
  await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  log('Parent loaded.');

  // Wait for the form iframe inside the parent to fully render
  log('Waiting for GHL form iframe to render…');
  let frame = await waitForFormReady(page, 30000);
  if (!frame) {
    log('✗ Form did not render inside parent within 30s.');
    const initialState = await readFormState(findFormFrame(page) || page.mainFrame()).catch(() => null);
    log('Last-known state:', JSON.stringify(initialState));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'clss-prefill-noframe.png'),
      fullPage: false,
    });
    await browser.close();
    process.exit(1);
  }
  log('✓ Form iframe rendered.');

  section('Baseline: form fields before any prefill');
  const baseline = await readFormState(frame);
  log('  state:', JSON.stringify(baseline));
  const fields = await inspectAllFields(frame);
  log(`  ${fields.length} form fields found:`);
  fields.forEach((f, i) => {
    log(
      `    [${i}] <${f.tag.toLowerCase()} type=${f.type}> name="${f.name}" id="${f.id}" label="${f.label}"`
    );
  });

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'clss-prefill-baseline.png'),
    fullPage: false,
  });

  // Now click each location card and check whether the multiselect updates
  const tests = [
    { sel: '[data-location="Edgewater"] .loc-card-img', expected: 'Edgewater' },
    { sel: '[data-location="Calvert"] .loc-card-img', expected: 'Calvert' },
    { sel: '[data-location="Flat Iron"] .loc-card-img', expected: 'Flat Iron' },
    { sel: '[data-location="Severna Park"] .loc-card-img', expected: 'Severna Park' },
    { sel: '[data-prefill-location="Severna Park"]', expected: 'Severna Park' },
  ];

  const results = [];
  for (const { sel, expected } of tests) {
    section(`Click test: ${sel}  →  expects "${expected}"`);
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, sel);
    await wait(500);
    await page.click(sel);

    // After clicking, our handler updates iframe.src — that triggers a reload.
    // Wait for the new frame to be ready.
    await wait(1500); // initial settle
    frame = await waitForFormReady(page, 25000);
    if (!frame) {
      log('  ✗ form did not re-render after click');
      results.push({ expected, got: null, ok: false });
      continue;
    }
    // Give the multiselect a beat to apply the URL param
    await wait(2500);
    const state = await readFormState(frame);
    const iframeSrc = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
    log('  iframe.src:', iframeSrc);
    log('  multiselect state:', JSON.stringify(state));
    const ok =
      state.single === expected ||
      state.tags.includes(expected) ||
      state.swimInputValue === expected ||
      (state.single && state.single.toLowerCase() === expected.toLowerCase()) ||
      (state.swimInputValue && state.swimInputValue.toLowerCase() === expected.toLowerCase());
    log(ok ? `  ✓ Pre-fill works: field has "${expected}"` : `  ✗ Field did not pre-fill (single="${state.single || ''}" inputValue="${state.swimInputValue || ''}")`);
    results.push({ expected, got: state.swimInputValue || state.single || state.tags.join(','), ok });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `clss-prefill-after-${expected.replace(/\s+/g, '-')}.png`),
      fullPage: false,
    });
  }

  section('SUMMARY');
  results.forEach((r) => {
    log(`  ${r.ok ? '✓' : '✗'}  expected="${r.expected}"  got="${r.got}"`);
  });

  const allPassed = results.every((r) => r.ok);
  if (allPassed) {
    log('\n✓ All location pre-fills work with FIELD_KEY="swim_school".');
  } else {
    log('\n✗ FIELD_KEY="swim_school" is not the correct GHL field key.');
    log('  → Check GHL form builder: click the "Which swim school" dropdown,');
    log('    look for "Custom Field Key" / "Query parameter" — copy that exact slug,');
    log('    and set it as FIELD_KEY in home.html line ~2983.');
  }

  await browser.close();
})().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
