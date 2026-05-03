const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(async () => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const t = document.querySelector('.t');
    const short = t.querySelector('.t-short');
    const full = t.querySelector('.t-full');
    const btn = t.querySelector('.t-toggle');
    const shortInner = short.querySelector('.t-inner');
    const fullInner = full.querySelector('.t-inner');
    const cs = (el) => getComputedStyle(el);

    const closed = {
      short: { gridTemplateRows: cs(short).gridTemplateRows, opacity: cs(short).opacity, height: short.getBoundingClientRect().height },
      full: { gridTemplateRows: cs(full).gridTemplateRows, opacity: cs(full).opacity, height: full.getBoundingClientRect().height },
      shortInnerHeight: shortInner.getBoundingClientRect().height,
      fullInnerHeight: fullInner.getBoundingClientRect().height
    };

    btn.click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const opening = {
      short: { gridTemplateRows: cs(short).gridTemplateRows, opacity: cs(short).opacity, height: short.getBoundingClientRect().height },
      full: { gridTemplateRows: cs(full).gridTemplateRows, opacity: cs(full).opacity, height: full.getBoundingClientRect().height }
    };
    await new Promise(r => setTimeout(r, 300));
    const mid = {
      short: { height: short.getBoundingClientRect().height, opacity: cs(short).opacity },
      full: { height: full.getBoundingClientRect().height, opacity: cs(full).opacity }
    };
    await new Promise(r => setTimeout(r, 700));
    const open = {
      short: { gridTemplateRows: cs(short).gridTemplateRows, opacity: cs(short).opacity, height: short.getBoundingClientRect().height },
      full: { gridTemplateRows: cs(full).gridTemplateRows, opacity: cs(full).opacity, height: full.getBoundingClientRect().height }
    };

    return { closed, opening, mid, open };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
