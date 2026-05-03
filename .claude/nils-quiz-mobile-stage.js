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
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Test mobile path
  const before = await page.evaluate(() => {
    const stage = document.getElementById('mobile-cal-stage');
    const iframe = document.getElementById('mobile-cal-iframe');
    return {
      stageExists: !!stage,
      stageDisplay: stage ? getComputedStyle(stage).display : null,
      iframeExists: !!iframe,
      iframeSrc: iframe ? iframe.src : null,
    };
  });
  console.log('BEFORE showCalendar:', JSON.stringify(before, null, 2));

  await page.evaluate(() => window.showCalendar && window.showCalendar());
  await new Promise(r => setTimeout(r, 1500));

  const after = await page.evaluate(() => {
    const stage = document.getElementById('mobile-cal-stage');
    const iframe = document.getElementById('mobile-cal-iframe');
    const breakout = document.getElementById('ghl-breakout');
    const stageRect = stage ? stage.getBoundingClientRect() : null;
    return {
      stageDisplay: stage ? getComputedStyle(stage).display : null,
      stageOverflow: stage ? getComputedStyle(stage).overflowY : null,
      stagePosition: stage ? getComputedStyle(stage).position : null,
      stageRect: stageRect ? { x: stageRect.x, y: stageRect.y, w: stageRect.width, h: stageRect.height } : null,
      stageZ: stage ? getComputedStyle(stage).zIndex : null,
      iframeSrc: iframe ? iframe.src : null,
      iframeWidth: iframe ? iframe.offsetWidth : null,
      iframeHeight: iframe ? iframe.offsetHeight : null,
      breakoutOverflow: breakout ? breakout.style.overflow : null,
      breakoutOverflowComputed: breakout ? getComputedStyle(breakout).overflowY : null,
    };
  });
  console.log('AFTER showCalendar:', JSON.stringify(after, null, 2));

  // Screenshot
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'audit-390-mobile-cal-stage.png'), fullPage: false });

  // Test scroll: only one scroll container should be active
  const scrollTest = await page.evaluate(() => {
    const stage = document.getElementById('mobile-cal-stage');
    const breakout = document.getElementById('ghl-breakout');
    if (!stage) return null;
    const stageBefore = stage.scrollTop;
    stage.scrollTop = 500;
    const stageAfter = stage.scrollTop;
    const breakoutBefore = breakout.scrollTop;
    breakout.scrollTop = 500;
    const breakoutAfter = breakout.scrollTop;
    return {
      stageBefore, stageAfter, stageScrolled: stageAfter > stageBefore,
      breakoutBefore, breakoutAfter, breakoutScrolled: breakoutAfter > breakoutBefore,
    };
  });
  console.log('Scroll test:', JSON.stringify(scrollTest, null, 2));

  // Test desktop path also works (1280px)
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => window.showCalendar && window.showCalendar());
  await new Promise(r => setTimeout(r, 1000));
  const desktop = await page.evaluate(() => {
    const stage = document.getElementById('mobile-cal-stage');
    const card = document.getElementById('quiz-card');
    const sc = document.getElementById('scalendar');
    return {
      stageDisplay: stage ? getComputedStyle(stage).display : null,
      cardClass: card ? card.className : null,
      scalendarDisplay: sc ? getComputedStyle(sc).display : null,
    };
  });
  console.log('Desktop showCalendar:', JSON.stringify(desktop, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
