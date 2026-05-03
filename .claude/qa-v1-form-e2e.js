// E2E test: v1.html hero inquiry form (3 slides, GHL upsert)
const puppeteer = require('puppeteer');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'v1.html');
const URL = 'file:///' + FILE.replace(/\\/g, '/');
const EMAIL = `claude-v1-e2e-${Date.now()}@example.com`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const log = [];
  page.on('console', m => log.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => log.push('pageerror: ' + e.message));
  page.on('response', async r => {
    if (r.url().includes('leadconnectorhq.com/contacts') && !r.ok()) {
      try { log.push('GHL ' + r.status() + ' body: ' + await r.text()); } catch {}
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#v1InquiryForm .v1-inq-slide[data-slide="0"].active', { visible: true });

  // Slide 1
  await page.type('#v1InquiryForm input[name="firstName"]', 'Claude V1 E2E');
  await page.type('#v1InquiryForm input[name="email"]', EMAIL);
  await page.type('#v1InquiryForm input[name="phone"]', '+15551234567');
  await page.type('#v1InquiryForm input[name="location"]', 'Chicago, IL');

  const s1_before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.v1SubmitSlide());
  await page.waitForSelector('#v1InquiryForm .v1-inq-slide[data-slide="1"].active', { visible: true, timeout: 8000 });
  await new Promise(r => setTimeout(r, 500));
  const s1_after = await page.evaluate(() => window.scrollY);

  // Slide 2
  await page.type('#v1InquiryForm input[name="project_type"]', 'Full-home renovation');
  await page.type('#v1InquiryForm input[name="project_stage"]', 'Ready to begin');
  await page.type('#v1InquiryForm textarea[name="design_intent"]', 'Warm, layered, quietly luxurious');
  await page.type('#v1InquiryForm input[name="design_direction"]', 'Classic with modern restraint');

  const s2_before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.v1SubmitSlide());
  await page.waitForSelector('#v1InquiryForm .v1-inq-slide[data-slide="2"].active', { visible: true, timeout: 8000 });
  await new Promise(r => setTimeout(r, 500));
  const s2_after = await page.evaluate(() => window.scrollY);

  // Slide 3
  await page.type('#v1InquiryForm input[name="lifestyle"]', 'Primary residence, family life');
  await page.type('#v1InquiryForm input[name="prior_designer"]', 'First collaboration');
  await page.type('#v1InquiryForm input[name="estimated_budget"]', '$250k-$500k');
  await page.evaluate(() => window.v1SubmitSlide());

  await page.waitForFunction(() => {
    const n = document.getElementById('v1SentNote');
    return n && /inquiry has been received|went wrong/i.test(n.textContent);
  }, { timeout: 15000 });

  const finalNote = await page.$eval('#v1SentNote', n => n.textContent.trim());

  // Screenshot the final success state
  await page.screenshot({ path: path.resolve(__dirname, 'screenshots', 'v1-form-final.png'), fullPage: false });

  console.log(JSON.stringify({
    email: EMAIL,
    scroll: { s1_before, s1_after, s2_before, s2_after },
    finalNote,
    ghlErrors: log.filter(l => l.includes('GHL ') || l.includes('Lead save') || l.includes('Update failed')),
    errorLog: log.filter(l => l.includes('[error]') || l.startsWith('pageerror')),
  }, null, 2));

  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
