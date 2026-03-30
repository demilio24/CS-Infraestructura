const puppeteer = require('./node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({headless:'new'});
  const p = await b.newPage();
  await p.setViewport({width:1400, height:900});
  await p.goto('file:///f:/GitHub/CS-Infraestructura/Nils/funnel/review.html', {waitUntil:'networkidle2', timeout:60000});
  // Scroll to the proof-grid to trigger lazy loading
  await p.evaluate(() => {
    const el = document.querySelector('.proof-grid');
    if (el) el.scrollIntoView({block:'center'});
  });
  await new Promise(r => setTimeout(r, 3000));
  const el = await p.$('.proof-grid');
  const box = await el.boundingBox();
  await p.screenshot({
    path: 'screenshots/proof-grid-check.png',
    clip: {x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40}
  });
  await b.close();
  console.log('done');
})();
