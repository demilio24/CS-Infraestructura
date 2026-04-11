const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Scroll through all content first
  const totalH = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < totalH; y += 800) {
    await page.evaluate(y => window.scrollTo(0,y), y);
    await new Promise(r=>setTimeout(r,100));
  }

  // Scroll to about→programs transition and screenshot viewport
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight - 100);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/gap1-about-programs.png' });
  console.log('gap1 captured');

  // Scroll to programs→locations transition
  await page.evaluate(() => {
    const el = document.querySelector('#programs');
    if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight - 100);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/gap2-programs-locations.png' });
  console.log('gap2 captured');

  // Scroll to hero form card
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '.claude/screenshots/gap3-hero-form.png' });
  console.log('gap3 captured');

  // Check ALL transitions between sections
  const transitions = await page.evaluate(() => {
    const allWaves = document.querySelectorAll('.wave-divider, .goggles-deco');
    return Array.from(allWaves).map((el, i) => {
      const prev = el.previousElementSibling;
      const next = el.nextElementSibling;
      const rect = el.getBoundingClientRect();
      const prevRect = prev ? prev.getBoundingClientRect() : null;
      const nextRect = next ? next.getBoundingClientRect() : null;
      const gapAbove = prevRect ? Math.round(rect.top - prevRect.bottom) : null;
      const gapBelow = nextRect ? Math.round(nextRect.top - rect.bottom) : null;
      return {
        index: i,
        tag: el.className,
        gapAbove,
        gapBelow,
        bg: el.style.background || el.style.backgroundColor
      };
    });
  });
  console.log('Transition gaps:');
  transitions.forEach(t => {
    if (t.gapAbove > 0 || t.gapBelow > 0) {
      console.log('  GAP FOUND #' + t.index + ': above=' + t.gapAbove + 'px, below=' + t.gapBelow + 'px (' + t.tag + ')');
    }
  });

  await browser.close();
  console.log('Done');
})();
