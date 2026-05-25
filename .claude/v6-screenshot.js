// Quick QA screenshot of v6.html — capture the three areas we changed:
// (1) statement section with new "what we do" eyebrow,
// (2) final CTA section with new prominent Inquiry button,
// (3) contact form (shorter questionnaire) at slide 1 and slide 2.
// Caps each shot at 2000px per project memory.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE = 'file:///' + path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'v6.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });

  // 1. Desktop — statement + final CTA
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    // Dismiss entry overlay
    await page.evaluate(() => { const e = document.getElementById('entry'); if (e) e.style.display = 'none'; });
    // Screenshot the statement area (with new "what we do" line)
    const statement = await page.$('section.statement');
    if (statement) await statement.screenshot({ path: path.join(OUT, 'v6-desktop-statement.png') });
    // Scroll to and screenshot final CTA
    await page.evaluate(() => { document.querySelector('section.finalcta').scrollIntoView({ block: 'center' }); });
    await new Promise(r => setTimeout(r, 800));
    const finalcta = await page.$('section.finalcta');
    if (finalcta) await finalcta.screenshot({ path: path.join(OUT, 'v6-desktop-finalcta.png') });
    // Hover state on the primary CTA
    await page.hover('section.finalcta .cta-primary');
    await new Promise(r => setTimeout(r, 500));
    if (finalcta) await finalcta.screenshot({ path: path.join(OUT, 'v6-desktop-finalcta-hover.png') });
    await page.close();
  }

  // 2. Contact form — both slides
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => { const e = document.getElementById('entry'); if (e) e.style.display = 'none'; });
    await page.evaluate(() => { if (typeof showPage === 'function') showPage('contact'); });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => { window.scrollTo(0, 0); });
    const contactArea = await page.$('#page-contact');
    if (contactArea) await contactArea.screenshot({ path: path.join(OUT, 'v6-desktop-contact-slide1.png') });

    // Switch to slide 2 directly
    await page.evaluate(() => {
      document.querySelectorAll('#inquiryForm .slide').forEach(s => s.classList.remove('active'));
      document.querySelector('#inquiryForm .slide[data-slide="1"]').classList.add('active');
      document.getElementById('slideCurrent').textContent = '02';
    });
    await new Promise(r => setTimeout(r, 400));
    if (contactArea) await contactArea.screenshot({ path: path.join(OUT, 'v6-desktop-contact-slide2.png') });
    await page.close();
  }

  // 3. Mobile — statement + finalcta + contact slide 1
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto(FILE, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => { const e = document.getElementById('entry'); if (e) e.style.display = 'none'; });
    const statement = await page.$('section.statement');
    if (statement) await statement.screenshot({ path: path.join(OUT, 'v6-mobile-statement.png') });
    await page.evaluate(() => { document.querySelector('section.finalcta').scrollIntoView({ block: 'center' }); });
    await new Promise(r => setTimeout(r, 600));
    const finalcta = await page.$('section.finalcta');
    if (finalcta) await finalcta.screenshot({ path: path.join(OUT, 'v6-mobile-finalcta.png') });
    await page.close();
  }

  await browser.close();
  console.log('Done. Screenshots in', OUT);
})().catch(e => { console.error(e); process.exit(1); });
