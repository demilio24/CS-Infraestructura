const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8099/Josie-David_CenterLaneSwim/home.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(y => window.scrollTo(0,y), y); await new Promise(r=>setTimeout(r,100)); }

  // Screenshot the about→programs transition area
  const aboutSection = await page.$('#about');
  const aboutBox = await aboutSection.boundingBox();
  // Capture from bottom of about through top of programs
  await page.screenshot({
    path: '.claude/screenshots/gap-about-programs.png',
    clip: { x: 0, y: aboutBox.y + aboutBox.height - 50, width: 1440, height: 300 }
  });
  console.log('gap-about-programs captured');

  // Screenshot the programs→locations transition
  const progsSection = await page.$('#programs');
  const progsBox = await progsSection.boundingBox();
  await page.screenshot({
    path: '.claude/screenshots/gap-programs-locations.png',
    clip: { x: 0, y: progsBox.y + progsBox.height - 50, width: 1440, height: 300 }
  });
  console.log('gap-programs-locations captured');

  // Screenshot hero form card top
  const formCard = await page.$('#hero-form');
  const formBox = await formCard.boundingBox();
  await page.screenshot({
    path: '.claude/screenshots/form-card-top.png',
    clip: { x: formBox.x - 10, y: formBox.y - 10, width: formBox.width + 20, height: 200 }
  });
  console.log('form-card-top captured');

  // Get ALL wave divider transitions to check for gaps
  const dividers = await page.$$('.wave-divider');
  for (let i = 0; i < dividers.length; i++) {
    const box = await dividers[i].boundingBox();
    if (box) {
      await page.screenshot({
        path: '.claude/screenshots/wave-' + i + '.png',
        clip: { x: 0, y: Math.max(0, box.y - 20), width: 1440, height: box.height + 40 }
      });
      console.log('wave-' + i + ' at y=' + Math.round(box.y));
    }
  }

  await browser.close();
  console.log('Done');
})();
