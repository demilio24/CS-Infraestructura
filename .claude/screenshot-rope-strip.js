const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file:///F:/GitHub/Websites/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.querySelectorAll('.anim').forEach(el => el.classList.add('visible')));

  const dividers = await page.$$('.rope-divider');
  console.log(`Found ${dividers.length} dividers`);

  for (let i = 0; i < dividers.length; i++) {
    // Use page.evaluate to get position so we can scroll precisely
    const info = await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return {
        height: r.height,
        topPage: r.top + window.scrollY,
        widthPage: r.width,
        bgColor: cs.backgroundColor,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom
      };
    }, i);
    console.log(`Divider ${i}:`, JSON.stringify(info));

    // Scroll so the divider's CENTER lands at viewport y=450 (near middle of 900px tall viewport)
    await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      const r = d.getBoundingClientRect();
      const center = r.top + window.scrollY + r.height / 2;
      window.scrollTo(0, center - 450);
    }, i);
    await new Promise(r => setTimeout(r, 400));

    // Capture a vertical strip 200px tall centered on the divider, full width
    const clip = await page.evaluate((idx) => {
      const d = document.querySelectorAll('.rope-divider')[idx];
      const r = d.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      return { x: 0, y: Math.max(0, cy - 100), width: 1440, height: 200 };
    }, i);
    await page.screenshot({ path: `F:/GitHub/Websites/.claude/screenshots/clss-rope-strip-${i}.png`, clip });
  }

  await browser.close();
})();
