const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v1.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) e.style.display = 'none';
    document.querySelectorAll('.anim').forEach(el => el.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 800));

  // 1) Portrait shot — anchored to .about-portrait element
  const portrait = await page.$('.about-portrait');
  if (portrait) {
    await portrait.scrollIntoView();
    await new Promise(r => setTimeout(r, 1200));
    const out1 = path.resolve(__dirname, '..', 'screenshots', 'v1-portrait.png');
    await portrait.screenshot({ path: out1 });
    console.log('Saved', out1);
  }

  // 2) Get In Touch -> Our Work transition shot — scroll the GET IN TOUCH button into view
  // The services section ends with a .section-cta containing "Get In Touch", followed by .gallery with "Our Work"
  await page.evaluate(() => {
    const galleries = document.querySelectorAll('.section-cta');
    // Find the .section-cta that's followed by #gallery
    const gal = document.getElementById('gallery');
    if (gal) {
      const btn = gal.previousElementSibling?.querySelector('.section-cta .btn-gold');
      if (btn) btn.scrollIntoView({ block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  const out2 = path.resolve(__dirname, '..', 'screenshots', 'v1-cta-to-our-work.png');
  await page.screenshot({ path: out2, fullPage: false });
  console.log('Saved', out2);

  await browser.close();
})();