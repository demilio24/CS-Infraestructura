/**
 * v3 — exhaustively probe GHL URL-prefill conventions for the swim-school field.
 * Uses the parent page so Cloudflare lets the form render, then swaps the
 * iframe src to each candidate URL and inspects the input's value after load.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const PAGE_URL = 'file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html';
const FORM_BASE = 'https://link.nilsdigital.com/widget/form/giAMs7ax6rJPENTGe40M';
const FORM_ORIGIN = 'link.nilsdigital.com';
const FIELD_NAME = 'QSBsbV7VASUQn8SyoXYY';
const VALUE = 'Edgewater';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const findFormFrame = (page) =>
  page.frames().find((f) => f.url().includes(FORM_ORIGIN));

const waitForFormReady = async (page, maxMs = 25000) => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const frame = findFormFrame(page);
    if (frame) {
      try {
        const ready = await frame.evaluate(
          (n) => !!document.querySelector(`input[name="${n}"]`),
          FIELD_NAME
        );
        if (ready) return frame;
      } catch (_) {}
    }
    await wait(600);
  }
  return null;
};

const readInputValue = (frame) =>
  frame.evaluate((n) => {
    const inp = document.querySelector(`input[name="${n}"]`);
    return inp ? inp.value : null;
  }, FIELD_NAME);

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

  log('Loading parent page…');
  await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  let frame = await waitForFormReady(page, 25000);
  if (!frame) {
    log('✗ form not ready; aborting');
    await browser.close();
    process.exit(1);
  }
  log('✓ form ready');

  // Candidate URL patterns to try
  const candidates = [
    `${FIELD_NAME}=${VALUE}`,
    `swim_school=${VALUE}`,
    `interest=${VALUE}`,
    `school=${VALUE}`,
    `location=${VALUE}`,
    `which_swim_school=${VALUE}`,
    `whichSwimSchool=${VALUE}`,
    `which_swim_school_are_you_interested_in=${VALUE}`,
    // GHL contact-prefix patterns
    `contact.${FIELD_NAME}=${VALUE}`,
    `contact.swim_school=${VALUE}`,
    // customField/cf prefix
    `customField.${FIELD_NAME}=${VALUE}`,
    `cf.${FIELD_NAME}=${VALUE}`,
    `cf_${FIELD_NAME}=${VALUE}`,
    // Bracket / encoded patterns
    `customFields[${FIELD_NAME}]=${VALUE}`,
    `fields[${FIELD_NAME}]=${VALUE}`,
    // GHL's "fName" / "field" patterns
    `field_${FIELD_NAME}=${VALUE}`,
    `f_${FIELD_NAME}=${VALUE}`,
    // Last-name-style
    `firstName=Test&${FIELD_NAME}=${VALUE}`, // sanity: see if firstName at least pre-fills
    `first_name=Test&${FIELD_NAME}=${VALUE}`,
  ];

  log(`\nProbing ${candidates.length} URL-param variants…\n`);
  const results = [];
  for (const qs of candidates) {
    const url = `${FORM_BASE}?${qs}`;
    try {
      await page.evaluate(
        (u) => {
          document.getElementById('inline-giAMs7ax6rJPENTGe40M').src = u;
        },
        url
      );
      // Give the iframe time to reload
      await wait(2000);
      frame = await waitForFormReady(page, 12000);
      if (!frame) {
        log(`  ${qs.padEnd(60)} → form not ready`);
        results.push({ qs, val: null, ok: false });
        continue;
      }
      // Wait an extra beat for prefill to apply
      await wait(2000);
      // Read both target field and (if present) full_name to confirm sanity
      const state = await frame.evaluate((n) => {
        const target = document.querySelector(`input[name="${n}"]`);
        const fullName = document.querySelector('input[name="full_name"]');
        const firstName = document.querySelector('input[name="first_name"]');
        return {
          targetValue: target ? target.value : null,
          fullNameValue: fullName ? fullName.value : null,
          firstNameValue: firstName ? firstName.value : null,
        };
      }, FIELD_NAME);
      const ok = state.targetValue && state.targetValue.toLowerCase() === VALUE.toLowerCase();
      const sanity =
        state.fullNameValue === 'Test' ||
        state.firstNameValue === 'Test'
          ? ' [name-sanity ✓]'
          : '';
      log(
        `  ${qs.padEnd(60)} → target="${state.targetValue}"${sanity}  ${ok ? '✓ HIT' : ''}`
      );
      results.push({ qs, val: state.targetValue, ok });
      if (ok) break;
    } catch (e) {
      log(`  ${qs.padEnd(60)} → ERROR: ${e.message}`);
    }
  }

  log('\nSUMMARY');
  const hit = results.find((r) => r.ok);
  if (hit) {
    log(`✓ Working URL pattern: ?${hit.qs}`);
    const key = hit.qs.split('=')[0];
    log(`→ FIELD_KEY = '${key}'`);
  } else {
    log('✗ No URL-param pattern pre-fills this field.');
    log('  GHL likely does not support URL prefill for this custom field type.');
    log('  (The "name-sanity" check shows whether default fields like first_name');
    log('   accept ?first_name= prefill — that signal indicates whether GHL');
    log('   prefill is on at all for this form.)');
  }

  await browser.close();
})().catch((e) => {
  console.error('crashed:', e);
  process.exit(1);
});
