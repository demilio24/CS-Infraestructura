const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
  );

  const filePath =
    'file:///' +
    path
      .resolve(
        'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
      )
      .replace(/\\/g, '/');

  // Intercept the document and inject the viewport meta tag the GHL host page
  // would normally provide.
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().endsWith('automation-vsl-direct-bg-matrix.html')) {
      req.continue();
    } else {
      req.continue();
    }
  });

  await page.goto(filePath, { waitUntil: 'networkidle2', timeout: 60000 });

  // Inject viewport meta the way GHL would
  await page.evaluate(() => {
    let meta = document.querySelector('meta[name=viewport]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content =
      'width=device-width, initial-scale=1, viewport-fit=cover';
  });

  // Force-reflow by scrolling
  await new Promise((r) => setTimeout(r, 200));

  // Force-show all anim elements + reveal all audit rows + finalize counters
  await page.evaluate(() => {
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
    document.querySelectorAll('.audit-row').forEach((el) => el.classList.add('audit-revealed'));
    const hrs = document.getElementById('audit-hrs');
    const total = document.getElementById('audit-total');
    if (hrs) hrs.textContent = '24';
    if (total) total.textContent = '170,100';
  });

  await new Promise((r) => setTimeout(r, 1500));

  // Scroll through the entire page to force browser to paint every section
  // (otherwise element.screenshot of tall elements shows unpainted "black voids")
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y <= total; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 800));

  const info = await page.evaluate(() => ({
    windowInner: window.innerWidth,
    docScroll: document.documentElement.scrollWidth,
  }));
  console.log('Viewport check:', JSON.stringify(info));

  const outDir = path.resolve('f:/GitHub/Websites/.claude/screenshots/mobile-real');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await page.screenshot({
    path: path.join(outDir, '00-fullpage.png'),
    fullPage: true,
  });
  console.log('SAVED: 00-fullpage.png');

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
    }
  }

  // Overflow
  const overflow = await page.evaluate(() => {
    const issues = [];
    const winWidth = window.innerWidth;
    if (document.documentElement.scrollWidth > winWidth) {
      issues.push(
        `DOC scrollWidth=${document.documentElement.scrollWidth} window=${winWidth}`
      );
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > winWidth + 1 && r.width > 0 && r.height > 0) {
          const tag = el.tagName.toLowerCase();
          const cls =
            el.className && typeof el.className === 'string'
              ? el.className.slice(0, 60)
              : '';
          issues.push(
            `OVERFLOW <${tag} class="${cls}"> right=${Math.round(r.right)} w=${Math.round(r.width)}`
          );
        }
      });
    }
    return issues.slice(0, 25);
  });
  console.log('\n=== OVERFLOW ===');
  overflow.forEach((s) => console.log(s));

  // Tiny tap targets (excluding inline video player controls)
  const tapTargets = await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('a, button, [onclick]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Skip video player controls
      if (
        el.classList.contains('vp-btn') ||
        el.classList.contains('hvp-btn')
      )
        return;
      if (r.width < 36 || r.height < 36) {
        const tag = el.tagName.toLowerCase();
        const cls =
          el.className && typeof el.className === 'string'
            ? el.className.slice(0, 60)
            : '';
        const text = (el.textContent || '').trim().slice(0, 40);
        issues.push(
          `<${tag} class="${cls}"> ${Math.round(r.width)}x${Math.round(r.height)} "${text}"`
        );
      }
    });
    return issues.slice(0, 20);
  });
  console.log('\n=== SMALL TAP TARGETS (< 36px, excl. video controls) ===');
  tapTargets.forEach((s) => console.log(s));

  await browser.close();
})();
