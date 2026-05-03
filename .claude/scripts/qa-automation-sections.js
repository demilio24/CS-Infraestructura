const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const abs = path.resolve(__dirname, '..', '..', 'Nils', 'funnel', 'automation-vsl-funnel-direct.html');
  const file = 'file:///' + abs.split(path.sep).join('/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  // Force all .anim elements visible so deep-section content renders
  await page.addStyleTag({ content: '.anim{opacity:1!important;transform:none!important;}' });
  await new Promise(r => setTimeout(r, 500));

  const targets = [
    { sel: '.step-section.step-01', name: 'step01-audit-timeline' },
    { sel: '.step-section.step-02', name: 'step02-pmatrix-depts' },
    { sel: '.case-study-section', name: 'case-savvy' },
    { sel: '.about', name: 'about-emilio' },
    { sel: '.faq', name: 'faq' },
  ];

  for (const t of targets) {
    const el = await page.$(t.sel);
    if (!el) { console.log('Missing', t.sel); continue; }
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await el.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', `automation-${t.name}.png`) });
    console.log('Captured', t.name);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });