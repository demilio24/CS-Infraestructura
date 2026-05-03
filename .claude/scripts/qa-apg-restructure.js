const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const abs = path.resolve(__dirname, '..', '..', 'Nils', 'funnel', 'automation-vsl-funnel-direct.html');
  const file = 'file:///' + abs.split(path.sep).join('/');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(file, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.addStyleTag({ content: '.anim{opacity:1!important;transform:none!important;}' });
  await new Promise(r => setTimeout(r, 500));

  const targets = [
    { sel: 'section.hero', name: 'apg-hero' },
    { sel: 'section.problem', name: 'apg-problem' },
    { sel: '.audit-journey-section', name: 'apg-journey' },
    { sel: '.uncover-section', name: 'apg-uncover' },
    { sel: '.step-section.step-02', name: 'apg-where' },
    { sel: '.delivers-section', name: 'apg-delivers' },
    { sel: '.guarantee-apg', name: 'apg-guarantee' },
    { sel: '.founder-section', name: 'apg-founder' },
    { sel: '.socialproof-section', name: 'apg-social' },
    { sel: '.case-study-section', name: 'apg-case' },
    { sel: '.proof-section', name: 'apg-testimonials' },
    { sel: 'section.faq', name: 'apg-faq' },
    { sel: '.finalcta-section', name: 'apg-finalcta' },
  ];

  for (const t of targets) {
    const el = await page.$(t.sel);
    if (!el) { console.log('Missing', t.sel); continue; }
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));
    await el.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', `${t.name}.png`) });
    console.log('Captured', t.name);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
