const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.resolve(__dirname, "..");
const FILE = "file:///" + path.join(ROOT, "Nils/sample-blueprint-systema-floyd.html").replace(/\\/g, "/");
const OUT = path.join(__dirname, "screenshots");

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(FILE, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    const c = document.querySelector("#components .component");
    if (c) c.scrollIntoView({ block: "start" });
    window.scrollBy(0, -80);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, "blueprint-tech-closed.png"), fullPage: false });
  console.log("closed done");

  await page.evaluate(() => {
    const d = document.querySelector("details.tech");
    if (d) d.open = true;
    d.scrollIntoView({ block: "start" });
    window.scrollBy(0, -100);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, "blueprint-tech-open.png"), fullPage: false });
  console.log("open done");

  await browser.close();
})();
