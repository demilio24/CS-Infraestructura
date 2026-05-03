/**
 * Diagnoses GHL form prefill for the swim-school dropdown.
 *
 * Phase A: confirms the parent page's click handler rewrites the iframe src
 *          (already known good from prior run, but worth re-checking)
 * Phase B: navigates DIRECTLY to the GHL form URL (no nested-frame access
 *          needed) and probes which query-param key actually pre-fills the
 *          "Which swim school" dropdown.
 *
 * Output tells us exactly what FIELD_KEY to set in home.html.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const PAGE_URL = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
const FORM_URL = 'https://link.nilsdigital.com/widget/form/giAMs7ax6rJPENTGe40M';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) => console.log(...args);
const section = (t) => log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60));

const inspectForm = async (page) => {
  return page.evaluate(() => {
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
    const fields = Array.from(document.querySelectorAll('input, select, textarea')).map((el) => ({
      tag: el.tagName,
      type: el.type,
      name: el.getAttribute('name') || null,
      id: el.id || null,
      placeholder: el.placeholder || null,
      value: el.value || null,
      label: findLabel(el),
    }));
    const multiselects = Array.from(document.querySelectorAll('.multiselect')).map((el) => {
      let p = el.parentElement;
      let labelInDom = null;
      for (let i = 0; i < 6 && p; i++) {
        const lbl = p.querySelector('label, .form-label, [class*="label"]');
        if (lbl) {
          labelInDom = lbl.textContent.trim();
          break;
        }
        p = p.parentElement;
      }
      // Look for hidden inputs inside the multiselect that GHL uses to back the value
      const innerInputs = Array.from(el.querySelectorAll('input')).map((inp) => ({
        type: inp.type,
        name: inp.getAttribute('name'),
        id: inp.id,
        value: inp.value,
      }));
      return {
        labelInDom,
        attrs: Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value])),
        innerInputs,
      };
    });
    const single = document.querySelector('.multiselect__single')?.textContent?.trim() || null;
    const placeholder =
      document.querySelector('.multiselect__placeholder')?.textContent?.trim() || null;
    const tags = Array.from(document.querySelectorAll('.multiselect__tag')).map((t) =>
      t.textContent.trim()
    );
    return { fields, multiselects, single, placeholder, tags };
  });
};

const probeKey = async (page, key, value) => {
  const url = `${FORM_URL}?${key}=${encodeURIComponent(value)}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
  await wait(2500);
  const state = await page.evaluate(() => {
    const single = document.querySelector('.multiselect__single')?.textContent?.trim() || null;
    const placeholder =
      document.querySelector('.multiselect__placeholder')?.textContent?.trim() || null;
    const tags = Array.from(document.querySelectorAll('.multiselect__tag')).map((t) =>
      t.textContent.trim()
    );
    return { single, placeholder, tags };
  });
  return { url, state };
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  // ---- Phase A: parent-page click test
  section('Phase A — Card click rewrites iframe src');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2500);

  const initialSrc = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
  log('Initial src:', initialSrc);

  // Click each location card and verify src updates
  const locations = ['Edgewater', 'Calvert', 'Flat Iron', 'Severna Park'];
  for (const loc of locations) {
    await page.evaluate((l) => {
      document.querySelector(`[data-location="${l}"]`).scrollIntoView({ block: 'center' });
    }, loc);
    await wait(400);
    await page.click(`[data-location="${loc}"] .loc-card-img`);
    await wait(900);
    const src = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
    const expected = encodeURIComponent(loc);
    const ok = src.includes(`swim_school=${expected}`);
    log(`  ${loc.padEnd(14)} → ${ok ? '✓' : '✗'}  src ends with ?swim_school=${expected}`);
  }

  // Test the Severna Park button explicitly
  await page.evaluate(() => {
    document
      .querySelector('[data-prefill-location="Severna Park"]')
      .scrollIntoView({ block: 'center' });
  });
  await wait(400);
  await page.click('[data-prefill-location="Severna Park"]');
  await wait(900);
  const buttonSrc = await page.$eval('#inline-giAMs7ax6rJPENTGe40M', (el) => el.src);
  log(
    `  ${'SP button'.padEnd(14)} → ${
      buttonSrc.includes('swim_school=Severna%20Park') ? '✓' : '✗'
    }  src=${buttonSrc}`
  );

  await page.close();

  // ---- Phase B: probe form URL directly to find the real field key
  section('Phase B — Inspect form fields & probe candidate keys');
  const probe = await browser.newPage();
  await probe.setViewport({ width: 900, height: 1000 });

  // First load with no params to discover field names
  await probe.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 25000 });
  await wait(3000);
  const baseInspection = await inspectForm(probe);
  log(`\nFound ${baseInspection.fields.length} fields, ${baseInspection.multiselects.length} multiselect(s)`);
  log('\nAll input/select fields:');
  baseInspection.fields.forEach((f, i) => {
    log(
      `  [${i}] <${f.tag.toLowerCase()} type=${f.type}> name="${f.name}" id="${f.id}" placeholder="${f.placeholder}" label="${f.label}"`
    );
  });
  log('\nMultiselect roots:');
  baseInspection.multiselects.forEach((m, i) => {
    log(`  [${i}] labelInDom="${m.labelInDom}"`);
    log(`        attrs=${JSON.stringify(m.attrs)}`);
    log(`        innerInputs=${JSON.stringify(m.innerInputs)}`);
  });
  log(`\nMultiselect display: single="${baseInspection.single}" placeholder="${baseInspection.placeholder}" tags=${JSON.stringify(baseInspection.tags)}`);

  // Screenshot the form for visual reference
  await probe.screenshot({
    path: path.join(SCREENSHOT_DIR, 'clss-form-base.png'),
    fullPage: true,
  });
  log('Saved: clss-form-base.png');

  // Now probe candidate keys
  section('Phase B (cont.) — Probe candidate query-param keys');
  const candidates = [
    'swim_school',
    'school',
    'interest',
    'location',
    'which_swim_school',
    'whichSwimSchool',
    'swimSchool',
    'swim-school',
    'which_swim_school_are_you_interested_in',
    'swim_school_interest',
  ];
  const hits = [];
  for (const key of candidates) {
    try {
      const { url, state } = await probeKey(probe, key, 'Edgewater');
      const hit =
        state.single === 'Edgewater' ||
        state.tags.includes('Edgewater') ||
        (state.single && state.single.toLowerCase().includes('edgewater'));
      log(
        `  ?${key.padEnd(40)} → single="${state.single}" tags=${JSON.stringify(state.tags)}  ${
          hit ? '✓ HIT' : ''
        }`
      );
      if (hit) hits.push(key);
    } catch (e) {
      log(`  ?${key.padEnd(40)} → ERROR: ${e.message}`);
    }
  }

  section('Summary');
  if (hits.length) {
    log('Working field key(s): ' + hits.join(', '));
    log(`→ In home.html, set FIELD_KEY = '${hits[0]}'`);
  } else {
    log('✗ None of the tested keys triggered prefill.');
    log('  This could mean: (a) the form field key uses a custom slug only visible in GHL,');
    log('      (b) GHL multi-select dropdowns reject URL prefill for this field type, or');
    log('      (c) the field needs a different mechanism (e.g. POST body or JS embed).');
    log('  Next step: get the field key from GHL form builder → field settings.');
  }

  await browser.close();
  log('\nDone.');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
