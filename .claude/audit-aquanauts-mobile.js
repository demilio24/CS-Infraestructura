const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const dir = 'F:/GitHub/Websites/.claude/screenshots/aquanauts';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const issues = { A: [], B: [] };

async function audit(label, url, page) {
  const v = label;
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));
  await new Promise(r => setTimeout(r, 600));

  // 1. Horizontal scroll check
  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (hScroll) issues[v].push('HORIZONTAL SCROLL detected on mobile (390px viewport)');

  // 2. Tap targets: links + buttons >= 36x36
  const tapIssues = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, input[type=submit]'));
    const small = els.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return (r.width < 36 || r.height < 36);
    });
    return small.slice(0, 8).map(el => ({
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 40),
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    }));
  });
  tapIssues.forEach(t => issues[v].push('Tap target small: <' + t.tag + '> "' + t.text + '" (' + t.w + 'x' + t.h + ')'));

  // 3. Font size audit
  const tinyText = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('p, li, span, div'));
    const tiny = [];
    els.forEach(el => {
      if (el.children.length > 0) return;
      const text = (el.textContent || '').trim();
      if (text.length < 5) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs > 0 && fs < 12) tiny.push({ text: text.slice(0, 50), size: fs });
    });
    return tiny.slice(0, 5);
  });
  tinyText.forEach(t => issues[v].push('Tiny text (' + t.size.toFixed(1) + 'px): "' + t.text + '"'));

  // 4. Programs filter
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#programs').offsetTop));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(dir, v + '-audit-programs-before.png') });
  const filterTest = await page.evaluate(() => {
    const adaptiveBtn = Array.from(document.querySelectorAll('.filter-btn[data-filter]')).find(b => b.dataset.filter === 'adaptive');
    if (!adaptiveBtn) return { error: 'No adaptive filter button found' };
    const beforeCount = document.querySelectorAll('.programs-grid .program-card:not(.hidden)').length;
    adaptiveBtn.click();
    return new Promise(r => setTimeout(() => {
      const afterCount = document.querySelectorAll('.programs-grid .program-card:not(.hidden)').length;
      r({ beforeCount, afterCount });
    }, 300));
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(dir, v + '-audit-programs-after-adaptive.png') });
  if (filterTest.error) issues[v].push('Programs filter: ' + filterTest.error);
  else if (filterTest.afterCount === 0) issues[v].push('Programs filter (adaptive): hides all cards');
  else if (filterTest.afterCount === filterTest.beforeCount) issues[v].push('Programs filter (adaptive): no cards filtered (' + filterTest.afterCount + ' still visible)');

  // 5. FAQ accordion
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#faq').offsetTop - 50));
  await new Promise(r => setTimeout(r, 500));
  const faqTest = await page.evaluate(() => {
    const q = document.querySelector('.faq-item:not(.hidden) .faq-q');
    if (!q) return { error: 'No FAQ question found' };
    q.click();
    return new Promise(r => setTimeout(() => r({ opened: document.querySelectorAll('.faq-item.open').length }), 350));
  });
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(dir, v + '-audit-faq-open.png') });
  if (faqTest.error) issues[v].push('FAQ: ' + faqTest.error);
  else if (faqTest.opened !== 1) issues[v].push('FAQ: expected 1 open, got ' + faqTest.opened);

  // 6. Mobile nav
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  const navTest = await page.evaluate(() => {
    const h = document.getElementById('hamburgerBtn');
    if (!h) return { error: 'No hamburger button' };
    if (getComputedStyle(h).display === 'none') return { error: 'Hamburger hidden on mobile' };
    h.click();
    return new Promise(r => setTimeout(() => {
      const m = document.getElementById('mobileMenu');
      r({ opened: m && m.classList.contains('open') });
    }, 500));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(dir, v + '-audit-mobile-nav-open.png') });
  if (navTest.error) issues[v].push('Nav: ' + navTest.error);
  else if (!navTest.opened) issues[v].push('Hamburger click did not open menu');
  await page.evaluate(() => document.getElementById('hamburgerBtn').click());
  await new Promise(r => setTimeout(r, 400));

  // 7. Form input font size (iOS zoom)
  const formTest = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('#ghl-form-placeholder input, #ghl-form-placeholder select'));
    const small = inputs.filter(i => parseFloat(getComputedStyle(i).fontSize) < 16);
    return { total: inputs.length, smallCount: small.length };
  });
  if (formTest.smallCount > 0) issues[v].push('Form inputs: ' + formTest.smallCount + '/' + formTest.total + ' fields <16px (iOS will zoom on focus)');

  // 8. Image loads after full scroll
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < h; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); }
    window.scrollTo(0, h);
    await new Promise(r => setTimeout(r, 800));
  });
  await new Promise(r => setTimeout(r, 1200));
  const imgStats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return {
      total: imgs.length,
      loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
      failed: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
    };
  });
  imgStats.failed.forEach(s => issues[v].push('Image failed: ' + s));
  if (imgStats.loaded < imgStats.total) issues[v].push(imgStats.loaded + '/' + imgStats.total + ' images loaded');
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const targets = [
    ['A', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home.html'],
    ['B', 'https://demilio24.github.io/Websites/Tristan_AquanautsAcademy/funnel/home-b.html'],
  ];
  for (const [label, url] of targets) {
    const p = await b.newPage();
    try { await audit(label, url, p); }
    catch (e) { issues[label].push('CRASHED: ' + e.message); }
    await p.close();
  }
  await b.close();

  console.log('\n=== MOBILE UI/UX AUDIT ===\n');
  for (const v of ['A', 'B']) {
    console.log('Variation ' + v + ': ' + (issues[v].length === 0 ? 'CLEAN' : issues[v].length + ' issue(s)'));
    issues[v].forEach(i => console.log('  - ' + i));
    console.log('');
  }
  fs.writeFileSync(path.join(dir, 'audit-summary.json'), JSON.stringify(issues, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
