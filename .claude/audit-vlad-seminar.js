/* Exhaustive functional + mobile audit for vlad-seminar.html */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:8765/Tom_Systema_Floyd/funnel/vlad-seminar.html';
const OUT = path.join(__dirname, 'screenshots', 'vlad-seminar-audit');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'galaxy-s20-360', w: 360, h: 800, dsf: 3, mobile: true },
  { name: 'iphone-se-375',  w: 375, h: 667, dsf: 2, mobile: true },
  { name: 'iphone-14-390',  w: 390, h: 844, dsf: 3, mobile: true },
  { name: 'pixel-7-412',    w: 412, h: 915, dsf: 2.625, mobile: true },
  { name: 'iphone-plus-428', w: 428, h: 926, dsf: 3, mobile: true },
  { name: 'tablet-768',     w: 768, h: 1024, dsf: 2, mobile: true },
  { name: 'desktop-1440',   w: 1440, h: 900, dsf: 1, mobile: false },
];

const REPORT = {
  perViewport: {},
  global: { warnings: [], errors: [], info: [] },
};

function note(viewport, level, category, message, detail) {
  const bucket = REPORT.perViewport[viewport] = REPORT.perViewport[viewport] || { errors: [], warnings: [], info: [] };
  bucket[level].push({ category, message, detail });
}

async function runOnViewport(browser, vp) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dsf, isMobile: vp.mobile, hasTouch: vp.mobile });
  // Stable UA so we don't trigger any device-specific GHL form path
  if (vp.mobile) {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  }

  const consoleMsgs = [];
  page.on('console', m => consoleMsgs.push({ type: m.type(), text: m.text() }));
  const requestFailures = [];
  page.on('requestfailed', r => requestFailures.push({ url: r.url(), reason: r.failure()?.errorText }));
  const responseStatus = [];
  page.on('response', r => {
    const st = r.status();
    if (st >= 400) responseStatus.push({ url: r.url(), status: st });
  });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 800)));

  // === 1. Console errors / failed requests ===
  consoleMsgs.filter(m => m.type === 'error').forEach(m => note(vp.name, 'errors', 'Console', m.text));
  requestFailures.forEach(f => note(vp.name, 'errors', 'NetReq', f.reason, f.url));
  responseStatus.forEach(r => {
    // Ignore the form analytics 404 that's normal for GHL until form is submitted
    if (r.url.includes('link.nilsdigital.com')) return;
    note(vp.name, 'errors', 'HTTP'+r.status, r.url);
  });

  // === 2. Horizontal overflow ===
  const overflows = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      // Tolerate 2px subpixel rounding
      if (r.right > docW + 2) {
        out.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').slice(0,60), id: el.id || '', right: Math.round(r.right), w: Math.round(r.width), docW });
      }
    });
    return out;
  });
  if (overflows.length) {
    // Group by tag+class to dedupe
    const seen = new Set();
    overflows.forEach(o => {
      const key = o.tag + '.' + o.cls + '#' + o.id;
      if (seen.has(key)) return;
      seen.add(key);
      note(vp.name, 'errors', 'Overflow-X', `<${o.tag}>${o.cls ? '.'+o.cls.split(' ')[0]:''} right=${o.right}px (docW=${o.docW}px)`);
    });
  }

  // === 3. Tap target sizes — only relevant on mobile ===
  if (vp.mobile) {
    const smallTargets = await page.evaluate(() => {
      const selector = 'a, button, [role="button"], input[type="submit"], input[type="button"]';
      const els = Array.from(document.querySelectorAll(selector));
      const out = [];
      els.forEach(el => {
        if (el.closest('iframe, .lightbox')) return;
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || r.height === 0) return;
        // Skip inline links that wrap text within a paragraph
        const isInlineInText = el.tagName === 'A' && (el.closest('p, span, h1, h2, h3, h4, h5, h6') !== null) && r.height < 40;
        if (isInlineInText) return;
        if (r.width < 44 || r.height < 44) {
          out.push({
            tag: el.tagName,
            text: (el.innerText || '').slice(0,40),
            cls: (el.className?.toString?.() || '').slice(0,40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      });
      return out;
    });
    smallTargets.forEach(t => note(vp.name, 'warnings', 'TapTarget', `<${t.tag}> "${t.text}" ${t.w}×${t.h}px`, t.cls));
  }

  // === 4. Sticky nav behavior ===
  const navState = await page.evaluate(() => {
    const nav = document.getElementById('sfNav');
    if (!nav) return { exists: false };
    const cs = window.getComputedStyle(nav.parentElement);
    return {
      exists: true,
      wrapPosition: cs.position,
      wrapZIndex: cs.zIndex,
      navHeight: Math.round(nav.getBoundingClientRect().height),
    };
  });
  if (!navState.exists) note(vp.name, 'errors', 'Nav', 'No #sfNav found');
  else if (navState.wrapPosition !== 'fixed') note(vp.name, 'warnings', 'Nav', `wrap not fixed (got ${navState.wrapPosition})`);

  // Scroll to trigger scrolled state
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.evaluate(() => new Promise(r => setTimeout(r, 350)));
  const scrolled = await page.evaluate(() => document.getElementById('sfNav').classList.contains('scrolled'));
  if (!scrolled) note(vp.name, 'warnings', 'Nav', '.scrolled class not added after 200px scroll');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise(r => setTimeout(r, 250)));

  // === 5. Mobile menu open/close — mobile viewports only ===
  if (vp.mobile && vp.w < 900) {
    const toggleVisible = await page.evaluate(() => {
      const t = document.getElementById('sfNavToggle');
      const cs = window.getComputedStyle(t);
      return cs.display !== 'none';
    });
    if (!toggleVisible) {
      note(vp.name, 'errors', 'MobileMenu', 'sfNavToggle not visible on mobile viewport');
    } else {
      await page.evaluate(() => document.getElementById('sfNavToggle').click());
      await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
      const openState = await page.evaluate(() => {
        const m = document.getElementById('sfMobileMenu');
        const cs = window.getComputedStyle(m);
        return { open: m.classList.contains('open'), visibility: cs.visibility, opacity: cs.opacity, bodyOverflow: document.body.style.overflow };
      });
      if (!openState.open) note(vp.name, 'errors', 'MobileMenu', 'Menu did not open on toggle click');
      if (openState.visibility !== 'visible') note(vp.name, 'errors', 'MobileMenu', `Menu visibility=${openState.visibility} after open`);
      if (openState.bodyOverflow !== 'hidden') note(vp.name, 'warnings', 'MobileMenu', `Body overflow=${openState.bodyOverflow} when menu open (background can scroll)`);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-menu-open.png`) });

      // Tap on a menu link, confirm it closes + scrolls
      const linkY = await page.evaluate(() => {
        const a = document.querySelector('.sf-mobile-menu a[href="#pricing"]');
        if (!a) return -1;
        a.click();
        return a.getBoundingClientRect().top;
      });
      await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
      const afterClick = await page.evaluate(() => ({
        open: document.getElementById('sfMobileMenu').classList.contains('open'),
        scrollY: window.scrollY,
        bodyOverflow: document.body.style.overflow,
      }));
      if (afterClick.open) note(vp.name, 'errors', 'MobileMenu', 'Menu did not close after link tap');
      if (afterClick.scrollY < 100) note(vp.name, 'errors', 'AnchorScroll', `Tap on #pricing link did not scroll page (scrollY=${afterClick.scrollY})`);
      if (afterClick.bodyOverflow === 'hidden') note(vp.name, 'errors', 'MobileMenu', 'Body overflow stuck on hidden after menu close');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    }
  }

  // === 6. Anchor link scroll for all in-page anchors ===
  const anchors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href^="#"]')).map(a => a.getAttribute('href')).filter(h => h && h.length > 1 && h !== '#');
  });
  const uniqueAnchors = [...new Set(anchors)];
  for (const href of uniqueAnchors) {
    const id = href.slice(1);
    const targetExists = await page.evaluate((i) => !!document.getElementById(i), id);
    if (!targetExists) note(vp.name, 'errors', 'AnchorTarget', `Anchor ${href} has no matching id`);
  }

  // === 7. Image loads from GHL CDN ===
  const imgIssues = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('img').forEach(img => {
      if (!img.complete) out.push({ src: img.src, reason: 'not loaded' });
      else if (img.naturalWidth === 0) out.push({ src: img.src, reason: 'naturalWidth=0' });
      if (!img.alt && !img.getAttribute('aria-hidden')) out.push({ src: img.src, reason: 'missing alt' });
    });
    return out;
  });
  imgIssues.forEach(i => note(vp.name, 'warnings', 'Image', i.reason, i.src));

  // === 8. Iframe checks (lazy load + scroll-trap risk) ===
  const iframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src,
      hasDataSrc: !!f.getAttribute('data-src'),
      title: f.title || '',
      width: Math.round(f.getBoundingClientRect().width),
      height: Math.round(f.getBoundingClientRect().height),
      minHeight: window.getComputedStyle(f).minHeight,
      scrolling: f.getAttribute('scrolling'),
    }));
  });
  iframes.forEach(f => {
    if (f.src && f.src !== 'about:blank' && !f.hasDataSrc) {
      // Eager iframe — flag but not necessarily an error (registration form is expected to load)
      note(vp.name, 'info', 'Iframe', `Eager-loaded iframe: ${f.title || f.src}`);
    }
    if (vp.mobile && f.height > 800) {
      note(vp.name, 'warnings', 'Iframe', `Iframe taller than 800px on mobile (${f.height}px) — potential scroll-trap`, f.title);
    }
    if (!f.title) note(vp.name, 'warnings', 'Iframe', 'Iframe missing title attribute');
  });

  // === 9. iOS-specific patterns ===
  const cssChecks = await page.evaluate(() => {
    const issues = [];
    // Check for 100vh on key sections
    document.querySelectorAll('section, header, .event-hero').forEach(el => {
      const cs = window.getComputedStyle(el);
      const minH = cs.minHeight;
      if (/100vh/.test(el.getAttribute('style') || '')) issues.push({ kind: '100vh-inline', tag: el.tagName, cls: el.className });
      // Heuristic: getComputedStyle resolves vh, so check the source rules via Stylesheet
    });
    // Backdrop-filter without -webkit prefix? hard to detect via getComputedStyle (already resolved). Skip.
    // viewport meta
    const vp = document.querySelector('meta[name="viewport"]');
    return { hundredVh: issues, viewport: vp ? vp.getAttribute('content') : null };
  });
  // Parse stylesheet text for 100vh, dvh, etc.
  const cssText = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    let all = '';
    sheets.forEach(s => {
      try {
        if (s.cssRules) Array.from(s.cssRules).forEach(r => { all += r.cssText + '\n'; });
      } catch (e) {}
    });
    return all;
  });
  if (/min-height\s*:\s*100vh/.test(cssText)) note(vp.name, 'warnings', 'iOS', 'min-height:100vh found in CSS — causes iOS Safari toolbar gap. Consider 100svh/100dvh.');
  if (cssChecks.viewport && !/maximum-scale/.test(cssChecks.viewport)) note(vp.name, 'info', 'Viewport', 'No maximum-scale in viewport meta (OK if no input zoom needed)');

  // === 10. Animation triggers — scroll through page, check no .anim stays opacity:0 in viewport ===
  if (vp.mobile) {
    const pageHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
    const stepSize = Math.floor(vp.h * 0.6);
    for (let y = 0; y < pageHeight; y += stepSize) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.evaluate(() => new Promise(r => setTimeout(r, 350)));
    }
    // After full scroll, every .anim that's been on-screen should have .in
    const stuckAnims = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.anim:not(.in)')).map(el => ({
        tag: el.tagName, cls: (el.className||'').slice(0,60), top: Math.round(el.getBoundingClientRect().top),
      }));
    });
    if (stuckAnims.length) {
      // It's normal for elements still below the fold to be uncovered; only flag if they were on screen
      note(vp.name, 'info', 'Anim', `${stuckAnims.length} .anim elements without .in after full scroll`);
    }
  }

  // === 11. Section-by-section visual capture for spot review ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise(r => setTimeout(r, 400)));
  const sections = ['about', 'pillars', 'schedule', 'pricing', 'venue', 'register'];
  for (const id of sections) {
    await page.evaluate((s) => {
      const el = document.getElementById(s);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));
    await page.screenshot({ path: path.join(OUT, `${vp.name}-${id}.png`) });
  }
  // Landscape orientation snapshot for mobile
  if (vp.mobile && vp.w < 900) {
    await page.setViewport({ width: vp.h, height: vp.w, deviceScaleFactor: vp.dsf, isMobile: true, hasTouch: true });
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    await page.screenshot({ path: path.join(OUT, `${vp.name}-landscape-hero.png`) });
  }

  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Auditing ${vp.name} (${vp.w}×${vp.h}) ===`);
    await runOnViewport(browser, vp);
    const r = REPORT.perViewport[vp.name] || { errors: [], warnings: [], info: [] };
    console.log(`  errors=${r.errors.length} warnings=${r.warnings.length} info=${r.info.length}`);
  }
  await browser.close();

  // Print full report
  console.log('\n\n========== FULL REPORT ==========\n');
  Object.entries(REPORT.perViewport).forEach(([vp, r]) => {
    console.log(`\n--- ${vp} ---`);
    ['errors', 'warnings', 'info'].forEach(level => {
      r[level].forEach(item => {
        console.log(`  [${level.toUpperCase().padEnd(8)}] ${item.category}: ${item.message}${item.detail ? ' | ' + item.detail : ''}`);
      });
    });
  });

  // JSON dump
  fs.writeFileSync(path.join(OUT, '_report.json'), JSON.stringify(REPORT, null, 2));
  console.log('\n\n📄 Report written to', path.join(OUT, '_report.json'));
  console.log('🖼  Screenshots in', OUT);
})().catch(e => { console.error(e); process.exit(1); });
