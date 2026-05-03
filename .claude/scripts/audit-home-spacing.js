// Comprehensive spacing audit of the home page — desktop + mobile.
// Outputs a comparison table of section padding, gaps between sections,
// and gaps between elements within each section.
const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

async function audit(browser, w, h, label) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('vp', 'home');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-home').classList.add('active');
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 800));

  const data = await page.evaluate(() => {
    const pick = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        sel,
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
        height: Math.round(r.height),
        padTop: parseInt(cs.paddingTop) || 0,
        padBot: parseInt(cs.paddingBottom) || 0,
        marTop: parseInt(cs.marginTop) || 0,
        marBot: parseInt(cs.marginBottom) || 0,
      };
    };

    const sections = {
      hero: pick('section.hero'),
      monogram: pick('#page-home > section.monogram'),
      statement: pick('section.statement'),
      stmtH1: pick('section.statement h1'),
      stmtBody: pick('section.statement .body'),
      stmtCta: pick('section.statement .cta-wrap'),
      workSection: pick('section.work-section'),
      workHead: pick('.work-section .section-head'),
      workH2: pick('.work-section .section-head h2'),
      workLede: pick('.work-section .section-head .lede'),
      workStack: pick('.work-stack'),
      workFoot: pick('.section-foot'),
      workCta: pick('.section-foot .cta'),
      editorial: pick('section.editorial'),
      edH3: pick('section.editorial h3'),
      edP: pick('section.editorial p'),
      edImg: pick('section.editorial .img'),
      testimoniesSection: pick('section.testimonies-section'),
      testimoniesHead: pick('.testimonies-head'),
      testimoniesH2: pick('.testimonies-head h2'),
      testimony: pick('.testimonies .t blockquote'),
      finalcta: pick('section.finalcta'),
      finalH2: pick('section.finalcta h2'),
      finalP: pick('section.finalcta p'),
      finalCta: pick('section.finalcta .cta'),
      footer: pick('footer'),
    };

    return sections;
  });

  // Build a comparison report
  const rows = [];
  const log = (...args) => rows.push(args.join('\t'));
  const gap = (a, b) => (a && b) ? `${b.top - a.bottom}px` : 'n/a';

  log('=== ' + label + ' ===');
  log('');
  log('SECTIONS — padding (top/bottom) | height');
  log('-----------------------------------------');
  ['hero', 'monogram', 'statement', 'workSection', 'editorial', 'testimoniesSection', 'finalcta', 'footer'].forEach(k => {
    const s = data[k];
    if (s) log(k.padEnd(20), `pad ${s.padTop}/${s.padBot}`.padEnd(14), `h ${s.height}`);
  });
  log('');
  log('GAPS BETWEEN ADJACENT SECTIONS (section.bottom → next section.top)');
  log('-----------------------------------------');
  const flow = ['hero','monogram','statement','workSection','editorial','testimoniesSection','finalcta','footer'];
  for (let i = 0; i < flow.length - 1; i++) {
    const a = data[flow[i]], b = data[flow[i+1]];
    log(`${flow[i]} → ${flow[i+1]}`.padEnd(40), gap(a, b));
  }
  log('');
  log('STATEMENT INTERNAL — h1 → body → CTA');
  log('-----------------------------------------');
  log('h1 → body', gap(data.stmtH1, data.stmtBody));
  log('body → cta', gap(data.stmtBody, data.stmtCta));
  log('cta → section bottom', `${data.statement.bottom - data.stmtCta.bottom}px`);
  log('section.top → h1.top', `${data.stmtH1.top - data.statement.top}px`);
  log('');
  log('WORK SECTION INTERNAL');
  log('-----------------------------------------');
  log('section.top → h2.top', `${data.workH2.top - data.workSection.top}px`);
  log('h2 → lede', gap(data.workH2, data.workLede));
  log('lede → work-stack', gap(data.workLede, data.workStack));
  log('work-stack → section-foot', gap(data.workStack, data.workFoot));
  log('section-foot → section.bottom', `${data.workSection.bottom - data.workFoot.bottom}px`);
  log('');
  log('EDITORIAL INTERNAL');
  log('-----------------------------------------');
  log('section.top → h3.top', `${data.edH3.top - data.editorial.top}px`);
  log('h3 → first p', gap(data.edH3, data.edP));
  log('');
  log('TESTIMONIES INTERNAL');
  log('-----------------------------------------');
  log('section.top → head.top', `${data.testimoniesHead.top - data.testimoniesSection.top}px`);
  log('head → first quote', gap(data.testimoniesHead, data.testimony));
  log('');
  log('FINAL CTA INTERNAL');
  log('-----------------------------------------');
  log('section.top → h2.top', `${data.finalH2.top - data.finalcta.top}px`);
  log('h2 → paragraph', gap(data.finalH2, data.finalP));
  log('paragraph → cta', `${data.finalCta.top - data.finalP.bottom}px`);
  log('cta → section.bottom', `${data.finalcta.bottom - data.finalCta.bottom}px`);
  log('');

  console.log(rows.join('\n'));
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  await audit(browser, 1440, 900, 'DESKTOP (1440x900)');
  console.log('\n\n');
  await audit(browser, 390, 844, 'MOBILE (390x844)');
  await browser.close();
})();
