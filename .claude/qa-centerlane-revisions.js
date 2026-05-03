const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, 'screenshots', 'centerlane-revisions');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URL = 'http://127.0.0.1:8765/Josie-David_CenterLaneSwim/home.html';

const sections = [
  { name: 'hero',         selector: '.hero, #about', scrollTo: 'top' },
  { name: 'trust-strip',  anchorText: 'Best of Annapolis 2025' },
  { name: 'why-us',       selector: '#about' },
  { name: 'programs',     selector: '#programs' },
  { name: 'locations',    selector: '#locations' },
  { name: 'communities',  anchorText: 'Communities We Serve' },
  { name: 'events',       selector: '#events' },
  { name: 'faq',          selector: '#faq' },
  { name: 'cta',          anchorText: 'Come And Swim With Us' },
  { name: 'footer',       selector: 'footer' },
];

async function scrollToText(page, txt) {
  await page.evaluate((t) => {
    const nodes = Array.from(document.body.querySelectorAll('*')).filter(el => el.children.length === 0 || Array.from(el.childNodes).some(n => n.nodeType === 3));
    const hit = nodes.find(el => el.textContent && el.textContent.includes(t));
    if (hit) hit.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, txt);
}

async function runViewport(browser, label, width, height, isMobile) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile, hasTouch: isMobile, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  // Full-page screenshot
  await page.screenshot({ path: path.join(OUT_DIR, `${label}-full.png`), fullPage: true });
  console.log(`[${label}] full-page captured`);

  // Section screenshots
  for (const s of sections) {
    try {
      if (s.scrollTo === 'top') {
        await page.evaluate(() => window.scrollTo(0, 0));
      } else if (s.anchorText) {
        await scrollToText(page, s.anchorText);
      } else if (s.selector) {
        await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), s.selector);
      }
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(OUT_DIR, `${label}-${s.name}.png`) });
      console.log(`[${label}] ${s.name} captured`);
    } catch (e) {
      console.warn(`[${label}] ${s.name} FAILED: ${e.message}`);
    }
  }

  // Click FAQ tab "Other" to verify the new 'not-a-fit' question appears
  if (!isMobile) {
    try {
      await page.evaluate(() => document.querySelector('#faq')?.scrollIntoView({ block: 'start' }));
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('.faq-tab')).find(b => b.textContent.trim() === 'Other');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUT_DIR, `${label}-faq-other-tab.png`) });
      console.log(`[${label}] faq-other-tab captured`);
    } catch (e) {
      console.warn(`[${label}] faq-other-tab FAILED: ${e.message}`);
    }
  }

  // Content assertions
  const findings = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasSabrina: /Sabrina Park/i.test(text),
      hasSevernaPark: /Severna Park/i.test(text),
      hasCompetitiveSwimmers: /advanced competitive swimmers/i.test(text),
      hasStrokeDevelopment: /stroke-development swimmers ready to graduate/i.test(text),
      has7000: /7,000\+/.test(text),
      hasBestOfAnnapolis25: /Best of Annapolis 2025/.test(text),
      hasBestOfAnnapolis26: /Best of Annapolis 2026/.test(text),
      hasUSSSA: /USSSA/.test(text),
      hasISSSA: /ISSSA/.test(text),
      hasLiveWater: /Live Water Foundation/.test(text),
      hasEWPhone: /410-888-7946/.test(text),
      hasCalvertPhone: /410-881-7946/.test(text),
      hasFlatIronPhone: /410-921-7946/.test(text),
      hasSPEmail: /sp@centerlaneswim\.com/.test(text),
      hasMobileLessons: /In-Home Mobile Lessons/.test(text),
      has39Pricing: /\$39/.test(text),
      has57Pricing: /\$57/.test(text),
      has87Pricing: /\$87/.test(text),
      has44Pricing: /\$44/.test(text),
      has575Pricing: /\$575/.test(text),
      hasNoFloaties: /no floaties or flippers/i.test(text),
      hasHumpGuarantee: /Hump Guarantee/i.test(text),
      hasAdaptive: /Adaptive lessons/i.test(text),
      hasCommunities: /Communities We Serve/i.test(text),
      hasParentTeacherClass: /Parent Teacher Class/.test(text),
      hasParentTotCombo: /Parent-Tot Combo/.test(text),
      hasInfantInLevels: /Infant Acclimation.*3.*6 months.*FREE/s.test(text),
      hasGoogleRating: /Google Rating/i.test(text),
      hasReviewsStat: /5.*Reviews/.test(text),
      hasNotAFit: /not a good fit/i.test(text),
      hasInstagram: !!document.querySelector('a[href*="instagram.com/centerlaneswim"]'),
      hasTikTok: !!document.querySelector('a[href*="tiktok.com/@centerlaneswim"]'),
      hsptStatCount: document.querySelectorAll('.hsp-stat').length,
      eventCardCount: document.querySelectorAll('.event-card').length,
      locCardCount: document.querySelectorAll('.loc-card').length,
      aboutBulletCount: document.querySelectorAll('.about-list li').length,
    };
  });

  await page.close();
  return findings;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const desktop = await runViewport(browser, 'desktop', 1440, 900, false);
    const mobile  = await runViewport(browser, 'mobile',  390, 844, true);

    console.log('\n=== DESKTOP FINDINGS ===');
    console.log(JSON.stringify(desktop, null, 2));
    console.log('\n=== MOBILE FINDINGS ===');
    console.log(JSON.stringify(mobile, null, 2));

    // Assertions
    const fails = [];
    const checks = [
      ['Sabrina removed', !desktop.hasSabrina],
      ['Severna Park present', desktop.hasSevernaPark],
      ['No "advanced competitive swimmers"', !desktop.hasCompetitiveSwimmers],
      ['Stroke-development phrasing present', desktop.hasStrokeDevelopment],
      ['7,000+ stat present', desktop.has7000],
      ['Best of Annapolis 2025', desktop.hasBestOfAnnapolis25],
      ['Best of Annapolis 2026', desktop.hasBestOfAnnapolis26],
      ['USSSA', desktop.hasUSSSA],
      ['ISSSA', desktop.hasISSSA],
      ['Live Water Foundation', desktop.hasLiveWater],
      ['EW phone', desktop.hasEWPhone],
      ['Calvert phone', desktop.hasCalvertPhone],
      ['Flat Iron phone', desktop.hasFlatIronPhone],
      ['SP email', desktop.hasSPEmail],
      ['Mobile Lessons card', desktop.hasMobileLessons],
      ['$39 pricing', desktop.has39Pricing],
      ['$57 pricing', desktop.has57Pricing],
      ['$87 pricing', desktop.has87Pricing],
      ['$44 mobile lessons price', desktop.has44Pricing],
      ['$575 parties price', desktop.has575Pricing],
      ['No floaties bullet', desktop.hasNoFloaties],
      ['Hump Guarantee bullet', desktop.hasHumpGuarantee],
      ['Adaptive lessons bullet', desktop.hasAdaptive],
      ['Communities strip', desktop.hasCommunities],
      ['Parent Teacher Class naming', desktop.hasParentTeacherClass],
      ['No "Parent-Tot Combo" naming', !desktop.hasParentTotCombo],
      ['Infant in FAQ level guide', desktop.hasInfantInLevels],
      ['Google Rating replaced with Reviews', !desktop.hasGoogleRating && desktop.hasReviewsStat],
      ['"Not a good fit" FAQ', desktop.hasNotAFit],
      ['Instagram link', desktop.hasInstagram],
      ['TikTok link', desktop.hasTikTok],
      ['4 hero stats', desktop.hsptStatCount === 4],
      ['4 event cards', desktop.eventCardCount === 4],
      ['4 location cards', desktop.locCardCount === 4],
      ['>=7 about bullets', desktop.aboutBulletCount >= 7],
    ];
    console.log('\n=== ASSERTION RESULTS ===');
    for (const [label, pass] of checks) {
      console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
      if (!pass) fails.push(label);
    }
    console.log(`\n${fails.length === 0 ? 'ALL CHECKS PASSED' : `${fails.length} FAILURE(S):`}`);
    if (fails.length) fails.forEach(f => console.log('  - ' + f));
  } finally {
    await browser.close();
  }
})();
