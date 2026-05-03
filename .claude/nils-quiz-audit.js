const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRAGMENT = fs.readFileSync(path.join(__dirname, '..', 'Nils', 'funnel', 'nils-quiz-fast-direct.html'), 'utf8');
const WRAPPER = fs.readFileSync(path.join(__dirname, 'nils-quiz-audit-wrap.html'), 'utf8');
const fullHtml = WRAPPER.replace('<!--FRAGMENT-->', FRAGMENT);
const tmpPath = path.join(__dirname, 'nils-quiz-audit-tmp.html');
fs.writeFileSync(tmpPath, fullHtml);

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

  const errors = [];
  const failed = [];

  async function run(viewport, label) {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`[${label}] CONSOLE: ${msg.text()}`);
    });
    page.on('pageerror', err => errors.push(`[${label}] PAGEERROR: ${err.message}`));
    page.on('requestfailed', req => {
      const url = req.url();
      // Ignore expected file:// 404s for noscript fonts and ABOUT:BLANK iframes
      if (url.startsWith('about:')) return;
      failed.push(`[${label}] FAILED: ${url} (${req.failure()?.errorText})`);
    });

    await page.setViewport(viewport);
    await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
      errors.push(`[${label}] LOAD: ${e.message}`);
    });
    await new Promise(r => setTimeout(r, 1500));

    const audit = await page.evaluate(() => {
      const issues = [];
      const docWidth = document.documentElement.clientWidth;

      // Duplicate IDs
      const ids = {};
      document.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; });
      Object.entries(ids).filter(([, v]) => v > 1).forEach(([id, n]) => issues.push(`DUPLICATE ID #${id} (x${n})`));

      // Empty href / broken anchors
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === '' || href === '#') {
          issues.push(`EMPTY/HASH HREF on <a>: "${a.textContent.trim().slice(0, 40)}"`);
        }
        if (href && href.startsWith('#') && href.length > 1) {
          if (!document.getElementById(href.slice(1))) {
            issues.push(`BROKEN ANCHOR: ${href} -> "${a.textContent.trim().slice(0, 40)}"`);
          }
        }
      });

      // Buttons without onclick AND without form submit AND without surrounding <a>
      document.querySelectorAll('button').forEach(b => {
        const hasClick = b.hasAttribute('onclick') || b.closest('a') || b.type === 'submit' || b.id;
        if (!hasClick && !b.className) {
          issues.push(`BUTTON no handler: "${b.textContent.trim().slice(0, 30)}"`);
        }
      });

      // Horizontal overflow at this viewport
      const overflows = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.id === 'ghl-breakout' || el.tagName === 'HTML' || el.tagName === 'BODY') return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return;
        if (rect.right > docWidth + 1) {
          // Skip elements whose parent already overflows (cascading reports are noise)
          const parent = el.parentElement;
          if (parent && parent.getBoundingClientRect().right > docWidth + 1) return;
          overflows.push(`${el.tagName}.${(el.className || '').toString().slice(0, 60)} right=${Math.round(rect.right)}/${docWidth}`);
        }
      });
      overflows.slice(0, 10).forEach(o => issues.push('HORIZ OVERFLOW: ' + o));

      // Multiple H1s
      const h1s = document.querySelectorAll('h1');
      if (h1s.length > 1) issues.push(`MULTIPLE H1s: ${h1s.length}`);
      if (h1s.length === 0) issues.push('NO H1');

      // Images without alt
      let imgsNoAlt = 0;
      document.querySelectorAll('img').forEach(img => { if (!img.alt) imgsNoAlt++; });
      if (imgsNoAlt > 0) issues.push(`IMGS WITHOUT ALT: ${imgsNoAlt}`);

      // Iframes
      document.querySelectorAll('iframe').forEach(f => {
        const src = f.getAttribute('src') || '';
        const lazy = src === '' || src === 'about:blank' || f.hasAttribute('data-src');
        const id = f.id || f.className.toString().slice(0, 30);
        issues.push(`IFRAME ${id}: src="${src.slice(0, 60)}" lazy=${lazy}`);
      });

      // Fixed-position elements inside scrollable containers (iOS quirk)
      document.querySelectorAll('*').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') {
          let p = el.parentElement;
          while (p && p.tagName !== 'BODY' && p.tagName !== 'HTML') {
            const pcs = getComputedStyle(p);
            if (/(auto|scroll)/.test(pcs.overflowY) || /(auto|scroll)/.test(pcs.overflow)) {
              issues.push(`POS:FIXED inside scroll container (iOS bug risk): ${el.tagName}.${(el.className || '').toString().slice(0, 40)} inside ${p.tagName}.${(p.className || '').toString().slice(0, 40)}`);
              break;
            }
            p = p.parentElement;
          }
        }
      });

      // 100vh usage on full-height layouts (iOS toolbar bug)
      const stylesheets = Array.from(document.styleSheets);
      let vhUses = 0;
      try {
        stylesheets.forEach(ss => {
          try {
            (ss.cssRules || []).forEach(rule => {
              if (rule.style && /\b100vh\b/.test(rule.cssText)) vhUses++;
            });
          } catch (e) { /* cross-origin stylesheet */ }
        });
      } catch (e) {}
      if (vhUses > 0) issues.push(`100vh usages in CSS: ${vhUses} (consider 100dvh)`);

      // Tap target sizes (mobile only)
      if (docWidth <= 480) {
        let smallTargets = 0;
        document.querySelectorAll('button, a, [role="button"]').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          if (rect.width < 36 || rect.height < 36) smallTargets++;
        });
        if (smallTargets > 0) issues.push(`SMALL TAP TARGETS (<36px): ${smallTargets}`);
      }

      // Modal closed-state visibility (look for #img-lightbox specifically)
      const lightbox = document.getElementById('img-lightbox');
      if (lightbox) {
        const cs = getComputedStyle(lightbox);
        issues.push(`LIGHTBOX initial state: display=${cs.display} visibility=${cs.visibility} opacity=${cs.opacity}`);
      }

      // Calendar iframe state
      const calIframe = document.getElementById('quiz-cal-iframe');
      if (calIframe) {
        issues.push(`CALENDAR iframe initial: src="${calIframe.src.slice(0, 50)}" h=${calIframe.offsetHeight}px`);
      }

      // Inline scripts/style stats
      issues.push(`INLINE STYLES (style="..."): ${document.querySelectorAll('[style]').length}`);
      issues.push(`INLINE SCRIPT BLOCKS: ${document.querySelectorAll('script:not([src])').length}`);
      issues.push(`STYLE BLOCKS: ${document.querySelectorAll('style').length}`);
      issues.push(`TOTAL DOM NODES: ${document.querySelectorAll('*').length}`);

      return issues;
    });

    console.log(`\n===== ${label} (${viewport.width}x${viewport.height}) =====`);
    audit.forEach(i => console.log('  ' + i));

    // Try clicking through quiz to trigger calendar
    if (label === 'mobile') {
      try {
        await page.evaluate(() => {
          // simulate quiz completion: click first option of each step
          const steps = ['step-1','step-2','step-3','step-4'];
          // We can't easily walk through; just call showCalendar directly
          if (typeof window.showCalendar === 'function') window.showCalendar();
        });
        await new Promise(r => setTimeout(r, 1500));
        const calState = await page.evaluate(() => {
          const calIframe = document.getElementById('quiz-cal-iframe');
          const card = document.getElementById('quiz-card');
          const sc = document.getElementById('scalendar');
          return {
            iframeSrc: calIframe ? calIframe.src : null,
            iframeHeight: calIframe ? calIframe.offsetHeight : null,
            cardClass: card ? card.className : null,
            scalendarDisplay: sc ? getComputedStyle(sc).display : null,
            scalendarHeight: sc ? sc.offsetHeight : null
          };
        });
        console.log('  AFTER showCalendar():', JSON.stringify(calState));
        await page.screenshot({ path: path.join(__dirname, 'screenshots', `audit-${label}-calendar.png`), fullPage: false });
      } catch (e) {
        console.log('  showCalendar test failed: ' + e.message);
      }

      // Try clicking the lightbox open
      try {
        await page.evaluate(() => {
          if (typeof window.openLightbox === 'function') window.openLightbox('https://images.leadconnectorhq.com/test.png');
        });
        await new Promise(r => setTimeout(r, 500));
        const lbState = await page.evaluate(() => {
          const lb = document.getElementById('img-lightbox');
          return lb ? { display: getComputedStyle(lb).display, visibility: getComputedStyle(lb).visibility, classList: lb.className, bodyOverflow: document.body.style.overflow } : null;
        });
        console.log('  AFTER openLightbox:', JSON.stringify(lbState));
      } catch (e) {
        console.log('  openLightbox test failed: ' + e.message);
      }
    }

    await page.close();
  }

  await run({ width: 1440, height: 900 }, 'desktop');
  await run({ width: 390, height: 844 }, 'mobile');
  await run({ width: 320, height: 568 }, 'mobile-tiny');

  console.log('\n===== ERRORS =====');
  errors.slice(0, 30).forEach(e => console.log(e));
  console.log('\n===== FAILED REQUESTS =====');
  failed.slice(0, 20).forEach(f => console.log(f));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
