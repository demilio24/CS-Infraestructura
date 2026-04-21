const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'screenshots', 'nav-variations');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8765/.claude/nav-variations/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000)); // let iframes render
  await page.screenshot({ path: path.join(OUT, 'index-gallery.png'), fullPage: true });
  console.log('Gallery screenshot saved.');
  await browser.close();
})();
