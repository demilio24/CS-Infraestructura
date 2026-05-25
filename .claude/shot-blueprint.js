// Screenshot the sample blueprint at 3 viewports for visual verification.
// Captures hero + a mid-page section + the footer CTA from each viewport.

const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.resolve(__dirname, "..");
const FILE = "file:///" + path.join(ROOT, "Nils/sample-blueprint-systema-floyd.html").replace(/\\/g, "/");
const OUT = path.join(__dirname, "screenshots");

const VIEWPORTS = [
  { tag: "1920", width: 1920, height: 1080, isMobile: false },
  { tag: "1440", width: 1440, height: 900, isMobile: false },
  { tag: "mobile", width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
];

const SHOTS = [
  { name: "hero", anchor: null, scroll: 0 },
  { name: "exec", anchor: "#exec", scroll: 0 },
  { name: "diagnosis", anchor: "#diagnosis", scroll: 0 },
  { name: "components", anchor: "#components", scroll: 0 },
  { name: "component-open", anchor: "#components", scroll: 300, openTech: true },
  { name: "build", anchor: "#build", scroll: 0 },
  { name: "risk", anchor: "#risk", scroll: 0 },
  { name: "footer", anchor: "#appendix", scroll: 4000 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });

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

    for (const shot of SHOTS) {
      if (shot.openTech) {
        await page.evaluate(() => {
          const d = document.querySelector("details.tech");
          if (d) d.open = true;
        });
      }
      if (shot.anchor) {
        await page.evaluate((sel, sc) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ block: "start" });
          window.scrollBy(0, sc);
        }, shot.anchor, shot.scroll);
        await new Promise((r) => setTimeout(r, 250));
      } else {
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 200));
      }
      const fname = `blueprint-${vp.tag}-${shot.name}.png`;
      await page.screenshot({ path: path.join(OUT, fname), fullPage: false });
      console.log("✓", fname);
    }

    await page.close();
  }

  await browser.close();
  console.log("Done.");
})();
