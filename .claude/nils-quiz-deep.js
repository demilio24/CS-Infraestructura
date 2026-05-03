const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRAGMENT = fs.readFileSync(path.join(__dirname, '..', 'Nils', 'funnel', 'nils-quiz-fast-direct.html'), 'utf8');
const WRAPPER = fs.readFileSync(path.join(__dirname, 'nils-quiz-audit-wrap.html'), 'utf8');
const tmpPath = path.join(__dirname, 'nils-quiz-audit-tmp.html');
fs.writeFileSync(tmpPath, WRAPPER.replace('<!--FRAGMENT-->', FRAGMENT));

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 568 });
  await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // List small tap targets
  const small = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.width < 36 || r.height < 36) {
        out.push({
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 60),
          id: el.id,
          w: Math.round(r.width),
          h: Math.round(r.height),
          text: el.textContent.trim().slice(0, 30)
        });
      }
    });
    return out;
  });
  console.log('=== SMALL TAP TARGETS @ 320px ===');
  small.forEach(t => console.log(`  ${t.tag}#${t.id}.${t.cls}  ${t.w}x${t.h}  "${t.text}"`));

  // Detailed overflow scan at 320px
  const overflows = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.id === 'ghl-breakout' || el.tagName === 'HTML' || el.tagName === 'BODY') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > docW + 1 || r.left < -1) {
        out.push({
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 60),
          id: el.id,
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width)
        });
      }
    });
    return out.slice(0, 30);
  });
  console.log('\n=== OVERFLOW @ 320px ===');
  overflows.forEach(o => console.log(`  ${o.tag}#${o.id}.${o.cls}  l=${o.left} r=${o.right} w=${o.w}`));

  // Switch to 390px and test scroll-lock when lightbox opens
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 500));

  const beforeOpen = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    breakoutOverflow: document.getElementById('ghl-breakout') ? getComputedStyle(document.getElementById('ghl-breakout')).overflowY : null,
    breakoutScrollTop: document.getElementById('ghl-breakout')?.scrollTop
  }));
  console.log('\n=== BEFORE openLightbox ===');
  console.log(JSON.stringify(beforeOpen));

  await page.evaluate(() => window.openLightbox && window.openLightbox('https://example.com/x.png'));
  await new Promise(r => setTimeout(r, 500));

  const afterOpen = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    breakoutOverflow: document.getElementById('ghl-breakout') ? getComputedStyle(document.getElementById('ghl-breakout')).overflowY : null,
    breakoutScrollTop: document.getElementById('ghl-breakout')?.scrollTop,
    lightboxClasses: document.getElementById('img-lightbox')?.className
  }));
  console.log('=== AFTER openLightbox ===');
  console.log(JSON.stringify(afterOpen));

  // Test if background can be scrolled while lightbox is open
  const breakoutScrollableWhileOpen = await page.evaluate(() => {
    const b = document.getElementById('ghl-breakout');
    if (!b) return null;
    const before = b.scrollTop;
    b.scrollTop = 1000;
    const after = b.scrollTop;
    b.scrollTop = before; // restore
    return { before, after, canScroll: after !== before };
  });
  console.log('Breakout scroll test while lightbox open:', JSON.stringify(breakoutScrollableWhileOpen));

  // Inspect HVP button structure
  const hvpInfo = await page.evaluate(() => {
    const btns = document.querySelectorAll('.hvp-btn');
    return Array.from(btns).slice(0, 8).map(b => {
      const r = b.getBoundingClientRect();
      return { id: b.id, text: b.textContent.trim().slice(0, 20), aria: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) };
    });
  });
  console.log('\n=== HVP buttons @ 390px ===');
  hvpInfo.forEach(b => console.log(`  ${b.id || b.aria || b.text}  ${b.w}x${b.h}  l=${b.left} r=${b.right}`));

  // Test the calendar form_embed height behavior — load real GHL widget
  console.log('\n=== Calendar autosize test (mobile) ===');
  await page.evaluate(() => window.showCalendar && window.showCalendar());
  // wait long enough for form_embed.js to receive the resize message
  await new Promise(r => setTimeout(r, 6000));
  const calAfter = await page.evaluate(() => {
    const f = document.getElementById('quiz-cal-iframe');
    return f ? { h: f.offsetHeight, styleH: f.style.height, src: f.src.slice(0, 80) } : null;
  });
  console.log('Calendar after wait:', JSON.stringify(calAfter));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
