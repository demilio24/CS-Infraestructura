// Visual QA: screenshot all 3 slides of v1.html inquiry form (desktop + mobile)
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE = path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'v1.html');
const URL = 'file:///' + FILE.replace(/\\/g, '/');
const OUT = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function capture(viewport, suffix) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero-form-card', { visible: true });
  // Hide the stub GHL form-embed script noise
  await new Promise(r => setTimeout(r, 400));

  // Clip to the hero section only for a clean form shot
  const heroBox = await page.$eval('.hero', el => {
    const r = el.getBoundingClientRect();
    return { x: 0, y: 0, width: r.width, height: Math.min(r.height, window.innerHeight) };
  });

  await page.screenshot({ path: path.join(OUT, `v1-form-slide1-${suffix}.png`), clip: heroBox });

  // Fill slide 1 and advance
  await page.type('#v1InquiryForm input[name="firstName"]', 'Preview User');
  await page.type('#v1InquiryForm input[name="email"]', `preview-${Date.now()}@example.com`);
  await page.evaluate(() => window.v1SubmitSlide());
  await page.waitForSelector('#v1InquiryForm .v1-inq-slide[data-slide="1"].active', { visible: true });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, `v1-form-slide2-${suffix}.png`), clip: heroBox });

  // Advance to slide 3
  await page.evaluate(() => window.v1SubmitSlide());
  await page.waitForSelector('#v1InquiryForm .v1-inq-slide[data-slide="2"].active', { visible: true });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, `v1-form-slide3-${suffix}.png`), clip: heroBox });

  await browser.close();
}

(async () => {
  await capture({ width: 1400, height: 900 }, 'desktop');
  await capture({ width: 390, height: 844, isMobile: true, hasTouch: true }, 'mobile');
  console.log('screenshots written to', OUT);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
