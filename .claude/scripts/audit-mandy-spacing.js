// Audit specific spacing issues on Mandy v5 — 3 captures + bbox dumps.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', '..', 'Mandy_VeLUS_Design', 'v5.html').replace(/\\/g, '/');
const SHOTS = path.resolve(__dirname, '..', 'screenshots', 'audit-2026-04-25');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  // ---- 1. About page below "Founder & Principal Designer" — desktop + mobile ----
  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      sessionStorage.setItem('vp', 'about');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-about').classList.add('active');
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 400));
    // scroll the identity block into view
    await page.evaluate(() => {
      const el = document.querySelector('.about-identity');
      if (el) el.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -120);
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SHOTS, `about-identity-${name}.png`) });

    const bbox = await page.evaluate(() => {
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { sel, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
      };
      const role = document.querySelector('.about-identity .role');
      const ruleAfter = role ? getComputedStyle(role, '::after') : null;
      return {
        identity: pick('.about-identity'),
        role: pick('.about-identity .role'),
        bio: pick('.about-bio'),
        firstBioP: pick('.about-bio p:first-child'),
        ruleMargin: ruleAfter ? `${ruleAfter.marginTop} / ${ruleAfter.marginBottom}` : null,
        bioPaddingTop: getComputedStyle(document.querySelector('.about-bio')).paddingTop,
      };
    });
    console.log(`ABOUT IDENTITY ${name.toUpperCase()}`, JSON.stringify(bbox, null, 2));
    await page.close();
  }

  // ---- 2. Services page bottom: process → INQUIRY → footer ----
  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      sessionStorage.setItem('vp', 'services');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-services').classList.add('active');
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SHOTS, `services-bottom-${name}.png`) });

    const bbox = await page.evaluate(() => {
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { sel, top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
      };
      return {
        lastStep: pick('.process-step:last-child'),
        processWrap: pick('.process-wrap'),
        aboutExit: pick('.about-exit'),
        ctaWrap: pick('.about-exit .cta-wrap'),
        cta: pick('.about-exit .cta'),
        footer: pick('footer'),
        // Gaps:
        // a = bottom of process-wrap → top of about-exit (or cta inside)
        // b = bottom of cta → top of footer
      };
    });
    console.log(`SERVICES BOTTOM ${name.toUpperCase()}`, JSON.stringify(bbox, null, 2));
    await page.close();
  }

  // ---- 3. Collections viewer (close button alignment) — desktop ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(FILE_URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      sessionStorage.setItem('vp', 'collections');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-collections').classList.add('active');
      // open the viewer with the first project
      if (typeof openViewer === 'function') {
        openViewer(0);
      } else {
        // fallback: click the first .coll-item if present
        const item = document.querySelector('.coll-item');
        if (item) item.click();
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SHOTS, 'viewer-desktop.png') });

    const bbox = await page.evaluate(() => {
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { sel, top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left), height: Math.round(r.height) };
      };
      return {
        meta: pick('#viewer .meta'),
        metaName: pick('#viewer .meta .n'),
        metaLoc: pick('#viewer .meta .l'),
        close: pick('#viewer .close'),
        counter: pick('#viewer .counter'),
      };
    });
    console.log('VIEWER DESKTOP', JSON.stringify(bbox, null, 2));
    await page.close();
  }

  await browser.close();
  console.log('Saved screenshots to:', SHOTS);
})();
