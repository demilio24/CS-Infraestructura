var puppeteer = require('puppeteer');

async function run() {
  var browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  var page = await browser.newPage();
  var results = [];

  function log(test, pass, detail) {
    var status = pass ? 'PASS' : 'FAIL';
    results.push({ test: test, status: status, detail: detail });
    console.log(status + ' - ' + test + (detail ? ' (' + detail + ')' : ''));
  }

  // ===== MOBILE TESTS (375px) =====
  console.log('\n===== MOBILE 375px =====\n');
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8899/Mandy_VeLUS_Design/home-v2.html', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(function(r) { setTimeout(r, 4000); });

  // TEST: Hamburger menu visible on mobile
  var hamburgerVisible = await page.evaluate(function() {
    var h = document.querySelector('.hamburger');
    return h && getComputedStyle(h).display !== 'none';
  });
  log('Hamburger visible on mobile', hamburgerVisible);

  // TEST: Desktop nav hidden on mobile
  var navLinksHidden = await page.evaluate(function() {
    var nl = document.querySelector('.nav-links');
    return nl && getComputedStyle(nl).display === 'none';
  });
  log('Desktop nav hidden on mobile', navLinksHidden);

  // TEST: Hamburger opens mobile menu
  await page.click('.hamburger');
  await new Promise(function(r) { setTimeout(r, 600); });
  var menuOpen = await page.evaluate(function() {
    return document.querySelector('.mobile-menu').classList.contains('open');
  });
  log('Hamburger click opens menu', menuOpen);
  await page.screenshot({ path: 'screenshots/vf-menu-open-375.png', clip: { x: 0, y: 0, width: 375, height: 812 } });

  // TEST: Menu has correct link order (Services, Portfolio, Process, Reviews)
  var menuLinks = await page.evaluate(function() {
    var links = document.querySelectorAll('.mobile-menu a:not(.nav-cta)');
    return Array.from(links).map(function(a) { return a.textContent.trim(); });
  });
  var correctOrder = menuLinks[0] === 'Services' && menuLinks[1] === 'Portfolio' && menuLinks[2] === 'Process' && menuLinks[3] === 'Reviews';
  log('Mobile menu link order correct', correctOrder, menuLinks.join(' > '));

  // TEST: Close mobile menu
  await page.click('.mobile-close');
  await new Promise(function(r) { setTimeout(r, 600); });
  var menuClosed = await page.evaluate(function() {
    return !document.querySelector('.mobile-menu').classList.contains('open');
  });
  log('Close button closes menu', menuClosed);

  // TEST: Scroll animations trigger
  await page.evaluate(function() {
    window.scrollTo(0, 2000);
  });
  await new Promise(function(r) { setTimeout(r, 1500); });
  var animTriggered = await page.evaluate(function() {
    var anims = document.querySelectorAll('.anim');
    var visible = 0;
    anims.forEach(function(el) { if (el.classList.contains('anim-visible')) visible++; });
    return { total: anims.length, visible: visible };
  });
  log('Scroll animations trigger', animTriggered.visible > 0, animTriggered.visible + '/' + animTriggered.total + ' visible');

  // TEST: Gallery filter pills work
  await page.evaluate(function() { window.scrollTo(0, document.getElementById('gallery').getBoundingClientRect().top + window.scrollY); });
  await new Promise(function(r) { setTimeout(r, 500); });

  // Count visible gallery items before filter
  var allItems = await page.evaluate(function() {
    return document.querySelectorAll('.gallery-item').length;
  });

  // Click "Bathroom" filter
  var filterClicked = await page.evaluate(function() {
    var pills = document.querySelectorAll('.gallery-pill');
    for (var i = 0; i < pills.length; i++) {
      if (pills[i].textContent.trim() === 'Bathroom') {
        pills[i].click();
        return true;
      }
    }
    return false;
  });
  await new Promise(function(r) { setTimeout(r, 600); });

  var bathroomItems = await page.evaluate(function() {
    var items = document.querySelectorAll('.gallery-item');
    var visible = 0;
    items.forEach(function(el) {
      if (getComputedStyle(el).display !== 'none' && getComputedStyle(el).opacity !== '0') visible++;
    });
    return visible;
  });
  log('Gallery filter works', filterClicked && bathroomItems < allItems, 'All:' + allItems + ' Bathroom:' + bathroomItems);

  // Click "All" to reset
  await page.evaluate(function() {
    var pills = document.querySelectorAll('.gallery-pill');
    pills[0].click();
  });
  await new Promise(function(r) { setTimeout(r, 600); });

  // TEST: Gallery lightbox opens on image click
  await page.evaluate(function() {
    var img = document.querySelector('.gallery-item');
    if (img) img.click();
  });
  await new Promise(function(r) { setTimeout(r, 600); });
  var lightboxOpen = await page.evaluate(function() {
    var lb = document.querySelector('.lightbox');
    return lb && getComputedStyle(lb).display !== 'none' && getComputedStyle(lb).opacity !== '0';
  });
  log('Gallery lightbox opens on click', lightboxOpen);
  if (lightboxOpen) {
    await page.screenshot({ path: 'screenshots/vf-lightbox-375.png', clip: { x: 0, y: 0, width: 375, height: 812 } });
  }

  // TEST: Lightbox closes
  await page.evaluate(function() {
    var lb = document.querySelector('.lightbox');
    if (lb) lb.click();
  });
  await new Promise(function(r) { setTimeout(r, 600); });
  var lightboxClosed = await page.evaluate(function() {
    var lb = document.querySelector('.lightbox');
    return !lb || getComputedStyle(lb).display === 'none' || getComputedStyle(lb).opacity === '0';
  });
  log('Lightbox closes on click', lightboxClosed);

  // TEST: openForm scrolls to form on mobile
  await page.evaluate(function() { window.scrollTo(0, 5000); });
  await new Promise(function(r) { setTimeout(r, 300); });
  var scrollBefore = await page.evaluate(function() { return window.scrollY; });
  await page.evaluate(function() { openForm(); });
  await new Promise(function(r) { setTimeout(r, 1500); });
  var scrollAfter = await page.evaluate(function() { return window.scrollY; });
  var formTop = await page.evaluate(function() {
    return document.querySelector('.hero-form-card').getBoundingClientRect().top + window.scrollY;
  });
  log('Get In Touch scrolls to form on mobile', Math.abs(scrollAfter - scrollBefore) > 100, 'scrolled from ' + Math.round(scrollBefore) + ' to ' + Math.round(scrollAfter) + ', form at ' + Math.round(formTop));

  // TEST: No horizontal overflow on mobile
  var hOverflow = await page.evaluate(function() {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  log('No horizontal overflow on mobile', !hOverflow, 'scrollWidth:' + await page.evaluate(function() { return document.documentElement.scrollWidth; }) + ' clientWidth:' + await page.evaluate(function() { return document.documentElement.clientWidth; }));

  // ===== DESKTOP TESTS (1440px) =====
  console.log('\n===== DESKTOP 1440px =====\n');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899/Mandy_VeLUS_Design/home-v2.html', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(function(r) { setTimeout(r, 4000); });

  // TEST: Desktop nav visible
  var navVisible = await page.evaluate(function() {
    var nl = document.querySelector('.nav-links');
    return nl && getComputedStyle(nl).display !== 'none';
  });
  log('Desktop nav visible', navVisible);

  // TEST: Hamburger hidden on desktop
  var hamburgerHidden = await page.evaluate(function() {
    var h = document.querySelector('.hamburger');
    return h && getComputedStyle(h).display === 'none';
  });
  log('Hamburger hidden on desktop', hamburgerHidden);

  // TEST: Nav link order matches section order
  var navLinks = await page.evaluate(function() {
    var links = document.querySelectorAll('.nav-links a:not(.nav-cta)');
    return Array.from(links).map(function(a) { return a.textContent.trim(); });
  });
  var navCorrect = navLinks[0] === 'Services' && navLinks[1] === 'Portfolio' && navLinks[2] === 'Process' && navLinks[3] === 'Reviews';
  log('Desktop nav link order correct', navCorrect, navLinks.join(' > '));

  // TEST: Footer link order
  var footerLinks = await page.evaluate(function() {
    var links = document.querySelectorAll('.footer-links a');
    return Array.from(links).map(function(a) { return a.textContent.trim(); });
  });
  var footerCorrect = footerLinks[0] === 'Services' && footerLinks[1] === 'Portfolio' && footerLinks[2] === 'Process' && footerLinks[3] === 'Reviews';
  log('Footer link order correct', footerCorrect, footerLinks.join(' > '));

  // TEST: Hero grid is 2 columns on desktop
  var heroGrid = await page.evaluate(function() {
    return getComputedStyle(document.querySelector('.hero-content')).gridTemplateColumns;
  });
  var isTwoCol = heroGrid.split(' ').length >= 2 && !heroGrid.includes('0px');
  log('Hero is 2-column on desktop', isTwoCol, heroGrid);

  // TEST: openForm scrolls to hero top on desktop
  await page.evaluate(function() { window.scrollTo(0, 5000); });
  await new Promise(function(r) { setTimeout(r, 300); });
  await page.evaluate(function() { openForm(); });
  await new Promise(function(r) { setTimeout(r, 1500); });
  var dScrollAfter = await page.evaluate(function() { return window.scrollY; });
  log('Get In Touch scrolls to hero on desktop', dScrollAfter < 200, 'scrollY: ' + Math.round(dScrollAfter));

  // TEST: Nav scroll effect (scrolled class)
  await page.evaluate(function() { window.scrollTo(0, 300); });
  await new Promise(function(r) { setTimeout(r, 500); });
  var navScrolled = await page.evaluate(function() {
    return document.querySelector('.nav').classList.contains('scrolled');
  });
  log('Nav gets scrolled class on scroll', navScrolled);

  // TEST: Modal opens
  var modalExists = await page.evaluate(function() {
    return !!document.querySelector('.modal-overlay');
  });
  if (modalExists) {
    await page.evaluate(function() {
      var overlay = document.querySelector('.modal-overlay');
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    });
    log('Modal overlay exists', true);
  } else {
    log('Modal overlay exists', false);
  }

  // TEST: No console errors
  var errors = [];
  page.on('pageerror', function(e) { errors.push(e.message); });
  await page.goto('http://localhost:8899/Mandy_VeLUS_Design/home-v2.html', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(function(r) { setTimeout(r, 3000); });
  log('No JS errors on load', errors.length === 0, errors.length > 0 ? errors.join('; ') : 'clean');

  // ===== SUMMARY =====
  var passed = results.filter(function(r) { return r.status === 'PASS'; }).length;
  var failed = results.filter(function(r) { return r.status === 'FAIL'; }).length;
  console.log('\n===== SUMMARY =====');
  console.log(passed + ' passed, ' + failed + ' failed out of ' + results.length + ' tests');
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(function(r) { return r.status === 'FAIL'; }).forEach(function(r) {
      console.log('  FAIL: ' + r.test + (r.detail ? ' - ' + r.detail : ''));
    });
  }

  await browser.close();
}

run().catch(function(e) { console.error(e); process.exit(1); });
