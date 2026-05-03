const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const filePath = 'file:///' + path.resolve('f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-funnel-direct.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for animations to settle
  await new Promise(r => setTimeout(r, 1500));

  // Trigger anim visibility for all
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
  });
  await new Promise(r => setTimeout(r, 500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Screenshot the case studies section
  const caseStudy = await page.$('.case-study-section');
  if (caseStudy) {
    await caseStudy.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    await caseStudy.screenshot({ path: path.join(outDir, 'automation-case-studies.png') });
    console.log('✓ Case studies screenshot saved');
  } else {
    console.log('✗ No .case-study-section found');
  }

  // Screenshot the testimonials section
  const proof = await page.$('.proof-section');
  if (proof) {
    await proof.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    await proof.screenshot({ path: path.join(outDir, 'automation-testimonials.png') });
    console.log('✓ Testimonials screenshot saved');
  } else {
    console.log('✗ No .proof-section found');
  }

  // Mobile view of testimonials
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 500));
  if (proof) {
    await proof.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    await proof.screenshot({ path: path.join(outDir, 'automation-testimonials-mobile.png') });
    console.log('✓ Mobile testimonials screenshot saved');
  }
  if (caseStudy) {
    await caseStudy.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    await caseStudy.screenshot({ path: path.join(outDir, 'automation-case-studies-mobile.png') });
    console.log('✓ Mobile case studies screenshot saved');
  }

  await browser.close();
})();
