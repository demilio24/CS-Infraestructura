const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

async function shoot(browser, w, h, tag) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    // Force nav to solid state so logo is dark + readable
    const nav = document.getElementById('nav');
    nav.classList.remove('dark', 'inverted');
    nav.classList.add('solid');
  });
  await new Promise(r => setTimeout(r, 1500));
  const out = path.resolve(__dirname, '..', 'screenshots', `nav-${tag}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: 120 } });
  console.log('Saved', out);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  await shoot(browser, 1440, 200, 'desktop');
  await shoot(browser, 390, 200, 'mobile');
  await browser.close();
})();
