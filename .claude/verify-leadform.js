const puppeteer = require('puppeteer');
const path = require('path');

const WEBHOOK = 'https://services.leadconnectorhq.com/hooks/xBWIIj9IjYQL2XdtjJ1A/webhook-trigger/7825fb7b-c5fa-4e9c-9161-97c0f156bc3f';

// Test cases: (program, location) → expected redirect URL.
const CASES = [
  ['adaptive',    'nanaimo-central',       'https://www.aquanautsacademy.ca/adaptive-aquatics'],
  ['mobile',      'victoria',              'https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book'],
  ['lifeguard',   'mobile',                'https://www.aquanautsacademy.ca/lifeguarding-services'],
  ['aquayoga',    'nanoose',               'https://www.aquanautsacademy.ca/aquayoga'],
  ['pool-host',   'parksville',            'https://www.aquanautsacademy.ca/pool-hosts'],
  ['partnership', 'campbell-river-npr',    'https://www.aquanautsacademy.ca/partnerships'],
  ['sponsorship', 'shawnigan',             'https://www.aquanautsacademy.ca/sponsorship'],
  ['other',       'port-alberni',          'https://aquanautsacademy.janeapp.com/'],
  ['adult',       'nanaimo-central',       'https://www.aquanautsacademy.ca/private-swim-lessons-for-adults'],
  ['private',    'nanaimo-central',       'https://aquanautsacademy.janeapp.com/locations/nanaimo-south-location/book'],
  ['private',    'nanoose',               'https://aquanautsacademy.janeapp.com/locations/nanoose-bay-pacific-shores-resort-and-spa/book'],
  ['private',    'parksville',            'https://aquanautsacademy.janeapp.com/locations/parksville-location-private-indoor-pool/book'],
  ['private',    'victoria',              'https://aquanautsacademy.janeapp.com/locations/victoria-location-private-indoor-pool/book'],
  ['private',    'shawnigan',             'https://aquanautsacademy.janeapp.com/locations/shawnigan-lake-location-private-outdoor-pool/book'],
  ['private',    'campbell-river-ramada', 'https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book'],
  ['private',    'campbell-river-npr',    'https://aquanautsacademy.janeapp.com/locations/campbell-river-naturally-pacific-resort/book'],
  ['private',    'port-alberni',          'https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book'],
  ['private',    'mobile',                'https://aquanautsacademy.janeapp.com/locations/mobile-swim-lessons-lifeguarding-vancouver-island/book'],
  ['private',    'not-sure',              'https://aquanautsacademy.janeapp.com/'],
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const url = 'file:///' + path.resolve(__dirname, '..', 'Tristan_AquanautsAcademy', 'funnel', 'home.html').replace(/\\/g, '/');

  // ===== Phase 1: routing test (webhook intercepted/mocked so we don't spam Tristan's GHL) =====
  console.log('=== Phase 1: routing across all 19 combos (webhook mocked) ===');
  let pass = 0, fail = 0;
  const failures = [];
  for (const [program, location, expected] of CASES) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (req.url().includes('webhook-trigger')) {
        req.respond({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        req.continue();
      }
    });
    const consoleErrors = [];
    page.on('pageerror', e => consoleErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate((program, location) => {
      const f = document.getElementById('leadForm');
      f.elements.first_name.value = 'Test';
      f.elements.last_name.value = 'Routing';
      f.elements.email.value = 'noreply+routing@example.invalid';
      f.elements.phone.value = '250-555-0000';
      f.elements.program_interest.value = program;
      f.elements.location.value = location;
    }, program, location);
    await page.click('#leadForm button[type="submit"]');
    await new Promise(r => setTimeout(r, 500));
    const result = await page.evaluate(() => ({
      successVisible: !document.getElementById('leadFormSuccess').hidden,
      redirectHref:   document.getElementById('leadFormRedirectBtn').href,
    }));
    const ok = result.successVisible && result.redirectHref === expected && consoleErrors.length === 0;
    if (ok) pass++;
    else { fail++; failures.push({ program, location, expected, got: result.redirectHref, succ: result.successVisible, errs: consoleErrors }); }
    await page.close();
  }
  console.log(`PASS: ${pass}/${CASES.length}`);
  if (failures.length) {
    console.log('Failures:');
    failures.forEach(f => console.log(`  ${f.program}/${f.location}: expected=${f.expected} got=${f.got}`));
  }

  // ===== Phase 2: ONE live submit to the real webhook with Emilio's info =====
  console.log('\n=== Phase 2: live submit (Emilio Nils, Private + Nanaimo) ===');
  const page = await browser.newPage();
  const consoleErrors = [];
  const consoleMsgs   = [];
  page.on('pageerror', e => consoleErrors.push(e.message));
  page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
  let liveResp = null;
  page.on('response', async r => {
    if (r.url().includes('webhook-trigger')) {
      liveResp = { status: r.status(), body: await r.text().catch(() => '<unread>') };
    }
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const f = document.getElementById('leadForm');
    f.elements.first_name.value = 'Emilio';
    f.elements.last_name.value = 'Nils';
    f.elements.email.value = 'emilio@nilsdigital.com';
    f.elements.phone.value = '250-555-7777';
    f.elements.program_interest.value = 'private';
    f.elements.location.value = 'nanaimo-central';
  });
  await page.click('#leadForm button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  const live = await page.evaluate(() => ({
    successVisible: !document.getElementById('leadFormSuccess').hidden,
    redirectHref:   document.getElementById('leadFormRedirectBtn').href,
  }));
  console.log('webhook response:', liveResp);
  console.log('UI state after submit:', live);
  console.log('console errors:', consoleErrors);
  console.log('console msgs:');
  consoleMsgs.forEach(m => console.log('  ' + m));

  await browser.close();
  process.exit((fail || liveResp?.status !== 200) ? 1 : 0);
})();
