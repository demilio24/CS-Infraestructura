import puppeteer from 'puppeteer';
import path from 'path';

const file = 'file:///' + path.resolve('../Mandy_VeLUS_Design/v1.html').split(path.sep).join('/');
const outDir = path.resolve('./screenshots');

const browser = await puppeteer.launch({ headless: 'new' });

async function shoot(width, height, deviceScaleFactor, name) {
  const p = await browser.newPage();
  await p.setViewport({ width, height, deviceScaleFactor });
  await p.goto(file, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  // Force all anim elements visible (IntersectionObserver doesn't fire reliably on fullPage)
  await p.evaluate(() => {
    document.querySelectorAll('.anim').forEach(el => el.classList.add('anim-visible'));
  });
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: outDir + `/v1-new-${name}-viewport.png` });
  await p.screenshot({ path: outDir + `/v1-new-${name}-full.png`, fullPage: true });

  // Section-by-section
  const sections = ['hero', 'about', 'services', 'gallery', 'process', 'reviews', 'cta', 'footer'];
  for (const s of sections) {
    const el = await p.$('#' + s);
    if (el) await el.screenshot({ path: outDir + `/v1-new-${name}-${s}.png` });
  }
  await p.close();
}

await shoot(1440, 900, 1, 'desktop');
await shoot(390, 844, 2, 'mobile');

await browser.close();
console.log('done');
