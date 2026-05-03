const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://www.systemafloyd.com/class-schedule', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(async () => {
    await new Promise((r) => {
      let total = 0;
      const dist = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, dist);
        total += dist;
        if (total >= document.body.scrollHeight) { clearInterval(timer); r(); }
      }, 180);
    });
  });
  await new Promise(r => setTimeout(r, 3000));

  const items = await page.evaluate(() => {
    // Walk the document in order; for every <img>, find nearest following text block
    const imgs = Array.from(document.querySelectorAll('img')).filter(i => {
      const s = (i.currentSrc || i.src || '');
      return s.includes('editmysite.com') && !/logo|Fav|splash|icon_/i.test(s);
    });
    const nodeIndex = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let idx = 0;
    while (walker.nextNode()) { nodeIndex.set(walker.currentNode, idx++); }
    function findSchoolTextAfter(imgEl) {
      // Find the closest text containing a school-like line within ancestor chain
      let ctx = imgEl.closest('[class*="col"], [class*="card"], [class*="block"], section, article, div');
      // look for text in the same block first
      const blocks = [];
      if (ctx) blocks.push(ctx);
      // include next siblings of ancestors
      let node = imgEl;
      for (let up = 0; up < 4 && node; up++) {
        let sib = node.nextElementSibling;
        while (sib) { blocks.push(sib); sib = sib.nextElementSibling; }
        node = node.parentElement;
      }
      for (const b of blocks) {
        const t = (b.innerText || b.textContent || '').trim();
        if (!t || t.length < 3) continue;
        // first line
        const firstLine = t.split('\n').map(s => s.trim()).find(s => s && s.length < 120 && !/(enroll|join|register)/i.test(s));
        if (firstLine) return firstLine;
      }
      return '';
    }
    return imgs.map(img => ({
      src: (img.currentSrc || img.src).split('?')[0],
      label: findSchoolTextAfter(img),
      alt: img.alt || ''
    }));
  });
  console.log(JSON.stringify(items, null, 2));
  await browser.close();
})();
