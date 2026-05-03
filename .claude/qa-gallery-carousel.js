const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, 'screenshots', 'centerlane-gallery');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8765/Josie-David_CenterLaneSwim/home.html';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  async function runViewport(label, w, h, isMobile) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile, hasTouch: isMobile });
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to gallery
    await page.evaluate(() => document.querySelector('#gallery')?.scrollIntoView({ block: 'start' }));
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT, `${label}-gallery-section.png`) });

    // Capture the marquee at 2 different points (animation progress) to prove it's scrolling
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT, `${label}-gallery-scrolled.png`) });

    // Count rendered slides + verify duplication
    const stats = await page.evaluate(() => {
      const track = document.getElementById('galleryTrack');
      if (!track) return null;
      const slides = track.querySelectorAll('.gallery-slide');
      const firstSlideUrl = slides[0]?.getAttribute('data-full');
      const uniqueUrls = new Set(Array.from(slides).map(s => s.getAttribute('data-full')));
      return {
        total: slides.length,
        unique: uniqueUrls.size,
        firstUrl: firstSlideUrl,
        hasAnimation: getComputedStyle(track).animationName !== 'none',
        animationDuration: getComputedStyle(track).animationDuration,
      };
    });

    // Click the first real slide to open lightbox
    try {
      await page.evaluate(() => {
        document.querySelector('.gallery-slide')?.click();
      });
      await new Promise(r => setTimeout(r, 700));
      await page.screenshot({ path: path.join(OUT, `${label}-lightbox-open.png`) });

      // Navigate next
      await page.evaluate(() => document.getElementById('lightboxNext')?.click());
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUT, `${label}-lightbox-next.png`) });

      // Close via keyboard Escape
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 400));
      const closed = await page.evaluate(() => !document.getElementById('galleryLightbox').classList.contains('open'));
      console.log(`[${label}] lightbox closed via Escape:`, closed);
    } catch (e) {
      console.warn(`[${label}] lightbox interaction failed:`, e.message);
    }

    // Verify Get In Touch CTA is mailto
    const cta = await page.evaluate(() => {
      const team = document.querySelector('.team-hire a');
      return team ? { href: team.getAttribute('href'), text: team.textContent.trim() } : null;
    });

    await page.close();
    return { stats, cta };
  }

  const desktop = await runViewport('desktop', 1440, 900, false);
  const mobile  = await runViewport('mobile',  390, 844, true);

  console.log('\n=== DESKTOP ===');
  console.log(JSON.stringify(desktop, null, 2));
  console.log('\n=== MOBILE ===');
  console.log(JSON.stringify(mobile, null, 2));

  const checks = [
    ['Desktop: 64 slides rendered (32 x 2 duplication)', desktop.stats?.total === 64],
    ['Desktop: 32 unique images',                         desktop.stats?.unique === 32],
    ['Desktop: animation running',                        desktop.stats?.hasAnimation === true],
    ['Desktop: animation duration reasonable (>60s)',     parseFloat(desktop.stats?.animationDuration) >= 60],
    ['Mobile: 64 slides rendered',                        mobile.stats?.total === 64],
    ['Mobile: 32 unique',                                 mobile.stats?.unique === 32],
    ['Mobile: animation running',                         mobile.stats?.hasAnimation === true],
    ['Team CTA is mailto:',                               desktop.cta?.href?.startsWith('mailto:')],
    ['Team CTA goes to ew@centerlaneswim.com',            desktop.cta?.href?.includes('ew@centerlaneswim.com')],
  ];
  console.log('\n=== CHECKS ===');
  let fails = 0;
  for (const [label, pass] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
    if (!pass) fails++;
  }
  console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILURE(S)'}`);

  await browser.close();
})();
