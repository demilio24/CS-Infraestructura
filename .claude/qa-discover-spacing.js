const puppeteer = require('puppeteer');
const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));

  const data = await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(e => e.classList.add('in'));
    const paragraphs = document.querySelectorAll('section.statement .body p');
    const lastP = paragraphs[paragraphs.length - 1];
    const cta = document.querySelector('section.statement .cta');
    const ctaWrap = document.querySelector('section.statement .cta-wrap');
    const hr = document.querySelector('section.work-section .section-head hr.rule, section.work-section hr.rule');
    const rects = {
      lastParagraph: lastP.getBoundingClientRect(),
      cta: cta.getBoundingClientRect(),
      ctaWrap: ctaWrap.getBoundingClientRect(),
      hrRule: hr ? hr.getBoundingClientRect() : null
    };
    return {
      gapAboveDiscover_pBottom_to_ctaTop: rects.cta.top - rects.lastParagraph.bottom,
      gapBelowDiscover_ctaBottom_to_hr: rects.hrRule ? rects.hrRule.top - rects.cta.bottom : null,
      gap_ctaWrapBottom_to_hr: rects.hrRule ? rects.hrRule.top - rects.ctaWrap.bottom : null,
      ctaHeight: rects.cta.height,
      ctaTop: rects.cta.top,
      ctaBottom: rects.cta.bottom,
      lastParaBottom: rects.lastParagraph.bottom,
      hrTop: rects.hrRule ? rects.hrRule.top : null
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
