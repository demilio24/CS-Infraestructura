// Screenshot every slide of presentation-audit.html in both EN and ES.
// Output: .claude/screenshots/audit-{en|es}-slide{1..7}.png

const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.resolve(__dirname, "..");
const FILE = "file:///" + path.join(ROOT, "Nils/presentation-audit.html").replace(/\\/g, "/");
const OUT = path.join(__dirname, "screenshots");
const TOTAL = 7;
const VIEWPORT = { width: 1440, height: 900 };

async function shoot(page, lang) {
  await page.evaluate((l) => {
    if (typeof setLang === "function") setLang(l);
  }, lang);
  await new Promise((r) => setTimeout(r, 250));

  // Jump to slide 1
  await page.evaluate(() => {
    if (typeof goTo === "function") goTo(0);
  });

  for (let i = 0; i < TOTAL; i++) {
    if (i > 0) {
      await page.evaluate((n) => goTo(n), i);
    }
    await new Promise((r) => setTimeout(r, 450));
    const out = path.join(OUT, `audit-${lang}-slide${i + 1}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log("✓", `audit-${lang}-slide${i + 1}.png`);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(FILE, { waitUntil: "networkidle0" });

  // Wait a tick for fonts
  await new Promise((r) => setTimeout(r, 600));

  await shoot(page, "en");
  await shoot(page, "es");

  await browser.close();
  console.log("Done.");
})();
