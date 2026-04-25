// Capture a single project tile (Karkalis) on the collections page mobile.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'file:///F:/GitHub/Websites/Mandy_VeLUS_Design/v5.html';
const OUT = process.argv[2] || path.resolve(__dirname, '..', 'Mandy_VeLUS_Design', 'comparisons', 'collections-gradient-2026-04-24', 'image-eleven-real-mobile.png');
const TILE_INDEX = parseInt(process.argv[3] || '0', 10);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  await page.evaluate(() => {
    const e = document.getElementById('entry');
    if (e) { e.style.display = 'none'; }
  });

  // Click Collections nav to load the page
  await page.evaluate(() => {
    document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
    const c = document.getElementById('page-collections');
    if (c) c.classList.add('active');
    if (typeof buildColl === 'function') buildColl();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    document.querySelectorAll('.fu').forEach(el => el.classList.add('in'));
  });
  await new Promise(r => setTimeout(r, 200));

  // Find the Nth coll-item and screenshot it
  const rect = await page.evaluate((idx) => {
    const items = document.querySelectorAll('#collFeed .coll-item');
    const el = items[idx];
    if (!el) return null;
    el.scrollIntoView({ block: 'start' });
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  }, TILE_INDEX);

  if (!rect) { console.error(`No tile at index ${TILE_INDEX}`); process.exit(1); }
  console.log(`  tile[${TILE_INDEX}] doc y=${Math.round(rect.top)} h=${Math.round(rect.height)}`);

  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, rect.top));
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`saved ${path.basename(OUT)}`);
  await browser.close();
})();
