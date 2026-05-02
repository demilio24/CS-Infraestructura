/**
 * Baseline audit for automation-vsl-direct-bg-matrix.html
 *  - Desktop 1440x900 + Mobile 390x844 + Mobile 320x568 + Tablet 768x1024
 *  - Capture: full-page screenshots (capped at 2000px tall via stitched sections), console errors,
 *    horizontal overflow at every viewport, tap targets < 44px, font sizes < 14px on mobile,
 *    LCP-like timing, image weight, JS errors.
 */
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const URL = "http://localhost:8099/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html";
const OUT = path.join(__dirname, "screenshots");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "tablet-768",   width: 768,  height: 1024, mobile: false },
  { name: "mobile-414",   width: 414,  height: 896, mobile: true },
  { name: "mobile-390",   width: 390,  height: 844, mobile: true },
  { name: "mobile-375",   width: 375,  height: 667, mobile: true },
  { name: "mobile-320",   width: 320,  height: 568, mobile: true },
];

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const report = { url: URL, viewports: {}, perf: {}, errors: [] };

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });

    const consoleErrs = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
    page.on("pageerror", (e) => consoleErrs.push("[pageerror] " + e.message));
    page.on("requestfailed", (r) => consoleErrs.push("[reqfail] " + r.url() + " " + r.failure()?.errorText));

    const t0 = Date.now();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500)); // let matrix canvas + fonts settle

    const tDone = Date.now() - t0;
    const pageW = vp.width;
    const data = await page.evaluate((PAGE_W) => {
      const docW = document.documentElement.scrollWidth;
      const docH = document.documentElement.scrollHeight;
      const overflowing = [];
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > PAGE_W + 1 && r.width > 8 && el.offsetParent !== null) {
          const cls = (el.className && typeof el.className === "string") ? el.className.slice(0, 60) : "";
          overflowing.push({ tag: el.tagName.toLowerCase(), cls, right: Math.round(r.right), width: Math.round(r.width) });
        }
      });
      // Tap targets
      const tinyTaps = [];
      document.querySelectorAll('a, button, input[type="submit"], [role="button"], .faq-q, .nav-link').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.height < 44 && el.offsetParent !== null) {
          tinyTaps.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || "").trim().slice(0, 30), h: Math.round(r.height) });
        }
      });
      // Tiny fonts
      const tinyFonts = [];
      document.querySelectorAll("p, li, span, a, button, label").forEach((el) => {
        if (!el.textContent || !el.textContent.trim()) return;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 13 && el.offsetParent !== null) {
          tinyFonts.push({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 30), fs });
        }
      });
      // Image weight
      const imgs = [...document.images].map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, lazy: i.loading === "lazy", alt: i.alt || "" }));
      return { docW, docH, overflowing: overflowing.slice(0, 25), tinyTaps: tinyTaps.slice(0, 20), tinyFonts: tinyFonts.slice(0, 20), imgs };
    }, pageW);

    // Stitched fullpage capture (cap 2000px tall — loop sections if too long)
    const screenshotPath = path.join(OUT, `automation-${vp.name}.png`);
    const heightCap = 2000;
    if (data.docH <= heightCap) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } else {
      // Take just top, mid, and bottom snapshots
      const sections = [
        { name: "top", y: 0 },
        { name: "mid", y: Math.round(data.docH / 2 - heightCap / 2) },
        { name: "bot", y: Math.max(0, data.docH - heightCap) },
      ];
      for (const s of sections) {
        await page.evaluate((y) => window.scrollTo(0, y), s.y);
        await new Promise(r => setTimeout(r, 350));
        await page.screenshot({ path: path.join(OUT, `automation-${vp.name}-${s.name}.png`), clip: { x: 0, y: 0, width: vp.width, height: Math.min(heightCap, vp.height) } });
      }
    }

    report.viewports[vp.name] = { ...data, consoleErrs, tDone };
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "automation-baseline-report.json"), JSON.stringify(report, null, 2));
  // Compact summary to stdout
  for (const [name, r] of Object.entries(report.viewports)) {
    console.log(`\n=== ${name} (${r.docW}x${r.docH}, ${r.tDone}ms) ===`);
    console.log("overflow elements:", r.overflowing.length);
    if (r.overflowing.length) console.log(JSON.stringify(r.overflowing, null, 2));
    console.log("tap < 44px:", r.tinyTaps.length);
    if (r.tinyTaps.length) console.log(JSON.stringify(r.tinyTaps.slice(0, 8), null, 2));
    console.log("font < 13px:", r.tinyFonts.length);
    if (r.tinyFonts.length) console.log(JSON.stringify(r.tinyFonts.slice(0, 8), null, 2));
    console.log("console errors:", r.consoleErrs.length);
    if (r.consoleErrs.length) console.log(r.consoleErrs.join("\n"));
  }
  console.log("\n[done] baseline written");
})();
