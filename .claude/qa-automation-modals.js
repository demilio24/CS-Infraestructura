/**
 * Open both modals on mobile-390 and check tap targets only when visible.
 */
const puppeteer = require("puppeteer");
const URL = "http://localhost:8099/NILS-FUNNELS/Automation/automation-vsl-direct-bg-matrix.html";

(async () => {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

  // Use 768 viewport because the apply modal redirects to live calendar URL on <768
  const page = await browser.newPage();
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 1000));

  // Open the video testimonial modal directly via JS
  await page.evaluate(() => window.openVideoModal && window.openVideoModal());
  await new Promise(r => setTimeout(r, 500));

  const videoModalCheck = await page.evaluate(() => {
    const modal = document.querySelector("#video-modal");
    const visible = modal && modal.classList.contains("open");
    const close = modal?.querySelector(".modal-close");
    if (!close) return { visible, error: "no close" };
    const r = close.getBoundingClientRect();
    const cs = getComputedStyle(close);
    return {
      visible,
      close_h: Math.round(r.height),
      close_w: Math.round(r.width),
      close_declared_h: cs.height,
      close_declared_w: cs.width,
      close_padding: cs.padding,
      close_box_sizing: cs.boxSizing,
      close_border: cs.border,
    };
  });
  console.log("=== video modal close ===");
  console.log(JSON.stringify(videoModalCheck, null, 2));

  // Take a screenshot of the open video modal
  await page.screenshot({ path: "f:/GitHub/Websites/.claude/screenshots/automation-videomodal-open-768.png" });

  // Close it
  await page.evaluate(() => window.closeVideoModal && window.closeVideoModal());
  await new Promise(r => setTimeout(r, 500));

  // Open the apply modal
  await page.evaluate(() => window.openModal && window.openModal());
  await new Promise(r => setTimeout(r, 700));

  const applyModalCheck = await page.evaluate(() => {
    const modal = document.querySelector("#apply-modal");
    const visible = modal && modal.classList.contains("open");
    const close = modal?.querySelector(".modal-close");
    if (!close) return { visible, error: "no close" };
    const r = close.getBoundingClientRect();
    const cs = getComputedStyle(close);
    return {
      visible,
      close_h: Math.round(r.height),
      close_w: Math.round(r.width),
      close_declared_h: cs.height,
      close_declared_w: cs.width,
    };
  });
  console.log("=== apply modal close ===");
  console.log(JSON.stringify(applyModalCheck, null, 2));
  await page.screenshot({ path: "f:/GitHub/Websites/.claude/screenshots/automation-applymodal-open-768.png" });

  await browser.close();
})();
