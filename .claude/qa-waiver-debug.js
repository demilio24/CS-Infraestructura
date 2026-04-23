const puppeteer = require('puppeteer');

const URL = 'file:///F:/GitHub/Websites/Tom_Systema_Floyd/funnel/waiver.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 300));

  await page.click('.state-row[data-state="florida"]');
  await new Promise(r => setTimeout(r, 400));

  const info = await page.evaluate(() => {
    const body = document.getElementById('waiverBody');
    const loader = body.querySelector('.waiver-loader');
    const iframe = body.querySelector('iframe');
    const cs = loader ? getComputedStyle(loader) : null;
    const cs2 = iframe ? getComputedStyle(iframe) : null;
    return {
      loaderExists: !!loader,
      loaderOpacity: cs && cs.opacity,
      loaderVisibility: cs && cs.visibility,
      loaderZIndex: cs && cs.zIndex,
      loaderPosition: cs && cs.position,
      loaderBg: cs && cs.backgroundColor,
      loaderRect: loader ? { x:loader.getBoundingClientRect().x, y:loader.getBoundingClientRect().y, w:loader.getBoundingClientRect().width, h:loader.getBoundingClientRect().height } : null,
      bodyRect: { x:body.getBoundingClientRect().x, y:body.getBoundingClientRect().y, w:body.getBoundingClientRect().width, h:body.getBoundingClientRect().height },
      iframeRect: iframe ? { x:iframe.getBoundingClientRect().x, y:iframe.getBoundingClientRect().y, w:iframe.getBoundingClientRect().width, h:iframe.getBoundingClientRect().height } : null,
      iframeExists: !!iframe,
      iframeOpacity: cs2 && cs2.opacity,
      iframeZIndex: cs2 && cs2.zIndex,
      bodyReady: body.classList.contains('ready'),
      bodyHtml: body.innerHTML.substring(0, 300),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
