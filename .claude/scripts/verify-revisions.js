var puppeteer = require('puppeteer');

var MOCK_FORM = '<div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:20px 12px"><div style="margin-bottom:12px"><label style="display:block;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:3px">Name *</label><input style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;height:40px;color:#fff;padding:0 12px;font-size:14px" value="Jane Smith"></div><div style="margin-bottom:12px"><label style="display:block;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:3px">Phone *</label><input style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;height:40px;color:#fff;padding:0 12px;font-size:14px" value="(312) 555-0199"></div><div style="margin-bottom:12px"><label style="display:block;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:3px">Email *</label><input style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;height:40px;color:#fff;padding:0 12px;font-size:14px" value="jane@example.com"></div><div style="margin-bottom:12px"><label style="display:block;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:3px">Project Type *</label><div style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;height:40px;color:rgba(255,255,255,0.7);padding:10px 12px;font-size:14px">Full Home Remodel</div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px"><span style="font-size:12px;color:rgba(255,255,255,0.4)">1 of 3</span><div style="background:#9a6d1f;color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600">NEXT &rarr;</div></div></div>';

async function run() {
  var browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  var page = await browser.newPage();

  // ===== MOBILE =====
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8899/Mandy_VeLUS_Design/home-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(function(r) { setTimeout(r, 4000); });
  await page.evaluate(function() { document.querySelectorAll('.anim').forEach(function(el) { el.classList.add('anim-visible'); }); });
  await page.evaluate(function(html) { var c = document.querySelector('.hero-form-card'); if (c) c.innerHTML = html; }, MOCK_FORM);
  await new Promise(function(r) { setTimeout(r, 300); });

  // Checks
  var checks = await page.evaluate(function() {
    var cs = getComputedStyle;
    var r = {};
    r['1a_textAlign'] = cs(document.querySelector('.hero-content')).textAlign;
    r['1a_heroLeftAlign'] = cs(document.querySelector('.hero-left')).alignItems;
    r['1b_h1Size'] = cs(document.querySelector('.hero h1')).fontSize;
    var fc = document.querySelector('.hero-form-card');
    r['2a_formPadding'] = cs(fc).paddingLeft + ' / ' + cs(fc).paddingRight;
    r['2a_formMargin'] = cs(fc).marginLeft + ' / ' + cs(fc).marginRight;
    r['2b_viewport'] = document.querySelector('meta[name=viewport]').content;
    r['3_quoteCardExists'] = !!document.querySelector('.about-quote-card');
    r['3_quoteTextInDOM'] = document.body.innerHTML.includes('This is not decoration');
    r['4_serviceNumColor'] = cs(document.querySelector('.service-number')).color;
    return r;
  });

  console.log('\n===== REVISION CHECKS (375px mobile) =====');
  console.log('1a Hero text-align:', checks['1a_textAlign'], checks['1a_textAlign'] === 'center' ? 'PASS' : 'FAIL');
  console.log('1a Hero-left align-items:', checks['1a_heroLeftAlign'], checks['1a_heroLeftAlign'] === 'center' ? 'PASS' : 'FAIL');
  console.log('1b Hero h1 size:', checks['1b_h1Size'], parseInt(checks['1b_h1Size']) >= 34 ? 'PASS' : 'FAIL');
  console.log('2a Form padding:', checks['2a_formPadding']);
  console.log('2a Form margin:', checks['2a_formMargin']);
  console.log('2b Viewport:', checks['2b_viewport'], checks['2b_viewport'].includes('maximum-scale=1') ? 'PASS' : 'FAIL');
  console.log('3  Quote card removed:', !checks['3_quoteCardExists'] ? 'PASS' : 'FAIL');
  console.log('3  Quote text removed:', !checks['3_quoteTextInDOM'] ? 'PASS' : 'FAIL');
  console.log('4  Service number color:', checks['4_serviceNumColor']);

  // Mobile screenshots
  await page.screenshot({ path: 'screenshots/vf-hero-375.png', clip: { x: 0, y: 0, width: 375, height: 812 } });
  var aboutY = await page.evaluate(function() { return document.getElementById('about').getBoundingClientRect().top + window.scrollY; });
  await page.screenshot({ path: 'screenshots/vf-about-375.png', clip: { x: 0, y: aboutY, width: 375, height: 600 } });
  var servY = await page.evaluate(function() { return document.getElementById('services').getBoundingClientRect().top + window.scrollY; });
  await page.screenshot({ path: 'screenshots/vf-services-375.png', clip: { x: 0, y: servY + 80, width: 375, height: 500 } });

  // ===== DESKTOP =====
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899/Mandy_VeLUS_Design/home-v2.html', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(function(r) { setTimeout(r, 4000); });
  await page.evaluate(function() { document.querySelectorAll('.anim').forEach(function(el) { el.classList.add('anim-visible'); }); });
  await page.evaluate(function(html) { var c = document.querySelector('.hero-form-card'); if (c) c.innerHTML = html; }, MOCK_FORM);
  await new Promise(function(r) { setTimeout(r, 300); });

  var dChecks = await page.evaluate(function() {
    return {
      textAlign: getComputedStyle(document.querySelector('.hero-content')).textAlign,
      quoteGone: !document.body.innerHTML.includes('This is not decoration'),
      serviceColor: getComputedStyle(document.querySelector('.service-number')).color
    };
  });
  console.log('\n===== DESKTOP CHECKS (1440px) =====');
  console.log('Hero text-align:', dChecks.textAlign);
  console.log('Quote removed:', dChecks.quoteGone ? 'PASS' : 'FAIL');
  console.log('Service number color:', dChecks.serviceColor);

  await page.screenshot({ path: 'screenshots/vf-hero-1440.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
  var dAbout = await page.evaluate(function() { return document.getElementById('about').getBoundingClientRect().top + window.scrollY; });
  await page.screenshot({ path: 'screenshots/vf-about-1440.png', clip: { x: 0, y: dAbout, width: 1440, height: 600 } });
  var dServ = await page.evaluate(function() { return document.getElementById('services').getBoundingClientRect().top + window.scrollY; });
  await page.screenshot({ path: 'screenshots/vf-services-1440.png', clip: { x: 0, y: dServ + 80, width: 1440, height: 500 } });

  console.log('\nAll screenshots saved.');
  await browser.close();
}

run().catch(function(e) { console.error(e); process.exit(1); });
