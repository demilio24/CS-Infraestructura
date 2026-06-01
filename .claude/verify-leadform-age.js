// Live submit so the new `swimmer_age` field shows up in Tristan's GHL workflow
// trigger sample-payload UI. Sends Emilio's info + age = '5 to 12 years'.
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const consoleMsgs = [];
  page.on('pageerror', e => consoleMsgs.push('[pageerror] ' + e.message));
  page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`));

  let webhookReq = null;
  let webhookResp = null;
  page.on('request', req => {
    if (req.url().includes('webhook-trigger')) {
      webhookReq = {
        method: req.method(),
        url: req.url(),
        body: req.postData(),
        headers: req.headers(),
      };
    }
  });
  page.on('response', async r => {
    if (r.url().includes('webhook-trigger')) {
      webhookResp = { status: r.status(), body: await r.text().catch(() => '<unread>') };
    }
  });

  const url = 'file:///' + path.resolve(__dirname, '..', 'Tristan_AquanautsAcademy', 'funnel', 'home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 300));

  // Use Emilio's info, Private + Nanaimo + age 5-12 (kid)
  await page.evaluate(() => {
    const f = document.getElementById('leadForm');
    f.elements.first_name.value    = 'Emilio';
    f.elements.last_name.value     = 'Nils';
    f.elements.email.value         = 'emilio@nilsdigital.com';
    f.elements.phone.value         = '250-555-7777';
    f.elements.program_interest.value = 'private';
    f.elements.location.value      = 'nanaimo-central';
    f.elements.swimmer_age.value   = 'kid';
  });
  await page.click('#leadForm button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  console.log('=== Webhook request body sent to GHL ===');
  if (webhookReq) {
    try { console.log(JSON.stringify(JSON.parse(webhookReq.body), null, 2)); }
    catch { console.log(webhookReq.body); }
  } else {
    console.log('NO webhook request observed');
  }

  console.log('\n=== Webhook response from GHL ===');
  console.log(webhookResp);

  console.log('\n=== UI state after submit ===');
  const ui = await page.evaluate(() => ({
    successVisible: !document.getElementById('leadFormSuccess').hidden,
    redirectHref:   document.getElementById('leadFormRedirectBtn').href,
  }));
  console.log(ui);

  console.log('\n=== Console output ===');
  consoleMsgs.forEach(m => console.log('  ' + m));

  await browser.close();
})();
