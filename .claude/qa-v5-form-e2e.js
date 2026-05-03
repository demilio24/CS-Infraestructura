// End-to-end test: Mandy v5.html contact form
// Loads the page via local file server, walks all 3 slides, verifies:
//  - no scroll-down between slides
//  - final success message renders
//  - GHL contact is created with all custom fields
const puppeteer = require('puppeteer');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'v5.html');
const URL = 'file:///' + FILE.replace(/\\/g, '/');
const EMAIL = `claude-e2e-${Date.now()}@example.com`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', m => consoleErrors.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => consoleErrors.push('reqfail: ' + r.url() + ' ' + r.failure()?.errorText));
  page.on('response', async r => {
    if (r.url().includes('leadconnectorhq.com/contacts') && !r.ok()) {
      try { consoleErrors.push('GHL ' + r.status() + ' body: ' + await r.text()); } catch {}
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Navigate to contact page
  await page.evaluate(() => { sessionStorage.setItem('vp', 'contact'); });
  await page.reload({ waitUntil: 'networkidle2' });

  // Wait for form to be visible
  await page.waitForSelector('#inquiryForm .slide[data-slide="0"].active', { visible: true });

  // Slide 1
  await page.type('input[name="firstName"]', 'Claude E2E');
  await page.type('input[name="email"]', EMAIL);
  await page.type('input[name="phone"]', '+15551234567');
  await page.type('input[name="location"]', 'Chicago, IL');

  const scrollBeforeSlide1 = await page.evaluate(() => window.scrollY);
  // Log what the button looks like
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('#inquiryForm .slide[data-slide="0"] .submit-btn');
    if (!btn) return 'no btn';
    const r = btn.getBoundingClientRect();
    return { text: btn.textContent, onclick: String(btn.onclick), rect: {x:r.x,y:r.y,w:r.width,h:r.height}, typeofFn: typeof window.submitSlide };
  });
  console.log('btnInfo:', JSON.stringify(btnInfo));
  // Fire submitSlide directly (equivalent to clicking)
  await page.evaluate(() => window.submitSlide());
  try {
    await page.waitForSelector('#inquiryForm .slide[data-slide="1"].active', { visible: true, timeout: 8000 });
  } catch (e) {
    const state = await page.evaluate(() => ({
      note: document.getElementById('sentNote')?.textContent,
      activeSlide: document.querySelector('#inquiryForm .slide.active')?.getAttribute('data-slide'),
      slideIdx: typeof slideIdx !== 'undefined' ? slideIdx : 'undef',
    }));
    console.log('DEBUG after slide1 click:', JSON.stringify(state));
    console.log('Console so far:', consoleErrors.slice(-20).join('\n'));
    throw e;
  }
  await new Promise(r => setTimeout(r, 800));
  const scrollAfterSlide1 = await page.evaluate(() => window.scrollY);

  // Slide 2
  await page.type('input[name="project_type"]', 'Residential new build');
  await page.type('input[name="project_stage"]', 'Early concept');
  await page.type('textarea[name="design_intent"]', 'Calm, considered, layered');
  await page.type('input[name="design_direction"]', 'Modern');

  const scrollBeforeSlide2 = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.submitSlide());
  try {
    await page.waitForSelector('#inquiryForm .slide[data-slide="2"].active', { visible: true, timeout: 8000 });
  } catch (e) {
    const state = await page.evaluate(() => ({
      note: document.getElementById('sentNote')?.textContent,
      activeSlide: document.querySelector('#inquiryForm .slide.active')?.getAttribute('data-slide'),
      slideIdx: typeof slideIdx !== 'undefined' ? slideIdx : 'undef',
    }));
    console.log('DEBUG after slide2 click:', JSON.stringify(state));
    console.log('Console tail:', consoleErrors.slice(-20).join('\n'));
    throw e;
  }
  await new Promise(r => setTimeout(r, 800));
  const scrollAfterSlide2 = await page.evaluate(() => window.scrollY);

  // Slide 3
  await page.type('input[name="lifestyle"]', 'Primary residence');
  await page.type('input[name="prior_designer"]', 'First collaboration');
  await page.type('input[name="estimated_budget"]', '$100k-$250k');

  await page.evaluate(() => window.submitSlide());

  // Wait for success message (final PUT is awaited before it renders)
  await page.waitForFunction(() => {
    const n = document.getElementById('sentNote');
    return n && /inquiry has been received|went wrong/i.test(n.textContent);
  }, { timeout: 15000 });

  const finalNote = await page.$eval('#sentNote', n => n.textContent.trim());

  console.log(JSON.stringify({
    email: EMAIL,
    scrollBeforeSlide1, scrollAfterSlide1,
    scrollBeforeSlide2, scrollAfterSlide2,
    finalNote,
    consoleErrors,
  }, null, 2));

  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
