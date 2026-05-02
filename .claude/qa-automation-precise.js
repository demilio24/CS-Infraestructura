/**
 * Precise check at mobile-390:
 *   - Document horizontal scroll? (does page scroll horizontally?)
 *   - Buttons reported at h=40: which ones, are they actually visible/touch-relevant?
 *   - audit-stat tablet 768: is .audit-stats overflowing or is it just an inner span?
 */
const puppeteer = require("puppeteer");
const URL = "http://localhost:8099/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html";

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

  for (const [name, w, h] of [
    ["mobile-390", 390, 844],
    ["tablet-768", 768, 1024],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, isMobile: name.startsWith("mobile") });
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 1200));

    const result = await page.evaluate((W) => {
      const out = {};
      out.docScrollWidth = document.documentElement.scrollWidth;
      out.bodyScrollWidth = document.body.scrollWidth;
      out.viewport = W;
      out.hasHScroll = out.docScrollWidth > W + 1;

      // Check the diff-cmp-wrap clipping: is its parent constraining the table?
      const wrap = document.querySelector(".diff-cmp-wrap");
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        const cs = getComputedStyle(wrap);
        out.diffCmpWrap = {
          right: Math.round(r.right),
          width: Math.round(r.width),
          overflowX: cs.overflowX,
          tableScrolls: wrap.scrollWidth > wrap.clientWidth,
        };
      }

      // .audit-stat at 768
      const stat = document.querySelector(".audit-stat");
      if (stat) {
        const r = stat.getBoundingClientRect();
        const cs = getComputedStyle(stat);
        out.firstAuditStat = {
          right: Math.round(r.right),
          width: Math.round(r.width),
          padding: cs.padding,
        };
        const stats = document.querySelector(".audit-stats");
        if (stats) {
          const r2 = stats.getBoundingClientRect();
          out.auditStatsContainer = {
            right: Math.round(r2.right),
            width: Math.round(r2.width),
          };
        }
      }

      // Specific h=40 buttons — list them with classes + visible state + parent
      const tinyBtns = [];
      document.querySelectorAll("button").forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.height > 0 && r.height < 44 && b.offsetParent !== null) {
          const cs = getComputedStyle(b);
          // is it under display:none ancestor? offsetParent already handles that
          tinyBtns.push({
            cls: b.className.slice(0, 60),
            text: (b.textContent || "").trim().slice(0, 30),
            h: Math.round(r.height),
            w: Math.round(r.width),
            minH: cs.minHeight,
            padding: cs.padding,
            parentCls: (b.parentElement?.className || "").toString().slice(0, 60),
          });
        }
      });
      out.tinyBtns = tinyBtns;
      return out;
    }, w);

    console.log(`\n=== ${name} (vp ${w}x${h}) ===`);
    console.log(JSON.stringify(result, null, 2));
    await page.close();
  }

  await browser.close();
})();
