const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  
  const errors = [], warnings = [], requests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  page.on('requestfailed', req => requests.push('FAILED: ' + req.url() + ' - ' + req.failure().errorText));
  
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///f:/GitHub/CS-Infraestructura/Nils/funnel/vsl.html', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  const audit = await page.evaluate(() => {
    const issues = [];

    // 1. Duplicate IDs
    const ids = {};
    document.querySelectorAll('[id]').forEach(el => {
      ids[el.id] = (ids[el.id] || 0) + 1;
    });
    Object.entries(ids).filter(([,v]) => v > 1).forEach(([id]) => issues.push('DUPLICATE ID: #' + id));

    // 2. Images with no src or broken
    document.querySelectorAll('img').forEach(img => {
      if (!img.src) issues.push('IMG NO SRC: ' + img.outerHTML.slice(0, 80));
      if (!img.alt) issues.push('IMG NO ALT: ' + (img.src || '').slice(-50));
      if (!img.complete || img.naturalWidth === 0) issues.push('IMG BROKEN: ' + img.src.slice(-60));
    });

    // 3. Empty href links
    document.querySelectorAll('a').forEach(a => {
      if (!a.href || a.href === window.location.href + '#' || a.href.endsWith('#')) {
        issues.push('EMPTY LINK: ' + a.textContent.trim().slice(0, 40));
      }
    });

    // 4. Multiple H1s
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) issues.push('MULTIPLE H1s: ' + h1s.length + ' found');
    if (h1s.length === 0) issues.push('NO H1 found');

    // 5. Check for duplicate script blocks
    const scripts = document.querySelectorAll('script:not([src]):not([type])');
    issues.push('INLINE SCRIPT BLOCKS: ' + scripts.length);

    // 6. Check for duplicate style blocks
    const styles = document.querySelectorAll('style');
    if (styles.length > 1) issues.push('MULTIPLE STYLE BLOCKS: ' + styles.length);

    // 7. Check IntersectionObserver duplicates
    // Can't easily check this, but check for .anim elements
    const animEls = document.querySelectorAll('.anim');
    issues.push('ANIM ELEMENTS: ' + animEls.length);

    // 8. Check for oversized inline styles / potential overrides
    let inlineStyleCount = 0;
    document.querySelectorAll('[style]').forEach(el => {
      inlineStyleCount++;
    });
    issues.push('ELEMENTS WITH INLINE STYLE: ' + inlineStyleCount);

    // 9. Videos without preload
    document.querySelectorAll('video').forEach((v, i) => {
      if (!v.preload || v.preload === 'auto') issues.push('VIDEO ' + i + ' preload=auto (heavy): ' + (v.src || 'no src').slice(-50));
      if (!v.src && !v.querySelector('source')) issues.push('VIDEO ' + i + ': no src or source');
    });

    // 10. Check meta tags
    if (!document.querySelector('meta[name="description"]')) issues.push('MISSING: meta description');
    if (!document.querySelector('meta[property="og:title"]')) issues.push('MISSING: og:title');
    if (!document.querySelector('title')) issues.push('MISSING: title tag');

    // 11. Scroll-behavior: smooth (can cause perf issues)
    const htmlStyle = window.getComputedStyle(document.documentElement);
    if (htmlStyle.scrollBehavior === 'smooth') issues.push('PERF: scroll-behavior:smooth on html (can slow programmatic scrolls)');

    // 12. Check for font imports
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis"]');
    issues.push('GOOGLE FONT LINKS: ' + fontLinks.length);

    // 13. Count total DOM nodes (perf indicator)
    issues.push('TOTAL DOM NODES: ' + document.querySelectorAll('*').length);

    // 14. Count event listeners can't be done in evaluate easily
    // But check for any elements with onclick
    const onclickEls = document.querySelectorAll('[onclick]');
    if (onclickEls.length > 0) issues.push('INLINE ONCLICK HANDLERS: ' + onclickEls.length);

    // 15. Check for any proof-border-glow on absolutely positioned elements
    const glowEls = document.querySelectorAll('.proof-border-glow');
    glowEls.forEach((g, i) => {
      const parent = g.parentElement;
      const ps = window.getComputedStyle(parent).position;
      if (ps === 'absolute') {
        issues.push('GLOW ON ABSOLUTE PARENT: ' + (parent.className || parent.id));
      }
    });

    return issues;
  });

  console.log('\n=== JS ERRORS ===');
  errors.forEach(e => console.log(e));
  console.log('\n=== FAILED REQUESTS ===');
  requests.forEach(r => console.log(r));
  console.log('\n=== PAGE AUDIT ===');
  audit.forEach(a => console.log(a));

  await browser.close();
})().catch(e => console.error(e));
