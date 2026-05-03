const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // iPhone 12/13/14 viewport
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  );

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  // Force-show all anim elements
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });

  await new Promise((r) => setTimeout(r, 1500));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/mobile');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Full page screenshot
  await page.screenshot({
    path: path.join(outDir, '00-fullpage.png'),
    fullPage: true,
  });
  console.log('SAVED: 00-fullpage.png');

  // 2. Per-section screenshots so I can review them targeted
  const sectionTargets = [
    { sel: '.hero', name: '01-hero' },
    { sel: '.cost-section', name: '02-cost' },
    { sel: '.step-section.step-01', name: '03-step01' },
    { sel: '.step-section.step-02', name: '04-step02' },
    { sel: '.case-study-section', name: '05-proof-of-concept' },
    { sel: '.about', name: '06-about-diff' },
    { sel: '.proof-section', name: '07-reviews' },
    { sel: '.guarantee', name: '08-guarantee' },
    { sel: '.faq', name: '09-faq' },
    { sel: '.matrix-section', name: '10-matrix' },
    { sel: '.footer', name: '11-footer' },
  ];

  for (const t of sectionTargets) {
    const el = await page.$(t.sel);
    if (el) {
      await el.scrollIntoView();
      await new Promise((r) => setTimeout(r, 350));
      try {
        await el.screenshot({ path: path.join(outDir, `${t.name}.png`) });
        console.log(`SAVED: ${t.name}.png`);
      } catch (e) {
        console.log(`FAIL: ${t.name}.png ${e.message}`);
      }
    } else {
      console.log(`MISS: ${t.sel}`);
    }
  }

  // 3. Check for horizontal overflow
  const overflow = await page.evaluate(() => {
    const issues = [];
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    if (docWidth > winWidth) {
      issues.push(`Document scrollWidth (${docWidth}) > viewport (${winWidth})`);
      // Find offending elements
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > winWidth + 1 && r.width > 0 && r.height > 0) {
          // Skip if it's a child of a fixed/absolute container we already noted
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '';
          issues.push(
            `OVERFLOW: <${tag} class="${cls}"> right=${Math.round(r.right)} width=${Math.round(r.width)}`
          );
        }
      });
    }
    return issues.slice(0, 30);
  });
  console.log('\n=== OVERFLOW CHECK ===');
  overflow.forEach((s) => console.log(s));

  // 4. Check for tiny tap targets (links/buttons)
  const tapTargets = await page.evaluate(() => {
    const issues = [];
    const targets = document.querySelectorAll('a, button, [onclick]');
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.width < 36 || r.height < 36) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '';
        const text = (el.textContent || '').trim().slice(0, 30);
        issues.push(`SMALL: <${tag} class="${cls}"> ${r.width}x${r.height} "${text}"`);
      }
    });
    return issues.slice(0, 20);
  });
  console.log('\n=== TAP TARGET CHECK (< 36x36) ===');
  tapTargets.forEach((s) => console.log(s));

  await browser.close();
})();
