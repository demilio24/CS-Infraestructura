const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'screenshots', 'nav-variations');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  for (const vp of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.goto('http://localhost:8765/.claude/nav-variations/nav-4-tactical-slash.html', { waitUntil:'networkidle2' });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT, `nav-4-tactical-slash-${vp.name}.png`), fullPage: false });
    console.log(`✓ nav-4 ${vp.name}`);
    await page.close();
  }
  await browser.close();
})();
