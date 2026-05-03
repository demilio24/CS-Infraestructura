const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE_PATH =
  'file:///' +
  path
    .resolve(
      'f:/GitHub/Websites/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html'
    )
    .replace(/\\/g, '/');

async function runAudit({ width, height, isMobile, label }) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedResponses = [];
  const allResponses = [];
  const requestStartedAt = {};
  const slowResponses = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    failedResponses.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on('request', (req) => {
    requestStartedAt[req.url()] = Date.now();
  });
  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    const startedAt = requestStartedAt[url];
    const duration = startedAt ? Date.now() - startedAt : null;
    const type = res.request().resourceType();
    allResponses.push({ url, status, type, duration });
    if (status >= 400) {
      failedResponses.push(`${status} ${type} ${url}`);
    }
    if (duration && duration > 2500 && type !== 'document' && type !== 'xhr') {
      slowResponses.push(`${duration}ms  ${type}  ${url.slice(0, 90)}`);
    }
  });

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile,
  });
  if (isMobile) {
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
    );
  }

  const navStart = Date.now();
  await page.goto(FILE_PATH, { waitUntil: 'networkidle2', timeout: 60000 });
  const navMs = Date.now() - navStart;

  // Inject viewport meta the way GHL host does
  await page.evaluate(() => {
    let m = document.querySelector('meta[name=viewport]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      document.head.appendChild(m);
    }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.querySelectorAll('.anim').forEach((el) => el.classList.add('visible'));
  });

  // Let everything settle
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll-paint everything
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y <= total; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 600));

  // Performance metrics
  const perf = await page.evaluate(() => {
    const t = performance.timing;
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');
    return {
      domInteractive: nav ? Math.round(nav.domInteractive) : null,
      domComplete: nav ? Math.round(nav.domComplete) : null,
      loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
      firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
      totalResources: performance.getEntriesByType('resource').length,
    };
  });

  // Asset audit
  const assetAudit = await page.evaluate(() => {
    const imgs = Array.from(document.images);
    const broken = imgs.filter(
      (i) => !i.complete || i.naturalWidth === 0
    );
    const oversized = imgs
      .map((i) => {
        const r = i.getBoundingClientRect();
        return {
          src: i.currentSrc || i.src,
          natural: `${i.naturalWidth}x${i.naturalHeight}`,
          rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
          ratio:
            r.width && i.naturalWidth
              ? +(i.naturalWidth / r.width).toFixed(1)
              : null,
        };
      })
      .filter((i) => i.ratio && i.ratio > 3.5)
      .slice(0, 12);
    return {
      totalImages: imgs.length,
      broken: broken.map((i) => i.src),
      oversized,
    };
  });

  // Interactivity check — ensure key buttons exist and are clickable
  const interactive = await page.evaluate(() => {
    const checks = [];
    const ctas = document.querySelectorAll('a, button');
    let visibleCtas = 0;
    let zeroSizeCtas = 0;
    ctas.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) visibleCtas++;
      else if (
        getComputedStyle(el).display !== 'none' &&
        getComputedStyle(el).visibility !== 'hidden'
      )
        zeroSizeCtas++;
    });
    checks.push({ name: 'CTAs visible', count: visibleCtas });
    checks.push({ name: 'CTAs with zero size but rendered', count: zeroSizeCtas });

    const watchBtn = document.querySelector('.diff-closing-watch');
    checks.push({
      name: 'Watch testimonial button present',
      ok: !!watchBtn,
    });
    const videoModal = document.getElementById('video-modal');
    checks.push({ name: 'Video modal in DOM', ok: !!videoModal });
    const applyModal = document.getElementById('apply-modal');
    checks.push({ name: 'Apply modal in DOM', ok: !!applyModal });

    const reviewsImgs = document.querySelectorAll('.proof-reviews-grid img');
    let loadedReviews = 0;
    reviewsImgs.forEach((i) => {
      if (i.complete && i.naturalWidth > 0) loadedReviews++;
    });
    checks.push({
      name: 'Reviews loaded',
      count: `${loadedReviews}/${reviewsImgs.length}`,
    });

    const diffPhotos = document.querySelectorAll('.diff-photo');
    let loadedPhotos = 0;
    diffPhotos.forEach((i) => {
      if (i.complete && i.naturalWidth > 0) loadedPhotos++;
    });
    checks.push({
      name: 'Mosaic photos loaded',
      count: `${loadedPhotos}/${diffPhotos.length}`,
    });

    return checks;
  });

  // Test the watch testimonial modal opens
  const modalTest = await page.evaluate(async () => {
    const result = {};
    if (typeof openVideoModal === 'function') {
      openVideoModal();
      await new Promise((r) => setTimeout(r, 300));
      const overlay = document.getElementById('video-modal');
      result.opened = !!(overlay && overlay.classList.contains('open'));
      if (typeof closeVideoModal === 'function') closeVideoModal();
    } else {
      result.error = 'openVideoModal not defined';
    }
    return result;
  });

  // FAQ toggle test
  const faqTest = await page.evaluate(async () => {
    const first = document.querySelector('.faq-item');
    if (!first) return { error: 'no .faq-item' };
    const trigger = first.querySelector('.faq-q, button, summary');
    if (!trigger) return { error: 'no trigger' };
    const before = first.classList.contains('open') || first.hasAttribute('open');
    trigger.click();
    await new Promise((r) => setTimeout(r, 300));
    const after = first.classList.contains('open') || first.hasAttribute('open');
    return { toggled: before !== after, before, after };
  });

  // Document scroll-width check (overflow)
  const overflowCheck = await page.evaluate(() => {
    return {
      windowInner: window.innerWidth,
      docScroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
    };
  });

  // Tap-target check (mobile only)
  const tapTargets = isMobile
    ? await page.evaluate(() => {
        const issues = [];
        document.querySelectorAll('a, button, [onclick]').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
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
            const text = (el.textContent || '').trim().slice(0, 30);
            issues.push(
              `<${tag} ${cls}> ${Math.round(r.width)}x${Math.round(r.height)} "${text}"`
            );
          }
        });
        return issues.slice(0, 12);
      })
    : [];

  // Total bytes by resource type
  const byType = {};
  const totalBytesByType = {};
  for (const r of allResponses) {
    if (!byType[r.type]) byType[r.type] = 0;
    byType[r.type]++;
  }

  await browser.close();

  return {
    label,
    nav: { msTotalToNetworkIdle: navMs },
    perf,
    overflowCheck,
    consoleErrors,
    consoleWarnings,
    pageErrors,
    failedResponses,
    slowResponses,
    assetAudit,
    interactive,
    modalTest,
    faqTest,
    tapTargets,
    resourcesByType: byType,
  };
}

(async () => {
  const desktop = await runAudit({
    width: 1440,
    height: 900,
    isMobile: false,
    label: 'desktop',
  });
  const mobile = await runAudit({
    width: 390,
    height: 844,
    isMobile: true,
    label: 'mobile',
  });

  const out = { desktop, mobile };

  // Pretty summary
  console.log('\n================== USABILITY AUDIT ==================\n');
  for (const r of [desktop, mobile]) {
    console.log(`──── ${r.label.toUpperCase()} ────`);
    console.log(`  Nav (to networkidle2): ${r.nav.msTotalToNetworkIdle} ms`);
    console.log(`  FCP: ${r.perf.firstContentfulPaint} ms`);
    console.log(`  domInteractive: ${r.perf.domInteractive} ms`);
    console.log(`  domComplete:    ${r.perf.domComplete} ms`);
    console.log(`  Total resources: ${r.perf.totalResources}`);
    console.log(`  Resource counts by type:`, r.resourcesByType);
    console.log(`  Overflow:`, r.overflowCheck);
    console.log(`  Console errors  : ${r.consoleErrors.length}`);
    if (r.consoleErrors.length)
      r.consoleErrors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
    console.log(`  Console warnings: ${r.consoleWarnings.length}`);
    if (r.consoleWarnings.length)
      r.consoleWarnings.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
    console.log(`  Page errors     : ${r.pageErrors.length}`);
    r.pageErrors.forEach((e) => console.log(`    - ${e}`));
    console.log(`  Failed responses: ${r.failedResponses.length}`);
    r.failedResponses.slice(0, 8).forEach((e) => console.log(`    - ${e}`));
    console.log(`  Slow resources (>2.5s): ${r.slowResponses.length}`);
    r.slowResponses.slice(0, 8).forEach((e) => console.log(`    - ${e}`));
    console.log(`  Total images: ${r.assetAudit.totalImages}`);
    console.log(`  Broken images: ${r.assetAudit.broken.length}`);
    r.assetAudit.broken.slice(0, 5).forEach((s) => console.log(`    - ${s}`));
    console.log(
      `  Oversized images (natural / rendered ratio > 3.5x):`,
      r.assetAudit.oversized.length
    );
    r.assetAudit.oversized.slice(0, 8).forEach((i) =>
      console.log(
        `    - ratio ${i.ratio}x  natural=${i.natural}  rendered=${i.rendered}  ${i.src.slice(0, 70)}`
      )
    );
    console.log(`  Interactivity checks:`);
    r.interactive.forEach((c) =>
      console.log(`    - ${c.name}:`, c.count ?? c.ok)
    );
    console.log(`  Video modal opens:`, r.modalTest);
    console.log(`  FAQ toggles:`, r.faqTest);
    if (r.label === 'mobile') {
      console.log(`  Tiny tap targets (excl video controls): ${r.tapTargets.length}`);
      r.tapTargets.forEach((t) => console.log(`    - ${t}`));
    }
    console.log('');
  }

  fs.writeFileSync(
    path.resolve('f:/GitHub/Websites/.claude/screenshots/audit-usability.json'),
    JSON.stringify(out, null, 2)
  );
  console.log('Saved JSON: f:/GitHub/Websites/.claude/screenshots/audit-usability.json');
})();
