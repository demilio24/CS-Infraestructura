// Pixel-accurate contrast audit.
// For each text-bearing leaf, hide it (visibility:hidden) and sample the actual
// rendered background pixel under its bbox from a full-page screenshot.
// This handles gradients, mesh backgrounds, and glassmorphism that DOM-walk misses.

const puppeteer = require('puppeteer');
const { PNG } = require('pngjs');
const fs = require('fs');

function lum(c) {
  const conv = v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * conv(c.r) + 0.7152 * conv(c.g) + 0.0722 * conv(c.b);
}
function contrast(a, b) {
  const L1 = lum(a), L2 = lum(b);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
}
function compose(over, under) {
  const a = over.a + under.a * (1 - over.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (over.r * over.a + under.r * under.a * (1 - over.a)) / a,
    g: (over.g * over.a + under.g * under.a * (1 - over.a)) / a,
    b: (over.b * over.a + under.b * under.a * (1 - over.a)) / a,
    a
  };
}

function samplePixel(png, x, y) {
  const idx = (Math.round(y) * png.width + Math.round(x)) << 2;
  return { r: png.data[idx], g: png.data[idx + 1], b: png.data[idx + 2], a: 1 };
}
function sampleAvg(png, rect) {
  // sample 9 points: 4 corners (insets), 4 edges, center — average
  const points = [];
  const inset = Math.max(2, Math.min(6, Math.floor(Math.min(rect.w, rect.h) / 4)));
  const xs = [rect.x + inset, rect.x + rect.w / 2, rect.x + rect.w - inset];
  const ys = [rect.y + inset, rect.y + rect.h / 2, rect.y + rect.h - inset];
  for (const x of xs) for (const y of ys) {
    if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
    points.push(samplePixel(png, x, y));
  }
  if (!points.length) return null;
  let r=0, g=0, b=0;
  for (const p of points) { r += p.r; g += p.g; b += p.b; }
  return { r: r/points.length, g: g/points.length, b: b/points.length, a: 1 };
}

async function audit(viewport) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.w, height: viewport.h });
  await page.goto('http://localhost:8099/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html', {
    waitUntil: 'domcontentloaded', timeout: 60000
  });
  await new Promise(r => setTimeout(r, 1500));

  // pre-warm
  const wrapH = await page.evaluate(() => document.getElementById('ghl-breakout').scrollHeight);
  for (let y = 0; y < wrapH; y += 600) {
    await page.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, y);
    await new Promise(r => setTimeout(r, 80));
  }
  await page.evaluate(() => { document.getElementById('ghl-breakout').scrollTop = 0; });
  await new Promise(r => setTimeout(r, 400));

  // Tag every text-bearing leaf (direct text node) with a unique id and capture metadata.
  const items = await page.evaluate(() => {
    const out = [];
    let counter = 0;
    const all = document.querySelectorAll('#ghl-breakout *');
    for (const el of all) {
      let direct = '';
      for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) direct += ' ' + n.textContent.trim();
      }
      direct = direct.trim();
      if (!direct || direct.length < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) continue;
      const wrap = document.getElementById('ghl-breakout');
      const wrapRect = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // store positions relative to the wrapper's content (so we can scroll to them later)
      const absTop = r.top - wrapRect.top + wrap.scrollTop;
      if (r.width < 4 || r.height < 4) continue;
      const id = '__qa' + (counter++);
      el.setAttribute('data-qa-id', id);
      out.push({
        id,
        text: direct.slice(0, 100),
        tag: el.tagName,
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        color: cs.color,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
        absTop,
        height: r.height,
        width: r.width,
        leftFromWrap: r.left - wrapRect.left
      });
    }
    return out;
  });

  console.log(viewport.n, 'tracked text leaves:', items.length);

  const results = [];
  // Group items by which "screen" they fit on, then for each screen:
  //  scroll wrapper, hide all items in the visible band, screenshot, sample bg per item.
  const screenH = viewport.h;
  // Sort by absTop
  items.sort((a, b) => a.absTop - b.absTop);

  let scrollTop = 0;
  while (scrollTop < wrapH) {
    const visible = items.filter(it => it.absTop + it.height > scrollTop && it.absTop < scrollTop + screenH);
    if (!visible.length) { scrollTop += screenH; continue; }

    // scroll, hide visible items, screenshot, then sample bg
    await page.evaluate(yy => { document.getElementById('ghl-breakout').scrollTop = yy; }, scrollTop);
    await new Promise(r => setTimeout(r, 200));

    await page.evaluate((ids) => {
      for (const id of ids) {
        const el = document.querySelector('[data-qa-id="' + id + '"]');
        if (el) el.style.visibility = 'hidden';
      }
    }, visible.map(v => v.id));
    await new Promise(r => setTimeout(r, 80));

    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: viewport.w, height: viewport.h } });
    const png = PNG.sync.read(buf);

    // restore
    await page.evaluate((ids) => {
      for (const id of ids) {
        const el = document.querySelector('[data-qa-id="' + id + '"]');
        if (el) el.style.visibility = '';
      }
    }, visible.map(v => v.id));

    for (const it of visible) {
      const yInScreen = it.absTop - scrollTop;
      // restrict sample rect to in-screen portion
      const top = Math.max(0, yInScreen);
      const bot = Math.min(viewport.h, yInScreen + it.height);
      if (bot - top < 4) continue;
      const sampleRect = {
        x: Math.max(0, it.leftFromWrap),
        y: top,
        w: Math.min(viewport.w - Math.max(0, it.leftFromWrap), it.width),
        h: bot - top
      };
      if (sampleRect.w < 4 || sampleRect.h < 4) continue;
      const bg = sampleAvg(png, sampleRect);
      if (!bg) continue;
      const tc = parseRgb(it.color);
      if (!tc) continue;
      // composite text color onto sampled bg if text has alpha
      const composed = compose(tc, bg);
      const ratio = contrast(composed, bg);
      const isLarge = it.fontSize >= 24 || (it.fontWeight >= 700 && it.fontSize >= 18.66);
      const minRatio = isLarge ? 3 : 4.5;
      if (ratio < minRatio) {
        results.push({
          id: it.id,
          text: it.text,
          tag: it.tag,
          cls: it.cls,
          color: it.color,
          bgSampled: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')',
          ratio: Math.round(ratio * 100) / 100,
          min: minRatio,
          fontSize: it.fontSize,
          fontWeight: it.fontWeight,
          severity: ratio < 1.5 ? 'invisible' : ratio < 2.5 ? 'severe' : 'low',
          absTop: it.absTop
        });
      }
    }

    scrollTop += screenH;
  }

  await browser.close();
  return results;
}

(async () => {
  const dResults = await audit({ n: 'desktop', w: 1440, h: 900 });
  fs.writeFileSync('screenshots/qa-pixel-desktop.json', JSON.stringify(dResults, null, 2));
  console.log('desktop issues:', dResults.length);

  const mResults = await audit({ n: 'mobile', w: 390, h: 844 });
  fs.writeFileSync('screenshots/qa-pixel-mobile.json', JSON.stringify(mResults, null, 2));
  console.log('mobile issues:', mResults.length);
})();