const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '..', 'screenshots', 'systema-qa');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:8765/Tom_Systema_Floyd/funnel/home.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // focus the combobox
  await page.focus('#pCampusSearch');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'combobox-open.png'), fullPage: false });

  // type "st"
  await page.type('#pCampusSearch', 'st', { delay: 80 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'combobox-filter-st.png'), fullPage: false });

  // clear and type "disc"
  await page.click('#pCampusSearch', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('#pCampusSearch', 'disc', { delay: 80 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, 'combobox-filter-disc.png'), fullPage: false });

  // Press Enter to select first match
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 400));
  const hiddenVal = await page.$eval('#pCampus', (el) => el.value);
  const visibleVal = await page.$eval('#pCampusSearch', (el) => el.value);
  console.log('After Enter — hidden:', hiddenVal, '| visible:', visibleVal);
  await page.screenshot({ path: path.join(OUT, 'combobox-selected.png'), fullPage: false });

  await browser.close();
  console.log('Combobox interaction screenshots saved.');
})();
