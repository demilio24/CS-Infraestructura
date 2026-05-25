// Screenshot every slide of presentation-audit.html in both EN and ES.
// Output: .claude/screenshots/audit-{en|es}-slide{1..7}.png

const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.resolve(__dirname, "..");
const FILE = "file:///" + path.join(ROOT, "Nils/presentation-audit.html").replace(/\\/g, "/");
const OUT = path.join(__dirname, "screenshots");
const TOTAL = 7;

// Single viewport mode (back-compat) when W env var is set; otherwise multi-viewport sweep.
const MULTI = !process.env.W;
const VIEWPORTS = MULTI
  ? [
      { tag: "1920", width: 1920, height: 1080, isMobile: false },
      { tag: "1440", width: 1440, height: 900, isMobile: false },
      { tag: "mobile", width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
    ]
  : [
      {
        tag: "custom",
        width: parseInt(process.env.W, 10),
        height: parseInt(process.env.H || "900", 10),
        isMobile: false,
      },
    ];

async function shoot(page, lang, viewportTag) {
  await page.evaluate((l) => {
    if (typeof setLang === "function") setLang(l);
  }, lang);
  await new Promise((r) => setTimeout(r, 250));

  await page.evaluate(() => {
    if (typeof goTo === "function") goTo(0);
  });

  for (let i = 0; i < TOTAL; i++) {
    if (i > 0) {
      await page.evaluate((n) => goTo(n), i);
    }
    await new Promise((r) => setTimeout(r, 450));
    const fname = MULTI
      ? `audit-${viewportTag}-${lang}-slide${i + 1}.png`
      : `audit-${lang}-slide${i + 1}.png`;
    const out = path.join(OUT, fname);
    await page.screenshot({ path: out, fullPage: false });
    console.log("✓", fname);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: !!vp.isMobile,
      hasTouch: !!vp.isMobile,
      deviceScaleFactor: vp.deviceScaleFactor || 1,
    });
    await page.goto(FILE, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));

    await shoot(page, "en", vp.tag);
    await shoot(page, "es", vp.tag);
    await page.close();
  }

  await browser.close();
  console.log("Done.");
})();
