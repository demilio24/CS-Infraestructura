const puppeteer = require('puppeteer');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.getElementById('entry').style.display = 'none';
    const nav = document.getElementById('nav');
    nav.classList.remove('dark', 'inverted');
    nav.classList.add('solid');
  });
  await new Promise(r => setTimeout(r, 1500));

  const m = await page.evaluate(() => {
    const r = el => el.getBoundingClientRect();
    const navEl = document.querySelector('nav.top');
    const logoEl = document.querySelector('.nav-logo img.nav-logo-dark');
    const trigEl = document.querySelector('.nav-trigger');
    return {
      nav: { top: r(navEl).top, bottom: r(navEl).bottom, height: r(navEl).height, centerY: r(navEl).top + r(navEl).height / 2 },
      logo: { top: r(logoEl).top, bottom: r(logoEl).bottom, height: r(logoEl).height, centerY: r(logoEl).top + r(logoEl).height / 2 },
      trigger: { top: r(trigEl).top, bottom: r(trigEl).bottom, height: r(trigEl).height, centerY: r(trigEl).top + r(trigEl).height / 2 },
    };
  });

  console.log(JSON.stringify(m, null, 2));
  console.log('\n--- Vertical centers ---');
  console.log('Nav center:', m.nav.centerY.toFixed(1));
  console.log('Logo center:', m.logo.centerY.toFixed(1));
  console.log('Trigger center:', m.trigger.centerY.toFixed(1));
  console.log('\n--- Logo top section (where VELUS / S sits) ---');
  // The logo image height is 60px; "VELUS" is in the top ~60% of that, so S center is ~30% from top
  console.log('Logo top:', m.logo.top.toFixed(1));
  console.log('Logo bottom:', m.logo.bottom.toFixed(1));
  console.log('Estimated VELUS line center (top 35% of logo):', (m.logo.top + m.logo.height * 0.35).toFixed(1));
  console.log('\n--- Misalignment from VELUS center ---');
  const velusCenter = m.logo.top + m.logo.height * 0.35;
  console.log('Trigger center vs VELUS center delta:', (m.trigger.centerY - velusCenter).toFixed(1), 'px (negative = trigger is above VELUS)');

  await browser.close();
})();
