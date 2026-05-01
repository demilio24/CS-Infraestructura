// Screenshot each filter tab so we can visually confirm Summer/Free are
// clean separate views.
const puppeteer = require('puppeteer');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DASH = `file:///${path.resolve(ROOT, 'Tom_Systema_Floyd/dashboard/index.html').replace(/\\/g, '/')}`;
const SHOTS = path.resolve(__dirname, 'screenshots');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(DASH, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.removeItem('sf-dash-goals-cache'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#cap-controls input[data-cap="upper"]');

  for (const tab of ['summer','free']) {
    await page.click(`.filter button[data-filter="${tab}"]`);
    await new Promise(r => setTimeout(r, 700));
    const file = path.join(SHOTS, `systema-dashboard-${tab}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`${tab}: ${file}`);
  }
  await page.evaluate(() => localStorage.removeItem('sf-dash-goals-cache'));
  await browser.close();
})();
